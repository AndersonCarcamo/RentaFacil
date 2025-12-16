/**
 * useChat Hook - Lógica principal del sistema de chat
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../services/chatService'
import { useWebSocket } from './useWebSocket'
import type {
  Message,
  ConversationWithDetails,
  WebSocketMessage,
  TypingEvent,
} from '../types/chat'
import toast from 'react-hot-toast'

interface UseChatOptions {
  conversationId: string
  enabled?: boolean
}

export function useChat({ conversationId, enabled = true }: UseChatOptions) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Obtener conversación
  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatService.getConversation(conversationId),
    enabled: enabled && !!conversationId,
  })

  // Obtener mensajes
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId, { limit: 50 }),
    enabled: enabled && !!conversationId,
  })

  // Actualizar mensajes cuando llegan del API
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData)
    }
  }, [messagesData])

  // Mutation para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      chatService.sendMessage(conversationId, {
        conversation_id: conversationId,
        content,
        message_type: 'text',
      }),
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      scrollToBottom()
    },
    onError: (error) => {
      console.error('Error sending message:', error)
      toast.error('Error al enviar mensaje')
    },
  })

  // Mutation para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: () => chatService.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  // Manejar mensajes de WebSocket
  const handleWebSocketMessage = useCallback(
    (wsMessage: WebSocketMessage) => {
      if (wsMessage.conversation_id !== conversationId) return

      switch (wsMessage.type) {
        case 'message':
          if (wsMessage.content && wsMessage.sender_user_id) {
            const newMessage: Message = {
              id: wsMessage.message_id || `temp-${Date.now()}`,
              conversation_id: conversationId,
              sender_user_id: wsMessage.sender_user_id,
              message_type: wsMessage.message_type || 'text',
              content: wsMessage.content,
              status: 'delivered',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: false,
            }
            
            setMessages((prev) => {
              // Evitar duplicados
              const exists = prev.some((m) => m.id === newMessage.id)
              if (exists) return prev
              return [...prev, newMessage]
            })
            
            scrollToBottom()
            markAsReadMutation.mutate()
          }
          break

        case 'typing':
          if (wsMessage.sender_user_id) {
            handleTypingEvent({
              conversation_id: conversationId,
              user_id: wsMessage.sender_user_id,
              is_typing: true,
            })
          }
          break

        case 'read_receipt':
          // Actualizar estado de mensajes a 'read'
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === wsMessage.message_id
                ? { ...msg, status: 'read', read_at: new Date().toISOString() }
                : msg
            )
          )
          break

        case 'presence':
          // Actualizar presencia del usuario
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
          break

        case 'error':
          console.error('WebSocket error:', wsMessage.error)
          toast.error(wsMessage.error || 'Error en la conexión')
          break
      }
    },
    [conversationId, markAsReadMutation, queryClient]
  )

  // Configurar WebSocket
  const { sendTyping, isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Chat WebSocket conectado')
      // Recargar mensajes al reconectar
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
    onDisconnect: () => {
      console.log('Chat WebSocket desconectado')
    },
    onError: (error) => {
      console.error('Chat WebSocket error:', error)
    },
  })

  // Manejar evento de escritura
  const handleTypingEvent = useCallback((event: TypingEvent) => {
    const { user_id, is_typing } = event

    if (is_typing) {
      setTypingUsers((prev) => new Set(prev).add(user_id))

      // Limpiar timeout anterior
      const existingTimeout = typingTimeoutsRef.current.get(user_id)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Configurar nuevo timeout para quitar el indicador
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(user_id)
          return next
        })
        typingTimeoutsRef.current.delete(user_id)
      }, 3000)

      typingTimeoutsRef.current.set(user_id, timeout)
    } else {
      setTypingUsers((prev) => {
        const next = new Set(prev)
        next.delete(user_id)
        return next
      })
    }
  }, [])

  // Enviar mensaje
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      try {
        await sendMessageMutation.mutateAsync(content)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [sendMessageMutation]
  )

  // Indicar que está escribiendo
  const handleTyping = useCallback(() => {
    if (isConnected()) {
      sendTyping(conversationId)
    }
  }, [isConnected, sendTyping, conversationId])

  // Marcar mensajes como leídos
  const markAsRead = useCallback(() => {
    markAsReadMutation.mutate()
  }, [markAsReadMutation])

  // Scroll automático al final
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  // Scroll al cargar mensajes
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // Marcar como leído cuando se abre la conversación
  useEffect(() => {
    if (conversationId && enabled) {
      markAsRead()
    }
  }, [conversationId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    conversation,
    messages,
    sendMessage,
    handleTyping,
    markAsRead,
    typingUsers: Array.from(typingUsers),
    isLoading: loadingConversation || loadingMessages,
    isSending: sendMessageMutation.isPending,
    isConnected: isConnected(),
    messagesEndRef,
    scrollToBottom,
  }
}
