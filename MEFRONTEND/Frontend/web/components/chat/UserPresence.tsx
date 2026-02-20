/**
 * UserPresence - Indicador de presencia online/offline
 */
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserPresenceProps {
  isOnline: boolean
  lastSeenAt?: string
  className?: string
}

export default function UserPresence({ isOnline, lastSeenAt, className = '' }: UserPresenceProps) {
  const getLastSeenText = () => {
    if (isOnline) return 'En línea'
    if (!lastSeenAt) return 'Desconectado'

    try {
      const lastSeen = new Date(lastSeenAt)
      const now = new Date()
      const diffInHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 1) {
        return `Visto hace ${formatDistanceToNow(lastSeen, { locale: es })}`
      } else if (diffInHours < 24) {
        return `Visto ${format(lastSeen, "'hoy a las' HH:mm", { locale: es })}`
      } else {
        return `Visto ${format(lastSeen, "'el' dd/MM 'a las' HH:mm", { locale: es })}`
      }
    } catch {
      return 'Desconectado'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Indicador visual */}
      <div className="relative">
        <div
          className={`
            w-2.5 h-2.5 rounded-full
            ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
          `}
        />
        {isOnline && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>

      {/* Texto de estado */}
      <span className={`text-sm ${isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
        {getLastSeenText()}
      </span>
    </div>
  )
}
