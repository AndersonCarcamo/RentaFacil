import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import { Header } from '../../components/common/Header';
import Button from '../../components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface PropertyVerification {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_address: string;
  status: 'pending' | 'in_review' | 'verified' | 'rejected' | 'needs_correction';
  document_type: 'escritura' | 'boleta_compra' | 'titulo_propiedad' | 'otro';
  document_url: string;
  document_name: string;
  uploaded_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export default function VerificacionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [verifications, setVerifications] = useState<PropertyVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<PropertyVerification | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Datos mock para demostración
  const mockVerifications: PropertyVerification[] = [
    {
      id: '1',
      listing_id: 'prop-001',
      listing_title: 'Departamento en Miraflores',
      listing_address: 'Av. Larco 1234, Miraflores',
      status: 'verified',
      document_type: 'escritura',
      document_url: '/documents/escritura-001.pdf',
      document_name: 'escritura_publica_miraflores.pdf',
      uploaded_at: '2025-01-15T10:30:00',
      reviewed_at: '2025-01-16T14:20:00',
      admin_notes: 'Documento validado correctamente. Todos los datos coinciden.',
    },
    {
      id: '2',
      listing_id: 'prop-002',
      listing_title: 'Casa en San Isidro',
      listing_address: 'Calle Las Flores 567, San Isidro',
      status: 'in_review',
      document_type: 'titulo_propiedad',
      document_url: '/documents/titulo-002.pdf',
      document_name: 'titulo_propiedad_san_isidro.pdf',
      uploaded_at: '2025-01-18T09:15:00',
    },
    {
      id: '3',
      listing_id: 'prop-003',
      listing_title: 'Oficina en San Borja',
      listing_address: 'Av. Javier Prado 890, San Borja',
      status: 'rejected',
      document_type: 'boleta_compra',
      document_url: '/documents/boleta-003.pdf',
      document_name: 'boleta_compra_oficina.pdf',
      uploaded_at: '2025-01-17T16:45:00',
      reviewed_at: '2025-01-18T11:30:00',
      rejection_reason: 'El documento no es legible. Por favor suba una imagen más clara.',
      admin_notes: 'La calidad del documento es insuficiente para verificación.',
    },
    {
      id: '4',
      listing_id: 'prop-004',
      listing_title: 'Local Comercial en Surco',
      listing_address: 'Av. Primavera 2345, Surco',
      status: 'needs_correction',
      document_type: 'escritura',
      document_url: '/documents/escritura-004.pdf',
      document_name: 'escritura_local_comercial.pdf',
      uploaded_at: '2025-01-16T13:20:00',
      reviewed_at: '2025-01-17T10:00:00',
      rejection_reason: 'El nombre del propietario no coincide con el registrado en la plataforma.',
      admin_notes: 'Por favor verifique que el documento corresponda al propietario actual.',
    },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadVerifications();
    }
  }, [user, authLoading, router]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      // TODO: Reemplazar con llamada real a la API
      // const data = await getPropertyVerifications();
      
      // Simulación de carga
      await new Promise(resolve => setTimeout(resolve, 800));
      setVerifications(mockVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: PropertyVerification['status']) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verificado',
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800',
        };
      case 'in_review':
        return {
          label: 'En Revisión',
          icon: ClockIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          icon: XCircleIcon,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-800',
        };
      case 'needs_correction':
        return {
          label: 'Necesita Corrección',
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          label: 'Pendiente',
          icon: ClockIcon,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const getDocumentTypeLabel = (type: PropertyVerification['document_type']) => {
    switch (type) {
      case 'escritura':
        return 'Escritura Pública';
      case 'boleta_compra':
        return 'Boleta de Compra-Venta';
      case 'titulo_propiedad':
        return 'Título de Propiedad';
      case 'otro':
        return 'Otro Documento';
      default:
        return 'Documento';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDocument = (verification: PropertyVerification) => {
    setSelectedVerification(verification);
  };

  const handleUploadNewDocument = (listingId: string) => {
    setSelectedListingId(listingId);
    setShowUploadModal(true);
  };

  const stats = {
    total: verifications.length,
    verified: verifications.filter(v => v.status === 'verified').length,
    pending: verifications.filter(v => v.status === 'pending' || v.status === 'in_review').length,
    rejected: verifications.filter(v => v.status === 'rejected' || v.status === 'needs_correction').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Verificación de Propiedades - EasyRent Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver al Dashboard
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Verificación de Propiedades
                </h1>
                <p className="text-gray-600">
                  Gestiona la verificación de documentos legales de tus propiedades
                </p>
              </div>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Subir Documento
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Propiedades</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verificadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleSolidIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En Revisión</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Requieren Atención</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Documentos Aceptados para Verificación
                </h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    <span><strong>Escritura Pública:</strong> Documento notarial que acredita la propiedad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    <span><strong>Título de Propiedad:</strong> Certificado emitido por SUNARP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    <span><strong>Boleta de Compra-Venta:</strong> Contrato de compraventa registrado</span>
                  </li>
                </ul>
                <p className="text-sm text-blue-700 mt-3">
                  <strong>Importante:</strong> Los documentos deben estar vigentes (no mayor a 6 meses), ser legibles y en formato PDF o imagen (JPG, PNG).
                </p>
              </div>
            </div>
          </div>

          {/* Lista de verificaciones */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Estado de Verificaciones</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {verifications.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay verificaciones registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza subiendo un documento legal de tu propiedad
                  </p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    Subir Primer Documento
                  </Button>
                </div>
              ) : (
                verifications.map((verification) => {
                  const statusConfig = getStatusConfig(verification.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div key={verification.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-12 h-12 ${statusConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {verification.listing_title}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {verification.listing_address}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <DocumentTextIcon className="w-4 h-4" />
                                  {getDocumentTypeLabel(verification.document_type)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  {formatDate(verification.uploaded_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detalles adicionales según estado */}
                          {verification.status === 'verified' && verification.admin_notes && (
                            <div className="ml-16 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                              <div className="flex items-start gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-green-900 mb-1">
                                    Verificación Exitosa
                                  </p>
                                  <p className="text-sm text-green-700">
                                    {verification.admin_notes}
                                  </p>
                                  {verification.reviewed_at && (
                                    <p className="text-xs text-green-600 mt-2">
                                      Verificado el {formatDate(verification.reviewed_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {verification.status === 'in_review' && (
                            <div className="ml-16 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                              <div className="flex items-start gap-2">
                                <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900 mb-1">
                                    En Proceso de Revisión
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    Tu documento está siendo revisado por nuestro equipo. Te notificaremos cuando finalice el proceso.
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">
                                    Tiempo estimado: 24-48 horas
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {(verification.status === 'rejected' || verification.status === 'needs_correction') && verification.rejection_reason && (
                            <div className="ml-16 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                              <div className="flex items-start gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-900 mb-1">
                                    {verification.status === 'rejected' ? 'Documento Rechazado' : 'Requiere Corrección'}
                                  </p>
                                  <p className="text-sm text-red-700 mb-2">
                                    {verification.rejection_reason}
                                  </p>
                                  {verification.admin_notes && (
                                    <p className="text-sm text-red-600 mb-3">
                                      <strong>Nota:</strong> {verification.admin_notes}
                                    </p>
                                  )}
                                  <button
                                    onClick={() => handleUploadNewDocument(verification.listing_id)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <ArrowPathIcon className="w-4 h-4" />
                                    Subir Nuevo Documento
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleViewDocument(verification)}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Ver Documento
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Ver Documento */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedVerification.listing_title}
                </h3>
                <p className="text-sm text-gray-600">
                  {getDocumentTypeLabel(selectedVerification.document_type)}
                </p>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <DocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Vista previa del documento</p>
                <p className="text-sm text-gray-500 mb-4">{selectedVerification.document_name}</p>
                <Button
                  onClick={() => window.open(selectedVerification.document_url, '_blank')}
                  className="inline-flex items-center gap-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  Abrir Documento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Subir Documento (placeholder) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Subir Documento de Verificación
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedListingId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600 py-8">
                Funcionalidad de upload en desarrollo...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
