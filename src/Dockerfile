# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git for fetch dependencies (if needed, though mostly handled by go mod)
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Run Stage
FROM alpine:latest

RUN apk add --no-cache tzdata ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Copy public assets if any (REST API might not need them, but keeping structure safe)
COPY --from=builder /app/public ./public
# Create directory if it didn't exist in source but code expects it
RUN mkdir -p public

# Expose port
EXPOSE 3000

# Run the binary
CMD ["./server"]
