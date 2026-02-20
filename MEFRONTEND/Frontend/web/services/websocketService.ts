/**
 * WebSocket Service - Conexión en tiempo real para chat
 */
import type { WebSocketMessage } from '../types/chat'

type MessageHandler = (message: WebSocketMessage) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: Event | Error) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Set<MessageHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private disconnectionHandlers: Set<ConnectionHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private isManualDisconnect = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 30000 // 30 segundos

  /**
   * Conectar al WebSocket
   */
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado')
      return
    }

    this.isManualDisconnect = false
    const wsUrl = this.getWebSocketUrl(token)

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.connectionHandlers.forEach((handler) => handler())
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.messageHandlers.forEach((handler) => handler(message))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.errorHandlers.forEach((handler) => handler(error))
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket desconectado')
        this.stopHeartbeat()
        this.disconnectionHandlers.forEach((handler) => handler())

        if (!this.isManualDisconnect) {
          this.attemptReconnect(token)
        }
      }
    } catch (error) {
      console.error('Error creando WebSocket:', error)
      this.errorHandlers.forEach((handler) => handler(error as Error))
    }
  }

  /**
   * Desconectar manualmente
   */
  disconnect(): void {
    this.isManualDisconnect = true
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Enviar mensaje por WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket no está conectado')
      throw new Error('WebSocket not connected')
    }
  }

  /**
   * Enviar mensaje de texto
   */
  sendMessage(conversationId: string, content: string): void {
    this.send({
      type: 'message',
      conversation_id: conversationId,
      content,
      message_type: 'text',
    })
  }

  /**
   * Enviar indicador de escritura
   */
  sendTyping(conversationId: string): void {
    this.send({
      type: 'typing',
      conversation_id: conversationId,
    })
  }

  /**
   * Enviar confirmación de lectura
   */
  sendReadReceipt(messageId: string, conversationId: string): void {
    this.send({
      type: 'read',
      message_id: messageId,
      conversation_id: conversationId,
    })
  }

  /**
   * Suscribirse a mensajes
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  /**
   * Suscribirse a conexión establecida
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  /**
   * Suscribirse a desconexión
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler)
    return () => this.disconnectionHandlers.delete(handler)
  }

  /**
   * Suscribirse a errores
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  /**
   * Obtener estado de conexión
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Intentar reconexión automática
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect(token)
    }, delay)
  }

  /**
   * Iniciar heartbeat (ping/pong) para mantener conexión viva
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'presence' })
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * Detener heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Obtener URL del WebSocket
   */
  private getWebSocketUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws'
    const wsBaseUrl = baseUrl.replace(/^https?/, wsProtocol)
    
    return `${wsBaseUrl}/chat/ws?token=${token}`
  }
}

export const websocketService = new WebSocketService()
