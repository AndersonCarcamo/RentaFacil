import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Header } from '@/components/common/Header'
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
  const { sendMessage: sendWsMessage, sendTyping, sendReadReceipt, isConnected } = useWebSocket({
    conversationId: conversationId as string,
    onMessage: (message) => {
      // Evitar duplicados: solo agregar si no existe ya en el array
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id)
        if (exists) {
          return prev
        }
        return [...prev, message]
      })
      scrollToBottom()
    },
    onTyping: () => {
      setIsTyping(true)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
    },
    onReadReceipt: (messageId, readBy) => {
      // Actualizar el estado del mensaje a 'read'
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read', read_at: new Date().toISOString() }
            : msg
        )
      )
    },
  })

  // Enviar read receipts para mensajes recibidos del otro usuario
  useEffect(() => {
    if (!user || !isConnected) return

    // Obtener el último mensaje
    const lastMessage = messages[messages.length - 1]
    
    // Si el último mensaje es de otro usuario y no está leído, enviar read receipt
    if (lastMessage && 
        lastMessage.sender_user_id !== user.id && 
        lastMessage.status !== 'read') {
      setTimeout(() => {
        sendReadReceipt(lastMessage.id)
      }, 100)
    }
  }, [messages, user, isConnected, sendReadReceipt])

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
      
      // Marcar como leídos en el backend
      await chatService.markAsRead(conversationId as string)
      
      scrollToBottom()
    } catch (err: any) {
      console.error('Error loading messages:', err)
      setError(err.response?.data?.detail || 'Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }

  // Enviar read receipts para mensajes cargados al abrir el chat
  useEffect(() => {
    if (!loading && user && isConnected && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.sender_user_id !== user.id && msg.status !== 'read'
      )
      
      // Enviar read receipts con un pequeño delay entre cada uno
      unreadMessages.forEach((msg, index) => {
        setTimeout(() => {
          sendReadReceipt(msg.id)
        }, index * 50) // 50ms entre cada uno
      })
    }
  }, [loading, isConnected]) // Solo ejecutar después de cargar y conectar

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
      }
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
    
    return {
      name: (conversation as any).other_user_name || 'Usuario',
      avatar: (conversation as any).other_user_picture || null,
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

  const getAvatarUrl = (user: { name: string; avatar?: string | null }) => {
    if (user.avatar) {
      return user.avatar
    }
    // Generar avatar con iniciales usando ui-avatars.com
    const name = user.name || 'Usuario'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EAB308&color=fff&size=128&bold=true&rounded=true`
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
    <>
      <Head>
        <title>Chat con {otherUser?.name || 'Usuario'} - EasyRent</title>
      </Head>

      <Header />
      
      <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 fixed inset-0 z-[90]" style={{ top: '100px' }}>
        {/* Chat Header */}
        <div className="bg-white shadow-md border-b border-gray-200 px-2 sm:px-4 py-3 sm:py-4 shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/messages')}
                className="p-1.5 sm:p-2.5 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100 rounded-full transition-all duration-200 group shadow-sm hover:shadow-md flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatarUrl(otherUser)}
                    alt={otherUser.name}
                    className="h-8 w-8 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-white shadow-md"
                    onError={(e) => {
                      // Si la imagen falla al cargar, usar el avatar por defecto
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=EAB308&color=fff&size=128&bold=true&rounded=true`
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{otherUser.name}</h2>
                  {/* Mostrar listing en móvil de forma compacta */}
                  {conversation.listing_title && (
                    <p className="text-xs text-gray-500 truncate md:hidden">{conversation.listing_title}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Listing info */}
            {conversation.listing_title && (
              <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">Propiedad</span>
                  <span className="text-sm font-bold text-gray-900 truncate max-w-xs">{conversation.listing_title}</span>
                </div>
                {conversation.listing_price && (
                  <div className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded-lg shadow-sm">
                    <span className="text-sm font-bold">
                      ${conversation.listing_price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={messagesEndRef} style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(209 213 219 / 0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
          <div className="px-2 sm:px-4 py-4 sm:py-6">
            <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
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
                      <div className="flex justify-center my-6">
                        <span className="bg-white text-gray-700 text-xs font-semibold px-4 py-2 rounded-full shadow-md border border-gray-200">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-md transition-all duration-200 ${
                            isOwnMessage
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-900 group-hover:shadow-lg'
                          }`}
                        >
                          <p className={`text-sm break-words leading-relaxed ${
                            isOwnMessage ? 'font-medium' : ''
                          }`}>{message.content}</p>
                        </div>
                        <div className={`mt-1 sm:mt-1.5 flex items-center space-x-1 sm:space-x-1.5 px-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] sm:text-xs font-medium ${
                            isOwnMessage ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            <div className="flex items-center">
                              {message.status === 'read' ? (
                                // Doble check azul para leído
                                <div className="flex items-center -space-x-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : message.status === 'delivered' ? (
                                // Doble check gris para entregado
                                <div className="flex items-center -space-x-1">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                // Un solo check gris para enviado
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-md">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-3 sm:py-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-3">
              <div className="flex-1">
                <div className="relative">
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
                    className="w-full px-3 sm:px-5 py-2 sm:py-3 pr-10 sm:pr-12 border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
                    title="Adjuntar archivo"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl sm:rounded-2xl hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                style={{ minHeight: '44px' }}
              >
                <span className="hidden sm:inline">Enviar</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
