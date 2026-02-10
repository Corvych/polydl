package websocket

import (
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	Clients map[*Client]bool
	Mu      sync.RWMutex

	// Inbound messages from the clients.
	BroadcastMsg chan []byte

	// Register requests from the clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		BroadcastMsg: make(chan []byte),
		Register:     make(chan *Client),
		Unregister:   make(chan *Client),
		Clients:      make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mu.Lock()
			h.Clients[client] = true
			h.Mu.Unlock()
		case client := <-h.Unregister:
			h.Mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
			h.Mu.Unlock()
		case message := <-h.BroadcastMsg:
			h.Mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					// If client is slow, we should unregister it to avoid blocking hub
					// We can't unregister here directly because we have RLock
					// But we can send it to the Unregister channel which will handle it in the next iteration
					go func(c *Client) {
						h.Unregister <- c
					}(client)
				}
			}
			h.Mu.RUnlock()
		}
	}
}

// Broadcast sends a message to all connected clients
func (h *Hub) Broadcast(message []byte) {
	h.BroadcastMsg <- message
}

// BroadcastToGroup sends a message to all clients in a specific group
func (h *Hub) BroadcastToGroup(groupID uint, message []byte) {
	h.Mu.RLock()
	defer h.Mu.RUnlock()
	for client := range h.Clients {
		if client.GroupID != nil && *client.GroupID == groupID {
			select {
			case client.Send <- message:
			default:
				go func(c *Client) {
					h.Unregister <- c
				}(client)
			}
		}
	}
}

// BroadcastToUser sends a message to a specific user
func (h *Hub) BroadcastToUser(userID uint, message []byte) {
	h.Mu.RLock()
	defer h.Mu.RUnlock()
	for client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
			default:
				go func(c *Client) {
					h.Unregister <- c
				}(client)
			}
		}
	}
}
