/**
 * MessageBubble - Burbuja individual de mensaje
 */
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, CheckCheck } from 'lucide-react'
import type { Message } from '../../types/chat'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar?: boolean
  senderName?: string
  senderAvatar?: string
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = false,
  senderName,
  senderAvatar,
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: es })
    } catch {
      return ''
    }
  }

  const getStatusIcon = () => {
    if (!isOwnMessage) return null
    console.log('Message status:', message.status)
    switch (message.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName || 'Usuario'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent-200 flex items-center justify-center">
              <span className="text-sm font-medium text-accent-700">
                {senderName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mensaje */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Nombre del remitente (solo si no es propio y se muestra avatar) */}
        {showAvatar && !isOwnMessage && senderName && (
          <span className="text-xs text-gray-500 mb-1 px-2">{senderName}</span>
        )}

        {/* Burbuja de mensaje */}
        <div
          className={`
            rounded-2xl px-4 py-2 shadow-sm
            ${
              isOwnMessage
                ? 'bg-primary-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-900 rounded-bl-none'
            }
          `}
        >
          {/* Contenido del mensaje */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Media si existe */}
          {message.media_url && (
            <div className="mt-2">
              {message.message_type === 'image' ? (
                <img
                  src={message.media_url}
                  alt="Imagen del mensaje"
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  Ver archivo
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hora y estado */}
        <div className="flex items-center gap-1 mt-1 px-2">
          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Espaciador para mantener alineación cuando no hay avatar */}
      {showAvatar && isOwnMessage && <div className="w-8" />}
    </div>
  )
}
