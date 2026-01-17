import React, { useState } from 'react';
import { Agent, updateAgent, removeAgent } from '../../lib/api/agents';

interface AgentCardProps {
  agent: Agent;
  onUpdate: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Sin nombre';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Determinar el rol y su color
  const getRoleBadge = (role: string) => {
    const roles: { [key: string]: { label: string; color: string } } = {
      owner: { label: 'Propietario', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      admin: { label: 'Administrador', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      agent: { label: 'Agente', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    return roles[role] || roles.agent;
  };

  const roleBadge = getRoleBadge(agent.agency_role || 'agent');

  const handleToggleStatus = async () => {
    if (!confirm(`¿Deseas ${agent.is_active ? 'desactivar' : 'activar'} a este agente?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await updateAgent(agent.agency_id, agent.id, {
        is_active: !agent.is_active
      });
      onUpdate();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar el agente');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`¿Estás seguro de eliminar a ${fullName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await removeAgent(agent.agency_id, agent.id);
      onUpdate();
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el agente');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header con avatar e info básica */}
      <div className="p-5 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-start gap-4 mb-3">
          {agent.profile_picture_url ? (
            <img
              src={agent.profile_picture_url}
              alt={fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{fullName}</h3>
            <p className="text-sm text-gray-600 truncate flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {agent.email}
            </p>
            {agent.phone && (
              <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {agent.phone}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            agent.is_active
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {agent.is_active ? '✓ Activo' : '○ Inactivo'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-5 bg-white border-t border-gray-100">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{agent.listings_count || 0}</p>
          <p className="text-xs text-gray-600 mt-1">Total propiedades</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{agent.active_listings_count || 0}</p>
          <p className="text-xs text-gray-600 mt-1">Publicadas</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating || agent.agency_role === 'owner'}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              agent.is_active
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
            }`}
            title={agent.agency_role === 'owner' ? 'No puedes desactivar al propietario' : ''}
          >
            {agent.is_active ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={handleRemove}
            disabled={isUpdating || agent.agency_role === 'owner'}
            className="px-4 py-2.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={agent.agency_role === 'owner' ? 'No puedes eliminar al propietario' : 'Eliminar agente'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="p-5 bg-white border-t border-gray-200 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Rol en agencia:</span>
            <span className="font-medium text-gray-900">{roleBadge.label}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Fecha de ingreso:</span>
            <span className="font-medium text-gray-900">
              {new Date(agent.joined_agency_at).toLocaleDateString('es-PE', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          {agent.last_login_at && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Último acceso:</span>
              <span className="font-medium text-gray-900">
                {new Date(agent.last_login_at).toLocaleDateString('es-PE', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cuenta creada:</span>
            <span className="font-medium text-gray-900">
              {new Date(agent.created_at).toLocaleDateString('es-PE', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <p className="text-gray-600 mb-2">Estado de cuenta:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className={`px-3 py-2 rounded-lg text-center ${
                agent.is_active ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <p className="text-xs text-gray-600">Activo</p>
                <p className={`text-lg font-bold ${
                  agent.is_active ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {agent.is_active ? 'Sí' : 'No'}
                </p>
              </div>
              <div className={`px-3 py-2 rounded-lg text-center ${
                agent.role === 'agent' ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <p className="text-xs text-gray-600">Rol sistema</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {agent.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
