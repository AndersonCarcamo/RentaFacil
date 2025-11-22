/**
 * AdminManagement Component
 * Gestión de usuarios administradores del sistema con permisos granulares
 */

'use client';

import React, { useState } from 'react';
import {
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  AdminUser,
  AdminRole,
  Permission,
  ADMIN_ROLES,
  PERMISSION_LABELS,
  hasPermission,
} from '../../types/admin-permissions';

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([
    {
      id: '1',
      email: 'admin@easyrent.pe',
      name: 'Super Admin',
      role: ADMIN_ROLES.SUPER_ADMIN,
      permissions: ADMIN_ROLES.SUPER_ADMIN.permissions,
      addedDate: '2024-01-01',
      addedBy: 'Sistema',
      isActive: true,
      lastLogin: '2024-11-18',
    },
    {
      id: '2',
      email: 'moderador@easyrent.pe',
      name: 'Juan Moderador',
      role: ADMIN_ROLES.MODERATOR,
      permissions: ADMIN_ROLES.MODERATOR.permissions,
      addedDate: '2024-01-15',
      addedBy: 'admin@easyrent.pe',
      isActive: true,
      lastLogin: '2024-11-17',
    },
    {
      id: '3',
      email: 'planes@easyrent.pe',
      name: 'María Gestora',
      role: ADMIN_ROLES.PLANS_MANAGER,
      permissions: ADMIN_ROLES.PLANS_MANAGER.permissions,
      addedDate: '2024-02-01',
      addedBy: 'admin@easyrent.pe',
      isActive: true,
    },
  ]);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>(ADMIN_ROLES.VIEWER);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddAdmin = () => {
    setError('');
    setSuccess('');

    // Validaciones
    if (!newAdminEmail.trim()) {
      setError('Por favor ingresa un correo electrónico');
      return;
    }

    if (!validateEmail(newAdminEmail)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (!newAdminName.trim()) {
      setError('Por favor ingresa el nombre del administrador');
      return;
    }

    const normalizedEmail = newAdminEmail.toLowerCase().trim();

    if (admins.some(admin => admin.email.toLowerCase() === normalizedEmail)) {
      setError('Este correo ya es administrador');
      return;
    }

    // Combinar permisos del rol con permisos personalizados
    const allPermissions = Array.from(new Set([...selectedRole.permissions, ...customPermissions]));

    // Agregar nuevo admin
    const newAdmin: AdminUser = {
      id: Date.now().toString(),
      email: normalizedEmail,
      name: newAdminName.trim(),
      role: selectedRole,
      permissions: allPermissions,
      addedDate: new Date().toISOString().split('T')[0],
      addedBy: 'admin@easyrent.pe', // TODO: Obtener del usuario actual
      isActive: true,
    };

    setAdmins([...admins, newAdmin]);
    setNewAdminEmail('');
    setNewAdminName('');
    setSelectedRole(ADMIN_ROLES.VIEWER);
    setCustomPermissions([]);
    setSuccess(`✓ ${newAdminName} agregado como ${selectedRole.name}`);

    // TODO: Guardar en backend
    console.log('👤 Nuevo admin agregado:', newAdmin);

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRemoveAdmin = (admin: AdminUser) => {
    setError('');
    setSuccess('');

    // Prevenir eliminar el último super admin
    const superAdmins = admins.filter(a => a.role.id === 'super_admin' && a.isActive);
    if (superAdmins.length === 1 && admin.role.id === 'super_admin') {
      setError('No puedes eliminar el último Super Administrador');
      return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de eliminar a ${admin.name || admin.email} como administrador?`)) {
      return;
    }

    setAdmins(admins.filter(a => a.id !== admin.id));
    setSuccess(`✓ ${admin.name || admin.email} eliminado como administrador`);

    // TODO: Guardar en backend
    console.log('👤 Admin eliminado:', admin);

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleActive = (admin: AdminUser) => {
    setAdmins(admins.map(a => 
      a.id === admin.id ? { ...a, isActive: !a.isActive } : a
    ));
    setSuccess(`✓ ${admin.name || admin.email} ${admin.isActive ? 'desactivado' : 'activado'}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditPermissions = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = () => {
    if (!editingAdmin) return;

    setAdmins(admins.map(a => 
      a.id === editingAdmin.id ? editingAdmin : a
    ));
    
    setSuccess(`✓ Permisos actualizados para ${editingAdmin.name || editingAdmin.email}`);
    setShowPermissionsModal(false);
    setEditingAdmin(null);
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const togglePermission = (permission: Permission) => {
    if (!editingAdmin) return;

    const hasIt = editingAdmin.permissions.includes(permission);
    const newPermissions = hasIt
      ? editingAdmin.permissions.filter(p => p !== permission)
      : [...editingAdmin.permissions, permission];

    setEditingAdmin({ ...editingAdmin, permissions: newPermissions });
  };

  // Agrupar permisos por categoría
  const groupedPermissions = Object.entries(PERMISSION_LABELS).reduce((acc, [key, value]) => {
    const category = value.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ permission: key as Permission, ...value });
    return acc;
  }, {} as Record<string, Array<{ permission: Permission; label: string; description: string; category: string }>>);

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Gestión de Administradores con Permisos</h3>
        <p className="text-sm text-gray-600">
          Administra los usuarios y sus permisos de acceso al panel de administración
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Agregar Nuevo Admin */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlusIcon className="w-6 h-6 text-blue-600" />
          <h4 className="font-semibold text-gray-900 text-lg">Agregar Nuevo Administrador</h4>
        </div>

        <div className="space-y-4">
          {/* Email y Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol y Permisos *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(ADMIN_ROLES).map((role) => {
                const colors = roleColors[role.color];
                const isSelected = selectedRole.id === role.id;

                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? `${colors.border} ${colors.bg} shadow-md`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{role.icon}</span>
                      {isSelected && (
                        <CheckCircleIcon className={`w-5 h-5 ${colors.text}`} />
                      )}
                    </div>
                    <h5 className={`font-semibold mb-1 ${isSelected ? colors.text : 'text-gray-900'}`}>
                      {role.name}
                    </h5>
                    <p className="text-xs text-gray-600 mb-2">
                      {role.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      {role.permissions.length} permisos
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permisos Personalizados */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500" />
              Permisos Personalizados (Opcional)
            </h5>
            <p className="text-xs text-gray-600 mb-3">
              Agrega permisos adicionales además de los incluidos en el rol seleccionado
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(Permission).slice(0, 6).map(([key, value]) => {
                const info = PERMISSION_LABELS[value];
                const isIncluded = customPermissions.includes(value);
                
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => {
                        if (isIncluded) {
                          setCustomPermissions(customPermissions.filter(p => p !== value));
                        } else {
                          setCustomPermissions([...customPermissions, value]);
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{info.label}</div>
                      <div className="text-xs text-gray-500">{info.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botón Agregar */}
          <button
            onClick={handleAddAdmin}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            Agregar Administrador
          </button>
        </div>
      </div>

      {/* Lista de Administradores */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span>Administradores Actuales ({admins.length})</span>
          <span className="text-sm font-normal text-gray-600">
            {admins.filter(a => a.isActive).length} activos
          </span>
        </h4>

        <div className="space-y-3">
          {admins.map((admin) => {
            const colors = roleColors[admin.role.color];

            return (
              <div
                key={admin.id}
                className={`bg-white border-2 rounded-xl p-5 transition-all ${
                  admin.isActive
                    ? 'border-gray-200 hover:border-blue-300'
                    : 'border-gray-100 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                      <span className="text-2xl">{admin.role.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-semibold text-gray-900">{admin.name}</h5>
                        <span className={`px-2.5 py-0.5 ${colors.bg} ${colors.text} text-xs font-medium rounded-full`}>
                          {admin.role.name}
                        </span>
                        {!admin.isActive && (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        {admin.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>
                          Agregado el {new Date(admin.addedDate).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {admin.lastLogin && (
                          <span>
                            • Último acceso: {new Date(admin.lastLogin).toLocaleDateString('es-PE', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditPermissions(admin)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Editar permisos"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(admin)}
                      className={`p-2 rounded-lg transition-colors ${
                        admin.isActive
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={admin.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {admin.isActive ? (
                        <XMarkIcon className="w-5 h-5" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                    </button>

                    {admin.role.id !== 'super_admin' && (
                      <button
                        onClick={() => handleRemoveAdmin(admin)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Eliminar administrador"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permisos */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase">
                      Permisos ({admin.permissions.length})
                    </span>
                    <button
                      onClick={() => handleEditPermissions(admin)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todos →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {admin.permissions.slice(0, 6).map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200"
                      >
                        {PERMISSION_LABELS[permission].label}
                      </span>
                    ))}
                    {admin.permissions.length > 6 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded font-medium">
                        +{admin.permissions.length - 6} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Permisos */}
      {showPermissionsModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar Permisos - {editingAdmin.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Rol: {editingAdmin.role.name} • {editingAdmin.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setEditingAdmin(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600" />
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {permissions.map(({ permission, label, description }) => {
                        const hasIt = editingAdmin.permissions.includes(permission);
                        
                        return (
                          <label
                            key={permission}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              hasIt
                                ? 'bg-blue-50 border-2 border-blue-200'
                                : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasIt}
                              onChange={() => togglePermission(permission)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-600 mt-0.5">{description}</div>
                            </div>
                            {hasIt && (
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                <strong>{editingAdmin.permissions.length}</strong> permisos seleccionados
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setEditingAdmin(null);
                  }}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de Seguridad */}
      <div className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">⚠️ Consideraciones de Seguridad</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Solo agrega como administradores a personas de absoluta confianza</li>
              <li>• Asigna solo los permisos necesarios según las responsabilidades del usuario</li>
              <li>• Revisa periódicamente los permisos de cada administrador</li>
              <li>• Desactiva inmediatamente cuentas de administradores que ya no requieran acceso</li>
              <li>• Todos los cambios quedan registrados en el sistema de auditoría</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
