import { useState, useEffect, useCallback } from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';
import { notificationService, Notification } from '../services/notificationService';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const priorityIcons: Record<string, string> = {
  low: 'ℹ️',
  medium: '📢',
  high: '⚠️',
  urgent: '🚨'
};

const categoryIcons: Record<string, string> = {
  booking_request: '🏖️',
  booking_confirmed: '✅',
  booking_rejected: '❌',
  booking_cancelled: '🚫',
  payment: '💳',
  default: '📢'
};

export function Notifications() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      console.log('[Notifications] No logged in, skipping fetch');
      return;
    }
    
    console.log('[Notifications] Fetching notifications...');
    try {
      const data = await notificationService.getNotifications({
        page: 1,
        size: 10,
        read: false // Solo notificaciones no leídas
      });
      
      console.log('[Notifications] Received data:', {
        items: data.items,
        unreadCount: data.unread_count,
        total: data.total
      });
      
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('[Notifications] Error fetching notifications:', err);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    console.log('[Notifications] useEffect - authLoading:', authLoading, 'isLoggedIn:', isLoggedIn);
    if (!authLoading && isLoggedIn) {
      console.log('[Notifications] Starting to fetch notifications and setting interval');
      fetchNotifications();
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        console.log('[Notifications] Cleaning up interval');
        clearInterval(interval);
      };
    }
  }, [authLoading, isLoggedIn, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationService.markAsRead(notificationId);
      // Actualizar lista
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      setShowDropdown(false);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    return `Hace ${Math.floor(seconds / 86400)} días`;
  };

  // No mostrar nada si no está autenticado
  if (authLoading || !isLoggedIn) {
    console.log('[Notifications] Not rendering - authLoading:', authLoading, 'isLoggedIn:', isLoggedIn);
    return null;
  }

  console.log('[Notifications] Rendering - unreadCount:', unreadCount, 'notifications:', notifications.length);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-sm text-[#22ACF5] hover:text-[#1a8acc] font-medium disabled:opacity-50"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            
            {/* Notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No tienes notificaciones nuevas</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="relative border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {notification.action_url ? (
                      <Link
                        href={notification.action_url}
                        className="block p-4"
                        onClick={() => {
                          handleMarkAsRead(notification.id, { 
                            preventDefault: () => {}, 
                            stopPropagation: () => {} 
                          } as any);
                          setShowDropdown(false);
                        }}
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <div className="p-4">
                        <NotificationContent notification={notification} />
                      </div>
                    )}
                    
                    {/* Botón para marcar como leída */}
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Marcar como leída"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                <Link
                  href="/notifications"
                  className="block text-center text-sm font-medium text-[#22ACF5] hover:text-[#1a8acc]"
                  onClick={() => setShowDropdown(false)}
                >
                  Ver todas las notificaciones →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationContent({ notification }: { notification: Notification }) {
  // Determinar el icono a usar: primero por categoría, luego por prioridad
  const icon = categoryIcons[notification.category || ''] || priorityIcons[notification.priority] || '📢';
  
  return (
    <div className="flex items-start gap-3">
      {/* Icono de categoría/prioridad */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${priorityColors[notification.priority] || 'bg-gray-100'}`}>
        <span className="text-sm">{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Título */}
        <p className="font-medium text-gray-900 text-sm">
          {notification.title}
        </p>
        
        {/* Mensaje */}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        {/* Tiempo */}
        <p className="text-xs text-gray-500 mt-2">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Hace un momento';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  return `Hace ${Math.floor(seconds / 86400)} días`;
}
