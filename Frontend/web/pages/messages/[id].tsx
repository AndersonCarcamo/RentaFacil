import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/hooks/useAuth'
import { useWebSocket } from '@/lib/hooks/useWebSocket'
import chatService from '@/services/chatService'
import type { ConversationWithDetails, Message } from '@/types/chat'

export default function ChatPage() {
  const router = useRouter()
  const { id: conversationId } = router.query
  const { user, loading: authLoading } = useAuth()
  
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // WebSocket connection
  const { sendMessage: sendWsMessage, sendTyping, isConnected } = useWebSocket({
    conversationId: conversationId as string,
    onMessage: (message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    },
    onTyping: () => {
      setIsTyping(true)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && conversationId) {
      loadConversation()
      loadMessages()
    }
  }, [user, authLoading, conversationId])

  const loadConversation = async () => {
    try {
      const data = await chatService.getConversation(conversationId as string)
      setConversation(data)
    } catch (err: any) {
      console.error('Error loading conversation:', err)
      setError(err.response?.data?.detail || 'Error al cargar conversación')
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await chatService.getMessages(conversationId as string, { limit: 100 })
      setMessages(data.reverse()) // Más antiguos primero
      
      // Marcar como leídos
      await chatService.markAsRead(conversationId as string)
      
      scrollToBottom()
    } catch (err: any) {
      console.error('Error loading messages:', err)
      setError(err.response?.data?.detail || 'Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    const content = newMessage.trim()
    setNewMessage('')

    try {
      // Enviar por WebSocket si está conectado, sino por API REST
      if (isConnected) {
        sendWsMessage(content)
      } else {
        const message = await chatService.sendMessage(conversationId as string, {
          content,
          message_type: 'text',
        })
        setMessages(prev => [...prev, message])
        scrollToBottom()
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.response?.data?.detail || 'Error al enviar mensaje')
      setNewMessage(content) // Restaurar el mensaje
    }
  }

  const handleTyping = () => {
    if (isConnected) {
      sendTyping()
    }
  }

  const getOtherUser = () => {
    if (!conversation || !user) return null
    
    if (conversation.client_user_id === user.id) {
      return {
        name: `${conversation.owner_first_name} ${conversation.owner_last_name}`,
        avatar: conversation.owner_profile_picture,
        isOnline: conversation.owner_is_online,
      }
    }
    return {
      name: `${conversation.client_first_name} ${conversation.client_last_name}`,
      avatar: conversation.client_profile_picture,
      isOnline: conversation.client_is_online,
    }
  }

  const otherUser = getOtherUser()

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    }
  }

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()
    return currentDate !== prevDate
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Conversación no encontrada</p>
          <button
            onClick={() => router.push('/messages')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver a mensajes
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Chat con {otherUser.name} - EasyRent</title>
      </Head>

      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/messages')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
                    {otherUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{otherUser.name}</h2>
                  <div className="flex items-center space-x-2">
                    {otherUser.isOnline && (
                      <span className="flex items-center text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                        En línea
                      </span>
                    )}
                    {!isConnected && (
                      <span className="text-xs text-gray-500">Reconectando...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Listing info */}
            {conversation.listing_title && (
              <div className="hidden md:flex items-center text-sm text-gray-600">
                <span className="truncate max-w-xs">{conversation.listing_title}</span>
                {conversation.listing_price && (
                  <span className="ml-2 font-semibold">
                    ${conversation.listing_price.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {messages.map((message, index) => {
              const isOwnMessage = message.sender_user_id === user?.id
              const showDate = shouldShowDateDivider(message, messages[index - 1])

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <div className={`mt-1 flex items-center space-x-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {isOwnMessage && message.status === 'read' && (
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                style={{ minHeight: '44px' }}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
