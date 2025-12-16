/**
 * Chat Types - Interfaces para el sistema de mensajería
 */

export type MessageType = 'text' | 'image' | 'document' | 'system'
export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  profile_picture_url?: string
}

export interface Listing {
  id: string
  title: string
  price: number
  currency: string
  property_type: string
  operation: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_user_id: string
  message_type: MessageType
  content: string
  media_url?: string
  status: MessageStatus
  read_at?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  deleted_at?: string
}

export interface Conversation {
  id: string
  listing_id: string
  client_user_id: string
  owner_user_id: string
  created_at: string
  updated_at: string
  last_message_at?: string
  is_active: boolean
  archived_by_client: boolean
  archived_by_owner: boolean
}

export interface ConversationWithDetails extends Conversation {
  // Último mensaje
  last_message_id?: string
  last_message_sender_id?: string
  last_message_content?: string
  last_message_type?: MessageType
  last_message_created_at?: string
  last_message_status?: MessageStatus
  
  // Listing
  listing_title?: string
  listing_price?: number
  listing_currency?: string
  listing_property_type?: string
  listing_operation?: string
  
  // Cliente
  client_first_name?: string
  client_last_name?: string
  client_email?: string
  client_profile_picture?: string
  
  // Propietario
  owner_first_name?: string
  owner_last_name?: string
  owner_email?: string
  owner_profile_picture?: string
  
  // Presencia
  client_is_online?: boolean
  client_last_seen_at?: string
  owner_is_online?: boolean
  owner_last_seen_at?: string
  
  // Contador de no leídos (agregado por frontend)
  unread_count?: number
}

export interface UserPresence {
  user_id: string
  is_online: boolean
  last_seen_at: string
  connection_count: number
  updated_at: string
}

export interface CreateConversationRequest {
  listing_id: string
  client_user_id: string
  owner_user_id: string
}

export interface SendMessageRequest {
  conversation_id: string
  content: string
  message_type?: MessageType
}

export interface UnreadCountResponse {
  unread_count: number
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'presence' | 'error'
  conversation_id?: string
  message_id?: string
  content?: string
  message_type?: MessageType
  sender_user_id?: string
  is_online?: boolean
  error?: string
}

export interface TypingEvent {
  conversation_id: string
  user_id: string
  is_typing: boolean
}

export interface ChatState {
  conversations: ConversationWithDetails[]
  messages: Record<string, Message[]>
  activeConversation: string | null
  unreadCount: number
  isLoading: boolean
  error: string | null
  typingUsers: Record<string, string[]> // conversation_id -> user_ids
}
