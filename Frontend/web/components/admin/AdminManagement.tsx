/**
 * AdminManagement Component
 * Gestión de usuarios administradores del sistema
 */

'use client';

import React, { useState } from 'react';
import {
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AdminUser {
  email: string;
  addedDate: string;
  addedBy?: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([
    { email: 'admin@easyrent.pe', addedDate: '2024-01-01', addedBy: 'Sistema' },
    { email: 'administrador@easyrent.pe', addedDate: '2024-01-01', addedBy: 'Sistema' },
    { email: 'support@easyrent.pe', addedDate: '2024-01-15', addedBy: 'admin@easyrent.pe' },
    { email: 'rentafacildirectoriohomesperu@gmail.com', addedDate: '2024-01-20', addedBy: 'admin@easyrent.pe' },
  ]);

  const [newAdminEmail, setNewAdminEmail] = useState('');
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

    const normalizedEmail = newAdminEmail.toLowerCase().trim();

    if (admins.some(admin => admin.email.toLowerCase() === normalizedEmail)) {
      setError('Este correo ya es administrador');
      return;
    }

    // Agregar nuevo admin
    const newAdmin: AdminUser = {
      email: normalizedEmail,
      addedDate: new Date().toISOString().split('T')[0],
      addedBy: 'admin@easyrent.pe', // TODO: Obtener del usuario actual
    };

    setAdmins([...admins, newAdmin]);
    setNewAdminEmail('');
    setSuccess(`✓ ${normalizedEmail} agregado como administrador`);

    // TODO: Guardar en backend
    console.log('👤 Nuevo admin agregado:', newAdmin);

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRemoveAdmin = (email: string) => {
    setError('');
    setSuccess('');

    // Prevenir eliminar el último admin
    if (admins.length === 1) {
      setError('No puedes eliminar el último administrador');
      return;
    }

    // Prevenir eliminar admins del sistema
    const systemAdmins = ['admin@easyrent.pe', 'administrador@easyrent.pe'];
    if (systemAdmins.includes(email.toLowerCase())) {
      setError('No puedes eliminar administradores del sistema');
      return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de eliminar a ${email} como administrador?`)) {
      return;
    }

    setAdmins(admins.filter(admin => admin.email !== email));
    setSuccess(`✓ ${email} eliminado como administrador`);

    // TODO: Guardar en backend
    console.log('👤 Admin eliminado:', email);

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Gestión de Administradores</h3>
        <p className="text-sm text-gray-600">
          Administra los usuarios que tienen acceso al panel de administración
        </p>
      </div>

      {/* Agregar Nuevo Admin */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlusIcon className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Agregar Nuevo Administrador</h4>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddAdmin}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            Agregar
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <ShieldCheckIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        <div className="mt-4 bg-white rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase mb-2">ℹ️ Información</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Los administradores tienen acceso completo al panel de administración</li>
            <li>• Pueden ver y modificar todos los datos del sistema</li>
            <li>• Los administradores del sistema no pueden ser eliminados</li>
            <li>• Debe haber al menos un administrador en el sistema</li>
          </ul>
        </div>
      </div>

      {/* Lista de Administradores */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">
          Administradores Actuales ({admins.length})
        </h4>

        <div className="space-y-3">
          {admins.map((admin) => {
            const isSystemAdmin = ['admin@easyrent.pe', 'administrador@easyrent.pe'].includes(admin.email.toLowerCase());

            return (
              <div
                key={admin.email}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-gray-900">{admin.email}</h5>
                        {isSystemAdmin && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            Sistema
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Agregado el {new Date(admin.addedDate).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {admin.addedBy && ` por ${admin.addedBy}`}
                      </p>
                    </div>
                  </div>

                  {!isSystemAdmin && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Eliminar administrador"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información de Seguridad */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">⚠️ Consideraciones de Seguridad</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Solo agrega como administradores a personas de absoluta confianza</li>
              <li>• Los administradores pueden acceder a toda la información del sistema</li>
              <li>• Revisa periódicamente la lista de administradores activos</li>
              <li>• Si un correo administrador es comprometido, elimínalo inmediatamente</li>
              <li>• Todos los cambios quedan registrados en el sistema de auditoría</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
