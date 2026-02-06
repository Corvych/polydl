package services

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"

	"golang.org/x/crypto/argon2"
)

// Helpers for Argon2
func HashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		return "", err
	}

	// Argon2id parameters
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Return format: salt:hash (hex encoded)
	return hex.EncodeToString(salt) + ":" + hex.EncodeToString(hash), nil
}

func VerifyPassword(password, encodedHash string) bool {
	parts := bytes.Split([]byte(encodedHash), []byte(":"))
	if len(parts) != 2 {
		return false
	}

	salt, _ := hex.DecodeString(string(parts[0]))
	storedHash, _ := hex.DecodeString(string(parts[1]))

	newHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	return bytes.Equal(storedHash, newHash)
}
