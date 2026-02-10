package websocket

import (
	"strings"

	fastwebsocket "github.com/fasthttp/websocket"
	"github.com/gofiber/fiber/v3"
	"github.com/valyala/fasthttp"
)

// Upgrader handles WebSocket upgrades
var upgrader = fastwebsocket.FastHTTPUpgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(ctx *fasthttp.RequestCtx) bool {
		return true // Allow all origins for now
	},
}

// New returns a Fiber handler that upgrades the connection to WebSocket
func New(innerHandler func(fiber.Ctx, *fastwebsocket.Conn)) fiber.Handler {
	return func(c fiber.Ctx) error {
		err := upgrader.Upgrade(c.RequestCtx(), func(conn *fastwebsocket.Conn) {
			innerHandler(c, conn)
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
		}
		return nil
	}
}

// IsWebSocketUpgrade checks if the request is a WebSocket upgrade request
func IsWebSocketUpgrade(c fiber.Ctx) bool {
	return strings.EqualFold(string(c.Request().Header.Peek("Upgrade")), "websocket") &&
		(strings.EqualFold(string(c.Request().Header.Peek("Connection")), "Upgrade") ||
			strings.Contains(strings.ToLower(string(c.Request().Header.Peek("Connection"))), "upgrade"))
}
