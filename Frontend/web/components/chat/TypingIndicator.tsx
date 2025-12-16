/**
 * TypingIndicator - Indicador de "está escribiendo..."
 */
interface TypingIndicatorProps {
  userName?: string
  isTyping: boolean
}

export default function TypingIndicator({ userName = 'Alguien', isTyping }: TypingIndicatorProps) {
  if (!isTyping) return null

  return (
    <div className="px-4 py-2 bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{userName} está escribiendo</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
