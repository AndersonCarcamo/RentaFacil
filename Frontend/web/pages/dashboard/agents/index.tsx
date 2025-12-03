import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Header } from '../../../components/common/Header';
import { Footer } from '../../../components/common/Footer';
import { InviteAgentModal } from '../../../components/agents/InviteAgentModal';
import { AgentCard } from '../../../components/agents/AgentCard';
import { getAgents, getPendingInvitations, revokeInvitation, type Agent, type AgentInvitation } from '../../../lib/api/agents';
import { getMyAgency } from '../../../lib/api/agencies';

export default function AgentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<AgentInvitation[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's agency
      try {
        const agency = await getMyAgency();
        setAgencyId(agency.id);

        // Load agents and invitations
        const [agentsData, invitationsData] = await Promise.all([
          getAgents(agency.id, filter !== 'active'),
          getPendingInvitations(agency.id)
        ]);

        setAgents(agentsData.agents);
        setStats({
          total: agentsData.total,
          active: agentsData.active_count,
          inactive: agentsData.inactive_count,
          pending: agentsData.pending_invitations
        });
        setPendingInvitations(invitationsData);
      } catch (agencyError: any) {
        // If user doesn't have an agency, show appropriate message
        if (agencyError.message?.includes('not associated') || 
            agencyError.message?.includes('no está asociado') ||
            agencyError.message?.includes('User is not associated')) {
          setError('No tienes una agencia asociada. Por favor contacta al administrador.');
          setAgents([]);
          setStats({ total: 0, active: 0, inactive: 0, pending: 0 });
          setPendingInvitations([]);
        } else {
          throw agencyError;
        }
      }

    } catch (error: any) {
      console.error('Error loading agents:', error);
      setError(error.message || 'Error al cargar los agentes');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSent = () => {
    setShowInviteModal(false);
    loadData();
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!agencyId) return;
    
    if (!confirm('¿Estás seguro de revocar esta invitación?')) return;

    try {
      await revokeInvitation(agencyId, invitationId);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Error al revocar la invitación');
    }
  };

  const filteredAgents = (agents || []).filter(agent => {
    if (filter === 'active') return agent.is_active;
    if (filter === 'inactive') return !agent.is_active;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Equipo</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Gestiona los agentes de tu agencia</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={!agencyId}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              title={!agencyId ? 'Necesitas estar asociado a una agencia primero' : 'Invitar nuevo agente'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Invitar Agente</span>
              <span className="sm:hidden">Invitar</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mt-4 sm:mt-6 -mx-4 sm:mx-0">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0 snap-x snap-mandatory">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-[140px] sm:min-w-0 snap-start">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Total Agentes</div>
                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-[140px] sm:min-w-0 snap-start">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Activos</div>
                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-[140px] sm:min-w-0 snap-start">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Inactivos</div>
                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-400">{stats.inactive}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 min-w-[140px] sm:min-w-0 snap-start">
                <div className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">Invitaciones</div>
                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-1 sm:mb-2">
                  No tienes una agencia asociada
                </h3>
                <p className="text-sm sm:text-base text-yellow-800 mb-3 sm:mb-4">
                  Para gestionar agentes, primero debes estar asociado a una agencia. 
                  Puedes crear tu propia agencia o ser invitado por otra agencia existente.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => router.push('/dashboard/agencies')}
                    className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm sm:text-base"
                  >
                    Ver Agencias
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto px-4 py-2 bg-white text-yellow-900 border border-yellow-300 rounded-lg font-medium hover:bg-yellow-50 transition-colors text-sm sm:text-base"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
              filter === 'inactive'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inactivos
          </button>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Invitaciones Pendientes</h2>
            
            {/* Mobile view - Cards */}
            <div className="sm:hidden space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{invitation.first_name} {invitation.last_name}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{invitation.email}</p>
                    </div>
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Revocar
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invitado por:</span>
                      <span className="text-gray-900">{invitation.invited_by_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="text-gray-900">{new Date(invitation.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expira:</span>
                      <span className="text-gray-900">{new Date(invitation.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop view - Table */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invitado por</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expira</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invitation.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.first_name} {invitation.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.invited_by_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agents Grid */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            {filter === 'all' ? 'Todos los Agentes' : filter === 'active' ? 'Agentes Activos' : 'Agentes Inactivos'}
          </h2>
          {filteredAgents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
              <div className="text-gray-400 text-base sm:text-lg">
                {filter === 'active' ? 'No hay agentes activos' : 
                 filter === 'inactive' ? 'No hay agentes inactivos' : 
                 'No hay agentes registrados'}
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
              >
                Invitar tu primer agente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onUpdate={loadData}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showInviteModal && (
        agencyId ? (
          <InviteAgentModal
            agencyId={agencyId}
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onSuccess={handleInviteSent}
          />
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No tienes una agencia
                </h3>
                <p className="text-gray-600 mb-6">
                  Para invitar agentes, primero debes crear o unirte a una agencia inmobiliaria.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard/agencies')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Ver Agencias
                  </button>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
