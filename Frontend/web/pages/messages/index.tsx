import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/hooks/useAuth'
import chatService from '@/services/chatService'
import type { ConversationWithDetails } from '@/types/chat'

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadConversations()
    }
  }, [user, authLoading])

  const loadConversations = async () => {
    try {
      setLoading(true)
      
      // Cargar conversaciones reales desde el API
      const data = await chatService.getConversations({ limit: 50 })
      setConversations(data)
    } catch (err: any) {
      console.error('Error loading conversations:', err)
      setError(err.response?.data?.detail || 'Error al cargar conversaciones')
    } finally {
      setLoading(false)
    }
  }

  const getOtherUserName = (conversation: any) => {
    return conversation.other_user_name || 'Usuario'
  }

  const getOtherUserAvatar = (conversation: any) => {
    return conversation.other_user_picture || null
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Mensajes - EasyRent</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Mensajes</h1>
                <p className="text-sm sm:text-lg text-gray-600">
                  {conversations.length > 0 
                    ? `${conversations.length} ${conversations.length === 1 ? 'conversación' : 'conversaciones'}` 
                    : 'No hay conversaciones activas'}
                </p>
              </div>
              <button
                onClick={loadConversations}
                className="p-2 sm:p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                title="Actualizar"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {conversations.length === 0 ? (
              <div className="text-center py-20 px-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 mb-6 shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No hay conversaciones aún
                </h3>
                <p className="text-base text-gray-600 max-w-md mx-auto mb-6">
                  Comienza a chatear contactando a un propietario desde cualquier anuncio de propiedad.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar propiedades
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => router.push(`/messages/${conversation.id}`)}
                    className="w-full px-3 sm:px-6 py-3 sm:py-5 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-transparent transition-all duration-200 text-left group relative overflow-hidden"
                  >
                    <div className="flex items-start space-x-2 sm:space-x-4">
                      {/* Avatar with status indicator */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={getOtherUserAvatar(conversation) || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherUserName(conversation))}&background=EAB308&color=fff&size=128&bold=true`}
                          alt={getOtherUserName(conversation)}
                          className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate group-hover:text-yellow-700 transition-colors">
                              {getOtherUserName(conversation)}
                            </h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                              📍 {conversation.listing_title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                              {formatTime(conversation.last_message_created_at)}
                            </span>
                            {/* Unread badge */}
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center h-5 sm:h-6 min-w-[20px] sm:min-w-[24px] px-1.5 sm:px-2 rounded-full bg-yellow-500 text-xs font-bold text-white shadow-md animate-pulse">
                                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {conversation.last_message_content && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate mt-1.5 sm:mt-2 group-hover:text-gray-800 transition-colors">
                            {conversation.last_message_sender_id === user?.id && (
                              <span className="font-semibold text-gray-700">Tú: </span>
                            )}
                            {conversation.last_message_content}
                          </p>
                        )}
                        
                        {/* Price tag */}
                        {conversation.listing_price && (
                          <div className="mt-1.5 sm:mt-2 inline-flex items-center px-2 py-0.5 sm:py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                            <span className="mr-1">{conversation.listing_currency === 'USD' ? '$' : 'S/'}</span>
                            {conversation.listing_price.toLocaleString()}
                            <span className="ml-1 text-gray-500 hidden sm:inline">/ {conversation.listing_operation === 'rent' ? 'mes' : 'total'}</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow indicator */}
                      <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Hover effect line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
