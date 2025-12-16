/**
 * useWebSocket - Hook para manejar conexión WebSocket del chat
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Message } from '@/types/chat'

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1'

interface UseWebSocketOptions {
  conversationId: string
  onMessage?: (message: Message) => void
  onTyping?: (userId: string) => void
  onPresence?: (userId: string, isOnline: boolean) => void
  onError?: (error: Event) => void
}

interface WebSocketHook {
  sendMessage: (content: string, type?: 'text' | 'image' | 'document') => void
  sendTyping: () => void
  isConnected: boolean
  reconnect: () => void
}

export function useWebSocket({
  conversationId,
  onMessage,
  onTyping,
  onPresence,
  onError,
}: UseWebSocketOptions): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      console.error('No auth token found')
      return
    }

    const wsUrl = `${WS_BASE_URL}/chat/ws/chat/${conversationId}?token=${token}`
    
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'message':
              onMessage?.(data.message)
              break
            case 'typing':
              onTyping?.(data.user_id)
              break
            case 'presence':
              onPresence?.(data.user_id, data.is_online)
              break
            case 'error':
              console.error('WebSocket error:', data.error)
              break
            default:
              console.log('Unknown message type:', data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Intentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          console.log(`Reconnecting in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [conversationId, onMessage, onTyping, onPresence, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'document' = 'text') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        message_type: type,
      }))
    } else {
      console.error('WebSocket not connected')
    }
  }, [])

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
      }))
    }
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    sendMessage,
    sendTyping,
    isConnected,
    reconnect,
  }
}
