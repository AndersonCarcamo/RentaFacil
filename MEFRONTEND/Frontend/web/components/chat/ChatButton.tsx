/**
 * ChatButton - Botón flotante para abrir el chat
 */
import { MessageCircleIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatButtonProps {
  onClick: () => void
  unreadCount?: number
  disabled?: boolean
  className?: string
}

export default function ChatButton({
  onClick,
  unreadCount = 0,
  disabled = false,
  className = '',
}: ChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative
        p-4 rounded-full
        bg-primary-500 hover:bg-primary-600
        text-white
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Abrir chat"
    >
      <MessageCircleIcon className="w-6 h-6" />

      {/* Badge de mensajes no leídos */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="
            absolute -top-1 -right-1
            min-w-[20px] h-5
            bg-red-500
            text-white text-xs font-bold
            rounded-full
            flex items-center justify-center
            px-1.5
            shadow-md
          "
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}

      {/* Indicador de nueva actividad (pulse animation) */}
      {unreadCount > 0 && (
        <span className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-75" />
      )}
    </motion.button>
  )
}
