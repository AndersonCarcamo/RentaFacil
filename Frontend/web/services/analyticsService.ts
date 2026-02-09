import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Generar session_id único para rastrear visitantes únicos
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
}

export const analyticsService = {
  /**
   * Registra una vista de un listing
   */
  async trackView(listingId: string, referrer?: string): Promise<void> {
    try {
      const sessionId = getSessionId();
      await axios.post(
        `${API_BASE_URL}/v1/analytics/track/view`,
        {},
        {
          params: {
            listing_id: listingId,
            session_id: sessionId,
            referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
          }
        }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
      // No lanzar error, solo registrar - no debe afectar UX
    }
  },

  /**
   * Registra un contacto (click en teléfono, whatsapp, email)
   */
  async trackContact(
    listingId: string,
    contactType: 'phone' | 'whatsapp' | 'email'
  ): Promise<void> {
    try {
      const sessionId = getSessionId();
      await axios.post(
        `${API_BASE_URL}/v1/analytics/track/contact`,
        {},
        {
          params: {
            listing_id: listingId,
            contact_type: contactType,
            session_id: sessionId,
          }
        }
      );
    } catch (error) {
      console.error('Error tracking contact:', error);
      // No lanzar error, solo registrar
    }
  },

  /**
   * Obtiene estadísticas de un listing (solo propietario)
   */
  async getListingStats(listingId: string): Promise<{
    listing_id: string;
    total_views: number;
    total_leads: number;
    total_favorites: number;
    last_30_days: {
      views: number;
      contacts: number;
      unique_visitors: number;
    };
    last_7_days: {
      views: number;
    };
    daily_stats: Array<{
      date: string;
      views: number;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/analytics/listings/${listingId}/stats`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting listing stats:', error);
      throw error;
    }
  },
};
