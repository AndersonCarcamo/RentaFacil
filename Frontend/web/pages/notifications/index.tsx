import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/hooks/useAuth';
import { notificationService, Notification } from '@/services/notificationService';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const priorityIcons: Record<string, string> = {
  low: 'ℹ️',
  medium: '📢',
  high: '⚠️',
  urgent: '🚨'
};

const typeLabels: Record<string, string> = {
  system: 'Sistema',
  payment: 'Pago',
  booking: 'Reserva',
  verification: 'Verificación',
  message: 'Mensaje',
  listing: 'Propiedad',
  subscription: 'Suscripción',
  review: 'Reseña',
  lead: 'Lead',
  security: 'Seguridad'
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/login');
        return;
      }
      fetchNotifications();
    }
  }, [authLoading, isLoggedIn, filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({
        page,
        size: 20,
        read: filter === 'unread' ? false : undefined
      });

      setNotifications(data.items);
      setTotalPages(data.pages);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Actualizar lista
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (authLoading || loading) {
    return (
      <Layout title="Notificaciones - RentaFacil">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22ACF5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Notificaciones - RentaFacil">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer` : 'Estás al día con todas tus notificaciones'}
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => { setFilter('unread'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-[#22ACF5] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No leídas ({unreadCount})
              </button>
              <button
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#22ACF5] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
            </div>

            {/* Acción marcar todo como leído */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-[#22ACF5] hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                <CheckIcon className="h-5 w-5" />
                Marcar todo como leído
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BellIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? 'Estás al día con todas tus notificaciones' 
                : 'Las notificaciones aparecerán aquí cuando las recibas'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border transition-all ${
                  notification.read_at
                    ? 'border-gray-200 opacity-75'
                    : 'border-l-4 border-l-[#22ACF5]'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border ${priorityColors[notification.priority]}`}>
                      <span className="text-lg">{priorityIcons[notification.priority]}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {typeLabels[notification.notification_type] || notification.notification_type}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {notification.action_url && (
                          <button
                            onClick={() => {
                              if (!notification.read_at) {
                                handleMarkAsRead(notification.id);
                              }
                              router.push(notification.action_url!);
                            }}
                            className="text-sm font-medium text-[#22ACF5] hover:text-[#1a8acc]"
                          >
                            Ver detalles →
                          </button>
                        )}

                        {!notification.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Marcar como leída
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 ml-auto"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
