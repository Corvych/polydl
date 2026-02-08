import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const { token } = useAuth();
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    useEffect(() => {
        if (!token) return;

        const connect = () => {
            // In development, Vite proxys /api to backend, but usually WS needs explicit handling or full URL.
            // Since we are using Nginx routing /api -> backend, we can try connecting to /api/ws
            // Use wss if https, ws if http
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host; // e.g. localhost or domain.com
            // Note: Our Nginx routes /api/ prefix to backend. Backend has route /ws.
            // So we should connect to /api/ws.
            const url = `${protocol}//${host}/api/ws`;

            // Append token to query params for authentication (if we implement query param auth in middleware)
            // Or rely on cookies if setup. But simple way is header, but standard JS WebSocket API doesn't support custom headers.
            // So we usually pass token in query param or initial message.
            // Our backend middleware "getUserIdFromToken" usually checks header "Authorization".
            // We need to update backend middleware to ALSO check query param "token" if we want to auth WS this way.
            // Let's assume we will pass it as ?token=... and valid it in backend.
            // Wait, "getUserIdFromToken" in backend (handlers/deadlines.go) only checks Header currently.
            // We need to update backend to check Query param too? Or just use "Upgrade" middleware context?
            // Fiber's contrib/websocket middleware allows accessing Locals.
            // We will address backend auth in a moment. For now let's send it.

            // Actually, we can just send it as a protocol or query param. Query param is easiest.
            const wsUrl = `${url}?token=${token}`;

            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (e) {
                    console.error("Failed to parse WS message", e);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
                // Reconnect attempt
                reconnectTimeout.current = setTimeout(connect, 3000);
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error', error);
                socket.close();
            };

            ws.current = socket;
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [token]);

    return (
        <WebSocketContext.Provider value={{ lastMessage, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
