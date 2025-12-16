/**
 * Chat Page - Página completa de chat para una conversación
 */
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ChatWindow from '../../components/chat/ChatWindow'

export default function ChatPage() {
  const router = useRouter()
  const { conversationId } = router.query
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Obtener current user ID del token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.sub)
      } catch (error) {
        console.error('Error parsing token:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  if (!conversationId || typeof conversationId !== 'string' || !currentUserId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
        <ChatWindow
          conversationId={conversationId}
          currentUserId={currentUserId}
          onBack={() => router.back()}
        />
      </div>
    </Layout>
  )
}
