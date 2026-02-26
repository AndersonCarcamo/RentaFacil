/**
 * useWebSocket Hook - Manejo de conexión WebSocket con reconexión automática
 */
import { useEffect, useRef, useCallback } from 'react'
import { websocketService } from '../services/websocketService'
import type { WebSocketMessage } from '../types/chat'

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event | Error) => void
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
  } = options

  const isConnectedRef = useRef(false)

  const connect = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      console.error('No authentication token found')
      return
    }

    if (isConnectedRef.current) {
      console.log('Already connected to WebSocket')
      return
    }

    websocketService.connect(token)
    isConnectedRef.current = true
  }, [])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
    isConnectedRef.current = false
  }, [])

  const sendMessage = useCallback((conversationId: string, content: string) => {
    websocketService.sendMessage(conversationId, content)
  }, [])

  const sendTyping = useCallback((conversationId: string) => {
    websocketService.sendTyping(conversationId)
  }, [])

  const sendReadReceipt = useCallback((messageId: string, conversationId: string) => {
    websocketService.sendReadReceipt(messageId, conversationId)
  }, [])

  const isConnected = useCallback(() => {
    return websocketService.isConnected()
  }, [])

  useEffect(() => {
    const unsubscribers: Array<() => void> = []

    if (onMessage) {
      unsubscribers.push(websocketService.onMessage(onMessage))
    }

    if (onConnect) {
      unsubscribers.push(websocketService.onConnect(onConnect))
    }

    if (onDisconnect) {
      unsubscribers.push(websocketService.onDisconnect(onDisconnect))
    }

    if (onError) {
      unsubscribers.push(websocketService.onError(onError))
    }

    if (autoConnect) {
      connect()
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub())
      if (autoConnect) {
        disconnect()
      }
    }
  }, [onMessage, onConnect, onDisconnect, onError, autoConnect, connect, disconnect])

  return {
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    isConnected,
  }
}
