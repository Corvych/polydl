import os
import json
import asyncio
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092')
TOPIC_AUTH = os.getenv('KAFKA_TOPIC_AUTH', 'user-authorization')
TOPIC_DEADLINE = os.getenv('KAFKA_TOPIC_DEADLINE', 'deadline-creation')
TOPIC_NOTIFICATIONS = os.getenv('KAFKA_TOPIC_NOTIFICATIONS', 'user-notifications')

_producer = None

async def init_producer():
    global _producer
    if _producer is None:
        try:
            _producer = AIOKafkaProducer(
                bootstrap_servers=BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await _producer.start()
            print("[*] Kafka AIO Producer успешно инициализирован.")
        except Exception as e:
            print(f"[!] Ошибка инициализации Kafka Producer: {e}")

async def send_auth_deeplink(user_id: int, auth_token: str, action_type: str):
    """
    Отправка токена авторизации/регистрации из диплинка.
    action_type может быть "site_register" или "site_login"
    """
    if _producer is None:
        await init_producer()
    if _producer:
        payload = {
            "user_id": user_id,
            "auth_token": auth_token,
            "action": action_type
        }
        await _producer.send_and_wait(TOPIC_AUTH, value=payload)
        print(f"[*] В топик {TOPIC_AUTH} отправлено действие {action_type} для пользователя {user_id}")

async def send_deadline_request(user_id: int, text: str):
    """Отправка обработанного текстового запроса на создание дедлайна"""
    if _producer is None:
        await init_producer()
    if _producer:
        payload = {
            "user_id": user_id,
            "text": text,
            "action": "create_deadline"
        }
        await _producer.send_and_wait(TOPIC_DEADLINE, value=payload)
        print(f"[*] В топик {TOPIC_DEADLINE} отправлен запрос на дедлайн от пользователя {user_id}")

async def consume_notifications_loop(bot):
    """Фоновый поток для отправки серверных уведомлений пользователям"""
    try:
        consumer = AIOKafkaConsumer(
            TOPIC_NOTIFICATIONS,
            bootstrap_servers=BOOTSTRAP_SERVERS,
            auto_offset_reset='latest',
            enable_auto_commit=True,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        await consumer.start()
        print("[*] Kafka AIO Consumer для уведомлений запущен.")
        try:
            async for message in consumer:
                data = message.value
                user_id = data.get("user_id")
                notification_text = data.get("text")
                
                if user_id and notification_text:
                    try:
                        await bot.send_message(user_id, f"🔔 **Уведомление PolyDL:**\n\n{notification_text}", parse_mode='Markdown')
                    except Exception as tg_err:
                        print(f"[!] Ошибка отправки в ТГ для {user_id}: {tg_err}")
        finally:
            await consumer.stop()
    except Exception as e:
        print(f"[!] Ошибка консьюмера Kafka: {e}")