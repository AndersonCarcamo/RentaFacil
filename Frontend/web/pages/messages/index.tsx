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
      
      // MOCK DATA - Datos de ejemplo para visualización
      const mockConversations: ConversationWithDetails[] = [
        {
          id: '1',
          listing_id: 'listing-1',
          client_user_id: user?.id === 'client-1' ? 'client-1' : 'owner-1',
          owner_user_id: user?.id === 'client-1' ? 'owner-1' : 'client-1',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 300000).toISOString(),
          last_message_at: new Date(Date.now() - 300000).toISOString(),
          is_active: true,
          archived_by_client: false,
          archived_by_owner: false,
          
          // Último mensaje
          last_message_content: '¿Está disponible para el próximo mes?',
          last_message_sender_id: user?.id === 'client-1' ? 'owner-1' : 'client-1',
          last_message_created_at: new Date(Date.now() - 300000).toISOString(),
          last_message_type: 'text',
          
          // Listing
          listing_title: 'Departamento 2 dormitorios en Miraflores',
          listing_price: 1500,
          listing_currency: 'PEN',
          listing_property_type: 'apartment',
          
          // Usuario (el otro)
          client_first_name: user?.id === 'client-1' ? 'María' : user?.first_name || 'Juan',
          client_last_name: user?.id === 'client-1' ? 'García' : user?.last_name || 'Pérez',
          owner_first_name: user?.id === 'client-1' ? user?.first_name || 'Juan' : 'María',
          owner_last_name: user?.id === 'client-1' ? user?.last_name || 'Pérez' : 'García',
          
          unread_count: 2,
        },
        {
          id: '2',
          listing_id: 'listing-2',
          client_user_id: user?.id === 'client-2' ? 'client-2' : 'owner-2',
          owner_user_id: user?.id === 'client-2' ? 'owner-2' : 'client-2',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          last_message_at: new Date(Date.now() - 1800000).toISOString(),
          is_active: true,
          archived_by_client: false,
          archived_by_owner: false,
          
          last_message_content: 'Perfecto, agendamos la visita para mañana',
          last_message_sender_id: user?.id,
          last_message_created_at: new Date(Date.now() - 1800000).toISOString(),
          last_message_type: 'text',
          
          listing_title: 'Casa 3 dormitorios en San Isidro',
          listing_price: 2800,
          listing_currency: 'PEN',
          listing_property_type: 'house',
          
          client_first_name: user?.id === 'client-2' ? 'Carlos' : user?.first_name || 'Ana',
          client_last_name: user?.id === 'client-2' ? 'López' : user?.last_name || 'Torres',
          owner_first_name: user?.id === 'client-2' ? user?.first_name || 'Ana' : 'Carlos',
          owner_last_name: user?.id === 'client-2' ? user?.last_name || 'Torres' : 'López',
          
          client_is_online: true,
          owner_is_online: false,
        },
        {
          id: '3',
          listing_id: 'listing-3',
          client_user_id: user?.id === 'client-3' ? 'client-3' : 'owner-3',
          owner_user_id: user?.id === 'client-3' ? 'owner-3' : 'client-3',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
          is_active: true,
          archived_by_client: false,
          archived_by_owner: false,
          
          last_message_content: 'Gracias por la información',
          last_message_sender_id: user?.id === 'client-3' ? 'owner-3' : 'client-3',
          last_message_created_at: new Date(Date.now() - 86400000).toISOString(),
          last_message_type: 'text',
          
          listing_title: 'Habitación amoblada en Surco',
          listing_price: 800,
          listing_currency: 'PEN',
          listing_property_type: 'room',
          
          client_first_name: user?.id === 'client-3' ? 'Luis' : user?.first_name || 'Sofia',
          client_last_name: user?.id === 'client-3' ? 'Ramírez' : user?.last_name || 'Vargas',
          owner_first_name: user?.id === 'client-3' ? user?.first_name || 'Sofia' : 'Luis',
          owner_last_name: user?.id === 'client-3' ? user?.last_name || 'Vargas' : 'Ramírez',
        },
      ]
      
      setConversations(mockConversations)
      
      // Código real comentado para desarrollo
      // const data = await chatService.getConversations({ limit: 50 })
      // setConversations(data)
    } catch (err: any) {
      console.error('Error loading conversations:', err)
      setError(err.response?.data?.detail || 'Error al cargar conversaciones')
    } finally {
      setLoading(false)
    }
  }

  const getOtherUserName = (conversation: ConversationWithDetails) => {
    if (conversation.client_user_id === user?.id) {
      return `${conversation.owner_first_name} ${conversation.owner_last_name}`
    }
    return `${conversation.client_first_name} ${conversation.client_last_name}`
  }

  const getOtherUserAvatar = (conversation: ConversationWithDetails) => {
    if (conversation.client_user_id === user?.id) {
      return conversation.owner_profile_picture
    }
    return conversation.client_profile_picture
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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
            <p className="mt-2 text-gray-600">
              Chatea con huéspedes y propietarios
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay conversaciones
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza a chatear contactando a un propietario desde un anuncio.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => router.push(`/messages/${conversation.id}`)}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {getOtherUserAvatar(conversation) ? (
                          <img
                            src={getOtherUserAvatar(conversation)}
                            alt={getOtherUserName(conversation)}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
                            {getOtherUserName(conversation).charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {getOtherUserName(conversation)}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.listing_title}
                            </p>
                          </div>
                          <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conversation.last_message_created_at)}
                          </span>
                        </div>
                        
                        {conversation.last_message_content && (
                          <p className="mt-1 text-sm text-gray-600 truncate">
                            {conversation.last_message_sender_id === user?.id && 'Tú: '}
                            {conversation.last_message_content}
                          </p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-yellow-500 text-xs font-medium text-white">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
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
