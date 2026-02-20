/**
 * UsersTab Component
 * Tab de usuarios con clasificación tree vertical y filtros backend
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ClockIcon,
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { getUsersStats, getUsersList, UsersStats, UsersListResponse } from '@/lib/api/admin-dashboard';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'agent' | 'admin';
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  last_login: string | null;
  avatar_url: string | null;
  first_name: string;
  last_name: string;
}

interface TreeNode {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  filterKey: string;
  filterValue: string | boolean | null;
  children?: TreeNode[];
  color?: string;
}

const ROLE_LABELS = {
  user: 'Usuario',
  agent: 'Agente',
  admin: 'Administrador',
};

const ROLE_COLORS = {
  user: 'blue',
  agent: 'purple',
  admin: 'red',
};

export default function UsersTab() {
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<{ key: string; value: string | boolean | null } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all']));

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [currentPage, selectedFilter, searchTerm]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getUsersStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (selectedFilter) {
        filters[selectedFilter.key] = selectedFilter.value;
      }

      const data = await getUsersList(filters);
      setUsers(data.data);
      setTotalUsers(data.total);
      setTotalPages(data.pages);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleFilterSelect = (filterKey: string, filterValue: string | boolean | null) => {
    setSelectedFilter({ key: filterKey, value: filterValue });
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Construir árbol de navegación
  const buildTree = (): TreeNode[] => {
    if (!stats) return [];

    return [
      {
        id: 'all',
        label: 'Todos los usuarios',
        icon: UserGroupIcon,
        count: stats.total,
        filterKey: '',
        filterValue: null,
        color: 'gray',
        children: [
          {
            id: 'by_role',
            label: 'Por Rol',
            icon: ShieldCheckIcon,
            filterKey: '',
            filterValue: null,
            children: [
              {
                id: 'role_user',
                label: 'Usuarios',
                icon: UserCircleIcon,
                count: stats.by_role.user,
                filterKey: 'role',
                filterValue: 'user',
                color: 'blue',
              },
              {
                id: 'role_agent',
                label: 'Agentes',
                icon: BuildingOfficeIcon,
                count: stats.by_role.agent,
                filterKey: 'role',
                filterValue: 'agent',
                color: 'purple',
              },
              {
                id: 'role_admin',
                label: 'Administradores',
                icon: ShieldCheckIcon,
                count: stats.by_role.admin,
                filterKey: 'role',
                filterValue: 'admin',
                color: 'red',
              },
            ],
          },
          {
            id: 'by_status',
            label: 'Por Estado',
            icon: CheckIcon,
            filterKey: '',
            filterValue: null,
            children: [
              {
                id: 'status_active',
                label: 'Activos',
                icon: CheckIcon,
                count: stats.by_status.active,
                filterKey: 'is_active',
                filterValue: true,
                color: 'green',
              },
              {
                id: 'status_suspended',
                label: 'Suspendidos',
                icon: XMarkIcon,
                count: stats.by_status.suspended,
                filterKey: 'is_active',
                filterValue: false,
                color: 'red',
              },
            ],
          },
          {
            id: 'by_verification',
            label: 'Por Verificación',
            icon: StarIcon,
            filterKey: '',
            filterValue: null,
            children: [
              {
                id: 'verified_full',
                label: 'Verificados completos',
                icon: CheckIcon,
                count: stats.by_verification.fully_verified,
                filterKey: 'is_verified',
                filterValue: 'full',
                color: 'green',
              },
              {
                id: 'verified_email',
                label: 'Solo email verificado',
                icon: EnvelopeIcon,
                count: stats.by_verification.email_verified,
                filterKey: 'is_verified',
                filterValue: 'email',
                color: 'blue',
              },
              {
                id: 'verified_phone',
                label: 'Solo teléfono verificado',
                icon: PhoneIcon,
                count: stats.by_verification.phone_verified,
                filterKey: 'is_verified',
                filterValue: 'phone',
                color: 'purple',
              },
              {
                id: 'verified_none',
                label: 'Sin verificar',
                icon: XMarkIcon,
                count: stats.by_verification.not_verified,
                filterKey: 'is_verified',
                filterValue: 'none',
                color: 'gray',
              },
            ],
          },
          {
            id: 'by_activity',
            label: 'Por Actividad',
            icon: BoltIcon,
            filterKey: '',
            filterValue: null,
            children: [
              {
                id: 'activity_today',
                label: 'Nuevos hoy',
                icon: ClockIcon,
                count: stats.by_activity.new_today,
                filterKey: 'activity',
                filterValue: 'today',
                color: 'green',
              },
              {
                id: 'activity_week',
                label: 'Nuevos esta semana',
                icon: CalendarIcon,
                count: stats.by_activity.new_this_week,
                filterKey: 'activity',
                filterValue: 'week',
                color: 'blue',
              },
              {
                id: 'activity_month',
                label: 'Nuevos este mes',
                icon: CalendarIcon,
                count: stats.by_activity.new_this_month,
                filterKey: 'activity',
                filterValue: 'month',
                color: 'purple',
              },
              {
                id: 'activity_active',
                label: 'Activos última semana',
                icon: BoltIcon,
                count: stats.by_activity.active_last_week,
                filterKey: 'activity',
                filterValue: 'week',
                color: 'green',
              },
            ],
          },
          {
            id: 'by_subscription',
            label: 'Por Suscripción',
            icon: StarIcon,
            filterKey: '',
            filterValue: null,
            children: [
              ...Object.entries(stats.by_subscription)
                .filter(([key]) => key !== 'no_subscription')
                .map(([planName, count]) => ({
                  id: `plan_${planName}`,
                  label: planName.charAt(0).toUpperCase() + planName.slice(1),
                  icon: StarIcon,
                  count: count as number,
                  filterKey: 'plan',
                  filterValue: planName,
                  color: 'indigo',
                })),
              {
                id: 'plan_none',
                label: 'Sin suscripción',
                icon: XMarkIcon,
                count: stats.by_subscription.no_subscription,
                filterKey: 'plan',
                filterValue: 'no_subscription',
                color: 'gray',
              },
            ],
          },
        ],
      },
    ];
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected =
      selectedFilter?.key === node.filterKey && selectedFilter?.value === node.filterValue;

    const Icon = node.icon;
    const textColor = node.color ? `text-${node.color}-600` : 'text-gray-700';
    const bgColor = node.color ? `bg-${node.color}-50` : 'bg-gray-50';
    const borderColor = node.color ? `border-${node.color}-200` : 'border-gray-200';

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (node.filterKey) {
              handleFilterSelect(node.filterKey, node.filterValue);
            }
          }}
          className={`
            flex items-center justify-between gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all
            ${level === 0 ? 'font-semibold' : ''}
            ${isSelected ? `${bgColor} ${borderColor} border-2` : 'hover:bg-gray-100'}
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <span className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                )}
              </span>
            )}
            <Icon className={`w-4 h-4 flex-shrink-0 ${textColor}`} />
            <span className={`text-sm truncate ${textColor}`}>{node.label}</span>
          </div>
          {node.count !== undefined && (
            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                ${isSelected ? `${textColor}` : 'bg-gray-200 text-gray-700'}
              `}
            >
              {node.count.toLocaleString()}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const treeData = buildTree();

  return (
    <div className="h-full flex gap-6">
      {/* Panel izquierdo: Tree de clasificación */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Clasificación</h3>
            {selectedFilter && (
              <button
                onClick={clearFilter}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-1">{treeData.map((node) => renderTreeNode(node))}</div>
          )}
        </div>
      </div>

      {/* Panel derecho: Lista de usuarios */}
      <div className="flex-1 min-w-0">
        {/* Header con búsqueda */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nombre o email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Actualizar
            </button>
          </div>

          {selectedFilter && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filtro activo:</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                {selectedFilter.key}: {String(selectedFilter.value)}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {/* Tabla de usuarios */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Contacto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircleIcon className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {user.is_email_verified && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckIcon className="w-3 h-3" />
                                    Email
                                  </span>
                                )}
                                {user.is_phone_verified && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckIcon className="w-3 h-3" />
                                    Tel
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                              <EnvelopeIcon className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <PhoneIcon className="w-4 h-4" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${
                              ROLE_COLORS[user.role]
                            }-100 text-${ROLE_COLORS[user.role]}-700`}
                          >
                            {user.role === 'admin' && <ShieldCheckIcon className="w-3 h-3" />}
                            {user.role === 'agent' && <BuildingOfficeIcon className="w-3 h-3" />}
                            {user.role === 'user' && <UserCircleIcon className="w-3 h-3" />}
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <CheckIcon className="w-3 h-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="w-3 h-3" />
                                Suspendido
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(user.created_at)}</span>
                            </div>
                            {user.last_login && (
                              <p className="text-xs text-gray-500 mt-1">
                                Último: {formatDate(user.last_login)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {users.length} de {totalUsers.toLocaleString()} usuarios (Página{' '}
                  {currentPage} de {totalPages})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
