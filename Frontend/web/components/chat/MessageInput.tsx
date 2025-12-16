/**
 * MessageInput - Input para escribir y enviar mensajes
 */
import { useState, useRef, KeyboardEvent } from 'react'
import { SendIcon, ImageIcon, PaperclipIcon } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  onTyping?: () => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSendMessage(trimmedMessage)
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (value: string) => {
    setMessage(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }

    // Indicador de escritura (debounced)
    if (onTyping) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        onTyping()
      }, 300)
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end gap-2">
        {/* Botones de adjuntos (opcional - deshabilitado por ahora) */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          disabled={true}
          title="Adjuntar imagen (próximamente)"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          disabled={true}
          title="Adjuntar archivo (próximamente)"
        >
          <PaperclipIcon className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full px-4 py-2 pr-12
              border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              resize-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
              text-sm
            "
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Botón enviar */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="
            p-3 rounded-lg
            bg-secondary-500 hover:bg-secondary-600
            text-white
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex-shrink-0
          "
          title="Enviar mensaje"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Ayuda de atajos */}
      <p className="text-xs text-gray-400 mt-2">
        Presiona <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para enviar,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd> para nueva línea
      </p>
    </div>
  )
}
