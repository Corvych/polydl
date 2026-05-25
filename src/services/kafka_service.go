package services

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"polydl/repositories"

	"github.com/segmentio/kafka-go"
)

var (
	KafkaBrokers []string
)

func init() {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "kafka:9092"
	}
	KafkaBrokers = []string{brokers}
}

// StartKafkaConsumer listens for authorization events
func StartKafkaConsumer(userRepo *repositories.UserRepository) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   KafkaBrokers,
		Topic:     "user-authorization",
		Partition: 0,
		MaxBytes:  10e6, // 10MB
	})

	log.Println("Starting Kafka consumer for user-authorization topic")

	go func() {
		for {
			m, err := r.ReadMessage(context.Background())
			if err != nil {
				log.Printf("Error reading kafka message: %v\n", err)
				time.Sleep(5 * time.Second)
				continue
			}

			var payload struct {
				UserID    int64  `json:"user_id"`
				AuthToken string `json:"auth_token"`
				Action    string `json:"action"`
			}
			if err := json.Unmarshal(m.Value, &payload); err != nil {
				log.Printf("Error unmarshaling kafka payload: %v\n", err)
				continue
			}

			if payload.Action == "site_login" || payload.Action == "site_register" {
				// Find user by auth token
				user, err := userRepo.GetByTelegramAuthToken(payload.AuthToken)
				if err != nil {
					// Check if they are already linked
					if _, err := userRepo.GetByTelegramID(payload.UserID); err == nil {
						// Already linked, skip error
						continue
					}
					
					log.Printf("Invalid auth token received from telegram_id %d: %s\n", payload.UserID, payload.AuthToken)
					SendNotification(payload.UserID, "❌ Неверный или устаревший токен авторизации. Попробуйте еще раз с сайта.")
					continue
				}

				// Link telegram account
				user.TelegramID = &payload.UserID
				user.TelegramAuthToken = "" // Clear token
				if err := userRepo.Update(user); err != nil {
					log.Printf("Failed to link telegram account for user %d: %v\n", user.ID, err)
					SendNotification(payload.UserID, "❌ Ошибка при привязке аккаунта. Попробуйте позже.")
					continue
				}

				SendNotification(payload.UserID, "✅ **Аккаунт успешно привязан!**\nТеперь вы можете получать уведомления и просматривать дедлайны.")
			}
		}
	}()
}

// SendNotification publishes a message to the user-notifications topic
func SendNotification(userID int64, text string) {
	w := &kafka.Writer{
		Addr:     kafka.TCP(KafkaBrokers...),
		Topic:    "user-notifications",
		Balancer: &kafka.LeastBytes{},
	}
	defer w.Close()

	payload := map[string]interface{}{
		"user_id": userID,
		"text":    text,
	}
	payloadBytes, _ := json.Marshal(payload)

	err := w.WriteMessages(context.Background(),
		kafka.Message{
			Value: payloadBytes,
		},
	)
	if err != nil {
		log.Printf("Failed to send notification via kafka: %v\n", err)
	}
}
