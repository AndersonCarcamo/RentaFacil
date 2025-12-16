/**
 * ChatWindow - Ventana principal del chat
 */
import { ArrowLeftIcon, XIcon, WifiOffIcon } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import UserPresence from './UserPresence'
import TypingIndicator from './TypingIndicator'
import { useChat } from '../../hooks/useChat'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  onClose?: () => void
  onBack?: () => void
  className?: string
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  onClose,
  onBack,
  className = '',
}: ChatWindowProps) {
  const {
    conversation,
    messages,
    sendMessage,
    handleTyping,
    typingUsers,
    isLoading,
    isSending,
    isConnected,
    messagesEndRef,
  } = useChat({ conversationId })

  if (isLoading || !conversation) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-sm text-gray-500">Cargando conversación...</p>
          </div>
        </div>
      </div>
    )
  }

  // Determinar quién es el otro usuario
  const isClient = currentUserId === conversation.client_user_id
  const otherUserName = isClient
    ? `${conversation.owner_first_name || ''} ${conversation.owner_last_name || ''}`.trim()
    : `${conversation.client_first_name || ''} ${conversation.client_last_name || ''}`.trim()
  const otherUserIsOnline = isClient ? conversation.owner_is_online : conversation.client_is_online
  const otherUserLastSeen = isClient ? conversation.owner_last_seen_at : conversation.client_last_seen_at
  const isOtherUserTyping = typingUsers.length > 0 && !typingUsers.includes(currentUserId)

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="bg-primary-500 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          {/* Botón volver/cerrar */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-primary-600 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          {onClose && !onBack && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary-600 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}

          {/* Información de la conversación */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{conversation.listing_title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm opacity-90">{otherUserName}</span>
              {!isConnected && (
                <div className="flex items-center gap-1 text-yellow-200">
                  <WifiOffIcon className="w-4 h-4" />
                  <span className="text-xs">Sin conexión</span>
                </div>
              )}
            </div>
          </div>

          {/* Estado de presencia */}
          <div>
            <UserPresence
              isOnline={otherUserIsOnline || false}
              lastSeenAt={otherUserLastSeen}
              className="text-white"
            />
          </div>
        </div>

        {/* Información de la propiedad */}
        {conversation.listing_price && (
          <div className="mt-3 pt-3 border-t border-primary-400 flex items-center justify-between text-sm">
            <span className="opacity-90">
              {conversation.listing_property_type} · {conversation.listing_operation}
            </span>
            <span className="font-semibold">
              {conversation.listing_currency} {conversation.listing_price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Lista de mensajes */}
      <MessageList
        messages={messages}
        conversation={conversation}
        currentUserId={currentUserId}
        messagesEndRef={messagesEndRef}
      />

      {/* Indicador de escritura */}
      <TypingIndicator userName={otherUserName} isTyping={isOtherUserTyping} />

      {/* Input de mensaje */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        disabled={isSending || !isConnected}
        placeholder={
          !isConnected ? 'Reconectando...' : isSending ? 'Enviando...' : 'Escribe un mensaje...'
        }
      />
    </div>
  )
}
