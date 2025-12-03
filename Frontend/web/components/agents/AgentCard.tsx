import React from 'react';
import { Agent } from '../../lib/api/agents';

interface AgentCardProps {
  agent: Agent;
  onView: (agentId: string) => void;
  onEdit: (agentId: string) => void;
  onToggleStatus: (agentId: string, currentStatus: boolean) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Sin nombre';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header con avatar e info básica */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{fullName}</h3>
          <p className="text-sm text-gray-600 truncate">{agent.email}</p>
          {agent.phone && (
            <p className="text-sm text-gray-500 truncate">📱 {agent.phone}</p>
          )}
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          agent.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {agent.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-2xl font-bold text-gray-900">{agent.listings_count}</p>
          <p className="text-xs text-gray-600">Total propiedades</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{agent.active_listings_count}</p>
          <p className="text-xs text-gray-600">Publicadas</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(agent.id)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver detalles
        </button>
        <button
          onClick={() => onEdit(agent.id)}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onToggleStatus(agent.id, agent.is_active)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            agent.is_active
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title={agent.is_active ? 'Desactivar agente' : 'Activar agente'}
        >
          {agent.is_active ? '🚫' : '✅'}
        </button>
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <p>Unido: {new Date(agent.joined_agency_at).toLocaleDateString('es-PE')}</p>
        {agent.last_login_at && (
          <p>Último acceso: {new Date(agent.last_login_at).toLocaleDateString('es-PE')}</p>
        )}
      </div>
    </div>
  );
};
