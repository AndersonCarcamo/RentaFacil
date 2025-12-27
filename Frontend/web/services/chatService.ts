/**
 * Chat Service - Manejo de API REST para el sistema de chat
 */
import axios from 'axios'
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  UnreadCountResponse,
} from '../types/chat'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ChatService {
  private getBaseUrl() {
    return `${API_BASE_URL}/v1`
  }
  
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    return {
      Authorization: token ? `Bearer ${token}` : '',
    }
  }

  /**
   * Crear o obtener conversación
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await axios.post<Conversation>(
      `${this.getBaseUrl()}/chat/conversations`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Obtener todas las conversaciones del usuario
   */
  async getConversations(params?: {
    skip?: number
    limit?: number
    is_active?: boolean
  }): Promise<ConversationWithDetails[]> {
    const response = await axios.get<ConversationWithDetails[]>(
      `${this.getBaseUrl()}/chat/conversations`,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    )
    return response.data
  }

  /**
   * Obtener una conversación específica
   */
  async getConversation(conversationId: string): Promise<ConversationWithDetails> {
    const response = await axios.get<ConversationWithDetails>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}`,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(
    conversationId: string,
    params?: {
      skip?: number
      limit?: number
    }
  ): Promise<Message[]> {
    const response = await axios.get<Message[]>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/messages`,
      {
        headers: this.getAuthHeaders(),
        params,
      }
    )
    return response.data
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
    const response = await axios.post<Message>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/messages`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Marcar mensajes como leídos
   */
  async markAsRead(conversationId: string): Promise<{ messages_marked_read: number }> {
    const response = await axios.patch<{ messages_marked_read: number }>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/read`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Obtener contador de mensajes no leídos
   */
  async getUnreadCount(conversationId?: string): Promise<number> {
    const response = await axios.get<UnreadCountResponse>(
      `${this.getBaseUrl()}/chat/unread-count`,
      {
        headers: this.getAuthHeaders(),
        params: conversationId ? { conversation_id: conversationId } : undefined,
      }
    )
    return response.data.unread_count
  }

  /**
   * Archivar conversación
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    const response = await axios.patch<Conversation>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/archive`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Eliminar mensaje (soft delete)
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<Message> {
    const response = await axios.delete<Message>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/messages/${messageId}`,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * Obtener o crear conversación para un listing específico
   */
  async getOrCreateConversationForListing(
    listingId: string,
    ownerId: string
  ): Promise<Conversation> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      throw new Error('No authenticated')
    }

    // Decodificar token para obtener user_id del cliente
    const payload = JSON.parse(atob(token.split('.')[1]))
    const clientId = payload.sub

    return this.createConversation({
      listing_id: listingId,
      client_user_id: clientId,
      owner_user_id: ownerId,
    })
  }
}

const chatService = new ChatService()
export default chatService
