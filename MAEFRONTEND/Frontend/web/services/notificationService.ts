/**
 * Notification Service - Manejo de API para el sistema de notificaciones
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/v1'

export interface Notification {
  id: string
  notification_type: string
  category?: string
  title: string
  message: string
  summary?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  read_at?: string
  related_entity_type?: string
  related_entity_id?: string
  action_url?: string
  action_data?: any
  created_at: string
  expires_at?: string
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
  page: number
  size: number
  pages: number
  has_next: boolean
  has_prev: boolean
  unread_count: number
}

class NotificationService {
  private getAuthHeaders(includeJsonContentType = false) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  private getBaseUrl() {
    return `${normalizedBaseUrl}${API_VERSION}`
  }

  /**
   * Obtener todas las notificaciones del usuario
   */
  async getNotifications(params?: {
    type?: string[]
    status?: string[]
    priority?: string[]
    read?: boolean
    page?: number
    size?: number
  }): Promise<NotificationListResponse> {
    console.log('[NotificationService] getNotifications called with params:', params);
    
    const queryParams = new URLSearchParams()
    
    if (params?.type) {
      params.type.forEach(t => queryParams.append('type', t))
    }
    if (params?.status) {
      params.status.forEach(s => queryParams.append('status', s))
    }
    if (params?.priority) {
      params.priority.forEach(p => queryParams.append('priority', p))
    }
    if (params?.read !== undefined) {
      queryParams.set('read', params.read.toString())
    }
    if (params?.page) {
      queryParams.set('page', params.page.toString())
    }
    if (params?.size) {
      queryParams.set('size', params.size.toString())
    }

    const url = `${this.getBaseUrl()}/notifications/?${queryParams}`;
    const headers = this.getAuthHeaders();
    
    console.log('[NotificationService] Fetching from URL:', url);
    console.log('[NotificationService] Headers:', headers);

    const response = await fetch(url, { headers });

    console.log('[NotificationService] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NotificationService] Error response:', errorText);
      throw new Error('Error al obtener notificaciones')
    }

    const data = await response.json();
    console.log('[NotificationService] Response data:', data);
    return data;
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(
      `${this.getBaseUrl()}/notifications/unread-count`,
      { headers: this.getAuthHeaders() }
    )

    if (!response.ok) {
      throw new Error('Error al obtener contador de notificaciones')
    }

    const data = await response.json()
    return data.unread_count
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(
      `${this.getBaseUrl()}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Error al marcar notificación como leída')
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await fetch(
      `${this.getBaseUrl()}/notifications/mark-read`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({ all: true })
      }
    )

    if (!response.ok) {
      throw new Error('Error al marcar todas las notificaciones como leídas')
    }

    return response.json()
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(
      `${this.getBaseUrl()}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Error al eliminar notificación')
    }
  }
}

export const notificationService = new NotificationService()
