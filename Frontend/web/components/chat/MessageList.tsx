/**
 * MessageList - Lista de mensajes con scroll automático
 */
import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { Message, ConversationWithDetails } from '../../types/chat'

interface MessageListProps {
  messages: Message[]
  conversation: ConversationWithDetails
  currentUserId: string
  messagesEndRef?: React.RefObject<HTMLDivElement>
}

export default function MessageList({
  messages,
  conversation,
  currentUserId,
  messagesEndRef,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (isNearBottom) {
      messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, messagesEndRef])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes aún</h3>
          <p className="text-sm text-gray-500">
            Envía el primer mensaje para iniciar la conversación
          </p>
        </div>
      </div>
    )
  }

  // Determinar quién es el otro usuario (para mostrar su nombre/avatar)
  const isClient = currentUserId === conversation.client_user_id
  const otherUserName = isClient
    ? `${conversation.owner_first_name || ''} ${conversation.owner_last_name || ''}`.trim()
    : `${conversation.client_first_name || ''} ${conversation.client_last_name || ''}`.trim()
  const otherUserAvatar = isClient
    ? conversation.owner_profile_picture
    : conversation.client_profile_picture

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.sender_user_id === currentUserId
        const prevMessage = index > 0 ? messages[index - 1] : null
        const showAvatar = !prevMessage || prevMessage.sender_user_id !== message.sender_user_id

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            showAvatar={showAvatar}
            senderName={!isOwnMessage ? otherUserName : undefined}
            senderAvatar={!isOwnMessage ? otherUserAvatar : undefined}
          />
        )
      })}

      {/* Elemento invisible para scroll */}
      <div ref={messagesEndRef} />
    </div>
  )
}
