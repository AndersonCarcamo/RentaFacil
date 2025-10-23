import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/hooks/useAuth';
import { getCurrentSubscription, getDefaultPlan, SubscriptionPlan, UserSubscription } from '../lib/api/subscriptions';
import { getMyListings, Listing, publishListing, unpublishListing, deleteListing } from '../lib/api/listings';
import { Header } from '../components/Header';
import Button from '../components/ui/Button';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  HomeIcon,
  ChartBarIcon,
  BanknotesIcon,
  UsersIcon,
  BuildingOfficeIcon,
  PresentationChartBarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  CameraIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  PlayIcon,
  ClockIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface FilterState {
  search: string;
  type: string;
  rentalType: string;
  status: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Estados para suscripción
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Obtener plan actual (de la suscripción o plan gratuito por defecto)
  const currentPlan = currentSubscription?.plan || getDefaultPlan();
  const planLimits = {
    name: currentPlan.name,
    maxActiveListings: currentPlan.limits?.max_listings ?? 3,
    features: currentPlan.features || [],
  };

  const [properties, setProperties] = useState<Listing[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Listing[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState<'created' | 'updated'>('created');
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'analytics' | 'verification'>('overview');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Listing | null>(null);
  const [selectedPropertyComments, setSelectedPropertyComments] = useState<Listing | null>(null);
  const [previewProperty, setPreviewProperty] = useState<Listing | null>(null);
  const [contactSettingsVersion, setContactSettingsVersion] = useState(0); // Para forzar recarga
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    rentalType: '',
    status: '',
    priceMin: '',
    priceMax: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Check for success message and tab from query params
    const successParam = router.query.success as string;
    const tabParam = router.query.tab as string;
    
    if (successParam === 'listing_created' || successParam === 'listing_updated') {
      setSuccessMessageType(successParam === 'listing_created' ? 'created' : 'updated');
      setShowSuccessMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    
    // Cambiar a la pestaña especificada en la URL
    if (tabParam === 'listings' || tabParam === 'properties') {
      setActiveTab('properties');
    }
    
    // Remove query params from URL
    if (successParam || tabParam) {
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [user, loading, router]);

  // Efecto para recargar configuración de contacto cuando la página obtiene foco
  useEffect(() => {
    const handleFocus = () => {
      // Forzar recarga de la configuración
      setContactSettingsVersion(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Effect to load user properties
  useEffect(() => {
    const loadProperties = async () => {
      if (!user) return;
      
      try {
        setPropertiesLoading(true);
        setPropertiesError(null);
        const listings = await getMyListings();
        setProperties(listings);
      } catch (error) {
        console.error('Error loading properties:', error);
        setPropertiesError('Error al cargar las propiedades');
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };

    loadProperties();
  }, [user]);

  // Effect to load user subscription
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      
      try {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        const subscription = await getCurrentSubscription();
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error loading subscription:', error);
        setSubscriptionError('Error al cargar la suscripción');
        // Si hay error, usar plan gratuito por defecto
        setCurrentSubscription(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  // Effect to filter and sort properties
  useEffect(() => {
    let filtered = [...properties];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchLower) ||
        (property.address?.toLowerCase().includes(searchLower)) ||
        (property.district?.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(property => property.property_type === filters.type);
    }

    // Apply rental type filter (now using rental_model)
    if (filters.rentalType) {
      filtered = filtered.filter(property => property.rental_model === filters.rentalType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    // Apply price range filter
    if (filters.priceMin) {
      filtered = filtered.filter(property => property.price >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(property => property.price <= parseInt(filters.priceMax));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'views':
          aValue = a.views_count || 0;
          bValue = b.views_count || 0;
          break;
        case 'contacts':
          aValue = a.leads_count || 0;
          bValue = b.leads_count || 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProperties(filtered);
  }, [properties, filters]);

  const handleToggleStatus = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    try {
      // Toggle entre published y unpublished (no draft)
      const isCurrentlyPublished = property.status === 'published';
      
      // Si intenta publicar, verificar el límite
      if (!isCurrentlyPublished) {
        const currentActiveCount = properties.filter(p => p.status === 'published').length;
        if (currentActiveCount >= planLimits.maxActiveListings) {
          // Mostrar modal de límite alcanzado
          setShowLimitModal(true);
          return;
        }
      }
      
      // Llamar al endpoint correspondiente
      let updatedProperty;
      if (isCurrentlyPublished) {
        // Despublicar (cambia a estado 'unpublished' o 'draft')
        updatedProperty = await unpublishListing(propertyId);
      } else {
        // Publicar
        updatedProperty = await publishListing(propertyId);
      }
      
      // Actualizar localmente con el estado que retorna el backend
      setProperties(prev => prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, status: updatedProperty.status }
          : prop
      ));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error al cambiar el estado de la propiedad');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      try {
        await deleteListing(propertyId);
        setProperties(prev => prev.filter(prop => prop.id !== propertyId));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error al eliminar la propiedad');
      }
    }
  };

  const handleDuplicateProperty = (property: Listing) => {
    // TODO: Implementar duplicación con API
    console.log('Duplicar propiedad:', property.id);
    alert('Funcionalidad de duplicar próximamente');
  };

  const handleEditProperty = (property: Listing) => {
    // Redirigir a la página de edición con el ID de la propiedad
    router.push(`/dashboard/create-listing?edit=${property.id}`);
  };

  const handleViewComments = (property: Property) => {
    setSelectedPropertyComments(property);
    setShowCommentsModal(true);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      rentalType: '',
      status: '',
      priceMin: '',
      priceMax: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      case 'under_review': return 'En revisión';
      default: return status || 'Desconocido';
    }
  };

  // Función para obtener configuración de contacto
  const getContactSettings = () => {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem('contactSettings');
    if (!saved) return null;
    
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  // Función para generar contacto de WhatsApp
  const generateWhatsAppContact = (property: Property) => {
    const contactSettings = getContactSettings();
    if (!contactSettings?.whatsapp?.enabled || !contactSettings?.whatsapp?.number) return null;

    const message = contactSettings.whatsapp.message
      .replace(/\{TITULO\}/g, property.title)
      .replace(/\{DIRECCION\}/g, property.address)
      .replace(/\{LINK\}/g, `${window.location.origin}/propiedad/${property.id}`);

    return `https://wa.me/${contactSettings.whatsapp.number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  // Función para generar contacto de email
  const generateEmailContact = (property: Property) => {
    const contactSettings = getContactSettings();
    if (!contactSettings?.email?.enabled || !contactSettings?.email?.address) return null;

    const subject = contactSettings.email.subject
      .replace(/\{TITULO\}/g, property.title)
      .replace(/\{DIRECCION\}/g, property.address);

    const message = contactSettings.email.message
      .replace(/\{TITULO\}/g, property.title)
      .replace(/\{DIRECCION\}/g, property.address)
      .replace(/\{LINK\}/g, `${window.location.origin}/propiedad/${property.id}`);

    return `mailto:${contactSettings.email.address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  // Función para generar contacto telefónico
  const generatePhoneContact = () => {
    const contactSettings = getContactSettings();
    if (!contactSettings?.phone?.enabled || !contactSettings?.phone?.number) return null;

    return `tel:${contactSettings.phone.number}`;
  };

  // Modal de vista previa con diseño real de PropertyCard
  const renderPreviewModal = () => {
    if (!previewProperty) return null;

    // Obtener configuración de contacto desde localStorage (se recarga cuando cambia contactSettingsVersion)
    const contactSettings = getContactSettings();
    
    // HERENCIA: Usar datos de propiedad si existen, sino usar config global
    const whatsappNumber = previewProperty.contact_whatsapp_phone_e164 || contactSettings?.whatsapp?.number;
    const phoneNumber = previewProperty.contact_phone_e164 || contactSettings?.phone?.number;
    const emailAddress = contactSettings?.email?.address; // Email siempre de config global
    const contactName = previewProperty.contact_name || 'Propietario';
    
    // Verificar qué métodos están disponibles (activos en config global Y con datos)
    const hasWhatsApp = contactSettings?.whatsapp?.enabled && whatsappNumber;
    const hasEmail = contactSettings?.email?.enabled && emailAddress;
    const hasPhone = contactSettings?.phone?.enabled && phoneNumber;
    const hasContactMethods = hasWhatsApp || hasEmail || hasPhone;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setPreviewProperty(null);
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Vista Previa</h3>
              <p className="text-sm text-gray-500">Así se ve tu propiedad para los inquilinos</p>
            </div>
            <button
              onClick={() => setPreviewProperty(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Vista previa como se vería en el modal de propiedad */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Imagen principal con carrusel simulado */}
              <div className="relative h-64 bg-gradient-to-br from-gray-300 to-gray-400 group">
                {previewProperty.images && previewProperty.images.length > 0 ? (
                  <img
                    src={`http://localhost:8000${
                      previewProperty.images.find(img => img.is_main)?.url || 
                      previewProperty.images[0]?.url
                    }`}
                    alt={previewProperty.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <CameraIcon className="w-16 h-16 mx-auto mb-3" />
                      <p className="text-sm font-medium">Sin imágenes</p>
                      <p className="text-xs text-gray-500 mt-1">Agrega imágenes a tu propiedad</p>
                    </div>
                  </div>
                )}
                
                {/* Badge de verificación */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full shadow-lg">
                  ✓ Verificado
                </div>
                
                {/* Contador de imágenes simulado */}
                <div className="absolute left-4 top-16 px-3 py-1 bg-black bg-opacity-60 text-white text-sm font-medium rounded-full shadow-lg">
                  1 / 3
                </div>

                {/* Indicadores de navegación */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-6 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white bg-opacity-50 rounded-full"></div>
                  <div className="w-2 h-2 bg-white bg-opacity-50 rounded-full"></div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {/* Título y ubicación */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {previewProperty.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPinIcon className="w-5 h-5" />
                    <span>
                      {[previewProperty.district, previewProperty.province, previewProperty.department]
                        .filter(Boolean)
                        .join(', ') || previewProperty.address || 'Ubicación no especificada'}
                    </span>
                  </div>
                </div>

                {/* Precio destacado */}
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Precio</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {previewProperty.currency || 'PEN'} {previewProperty.price?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {previewProperty.rental_term === 'daily' ? 'por día' :
                         previewProperty.rental_term === 'weekly' ? 'por semana' :
                         previewProperty.rental_term === 'monthly' ? 'por mes' :
                         previewProperty.rental_term === 'yearly' ? 'por año' :
                         previewProperty.rental_model === 'airbnb' ? 'por noche' : 'por mes'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid de características */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{previewProperty.bedrooms || 0}</p>
                    <p className="text-xs text-gray-600">Dormitorios</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{previewProperty.bathrooms || 0}</p>
                    <p className="text-xs text-gray-600">Baños</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{previewProperty.area_built || previewProperty.area_total || 0}</p>
                    <p className="text-xs text-gray-600">m² construidos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{previewProperty.parking_spots || 0}</p>
                    <p className="text-xs text-gray-600">Estacionamiento</p>
                  </div>
                </div>

                {/* Descripción simulada */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Descripción</h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {previewProperty.description || 'Esta es una descripción de ejemplo de cómo se vería la información de tu propiedad. Los inquilinos podrán ver todos los detalles importantes aquí.'}
                  </p>
                </div>

                {/* Características adicionales */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Características</h2>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {previewProperty.furnished && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Amoblado</span>
                      </div>
                    )}
                    {previewProperty.pet_friendly && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Acepta mascotas</span>
                      </div>
                    )}
                    {(previewProperty.rental_model === 'airbnb' || previewProperty.is_airbnb_available) && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Apto Airbnb</span>
                      </div>
                    )}
                    {previewProperty.utilities_included && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Servicios incluidos</span>
                      </div>
                    )}
                    {previewProperty.internet_included && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Internet incluido</span>
                      </div>
                    )}
                    {previewProperty.cleaning_included && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Limpieza incluida</span>
                      </div>
                    )}
                    
                    {/* Política de fumar */}
                    {previewProperty.smoking_allowed !== null && previewProperty.smoking_allowed !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${previewProperty.smoking_allowed ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <span className="text-gray-700">
                          {previewProperty.smoking_allowed ? 'Se permite fumar' : 'No se permite fumar'}
                        </span>
                      </div>
                    )}
                    
                    {previewProperty.deposit_required && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-700">
                          Depósito: {previewProperty.currency || 'PEN'} {previewProperty.deposit_amount?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de contacto como aparecería en la página de detalle */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              {hasContactMethods ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contactar al propietario</h4>
                  {contactName && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">{contactName}</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    {hasWhatsApp && (
                      <button
                        onClick={() => {
                          const message = contactSettings!.whatsapp!.message
                            .replace(/\{TITULO\}/g, previewProperty.title)
                            .replace(/\{DIRECCION\}/g, previewProperty.address || previewProperty.district || '')
                            .replace(/\{LINK\}/g, `${window.location.origin}/propiedad/${previewProperty.id}`);
                          const whatsappUrl = `https://wa.me/${whatsappNumber!.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="flex items-center gap-3 w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                      >
                        <DevicePhoneMobileIcon className="w-5 h-5 text-green-600" />
                        <div className="text-left flex-1">
                          <div className="font-medium text-green-900">WhatsApp</div>
                          <div className="text-sm text-green-600">
                            {whatsappNumber}
                            {previewProperty.contact_whatsapp_phone_e164 && (
                              <span className="ml-2 text-xs text-green-500">(personalizado)</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )}
                    
                    {hasEmail && (
                      <button
                        onClick={() => {
                          const subject = contactSettings!.email!.subject
                            .replace(/\{TITULO\}/g, previewProperty.title)
                            .replace(/\{DIRECCION\}/g, previewProperty.address || previewProperty.district || '');
                          const message = contactSettings!.email!.message
                            .replace(/\{TITULO\}/g, previewProperty.title)
                            .replace(/\{DIRECCION\}/g, previewProperty.address || previewProperty.district || '')
                            .replace(/\{LINK\}/g, `${window.location.origin}/propiedad/${previewProperty.id}`);
                          const emailUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                          window.location.href = emailUrl;
                        }}
                        className="flex items-center gap-3 w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                        <div className="text-left flex-1">
                          <div className="font-medium text-blue-900">Email</div>
                          <div className="text-sm text-blue-600">{emailAddress}</div>
                        </div>
                      </button>
                    )}

                    {hasPhone && (
                      <button
                        onClick={() => {
                          const phoneUrl = `tel:${phoneNumber}`;
                          window.location.href = phoneUrl;
                        }}
                        className="flex items-center gap-3 w-full p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                      >
                        <PhoneIcon className="w-5 h-5 text-purple-600" />
                        <div className="text-left flex-1">
                          <div className="font-medium text-purple-900">Teléfono</div>
                          <div className="text-sm text-purple-600">
                            {phoneNumber}
                            {previewProperty.contact_phone_e164 && (
                              <span className="ml-2 text-xs text-purple-500">(personalizado)</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Métodos de contacto activos</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {(previewProperty.contact_whatsapp_phone_e164 || previewProperty.contact_phone_e164 || previewProperty.contact_name) 
                        ? 'Esta propiedad usa contacto personalizado' 
                        : 'Esta propiedad usa tu configuración de contacto global'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-2 font-medium">No hay métodos de contacto configurados</p>
                  <p className="text-xs mb-4">Los inquilinos no podrán contactarte directamente desde tu propiedad</p>
                  <button
                    onClick={() => {
                      setPreviewProperty(null);
                      router.push('/dashboard/contacto');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Configurar ahora
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t px-6 py-4 bg-gray-50/50">
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewProperty(null)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cerrar Vista Previa
              </button>
              <button
                onClick={() => {
                  setPreviewProperty(null);
                  router.push('/dashboard/contacto');
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Configurar Contacto
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPropertyTypeText = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'apartment': return 'Departamento';
      case 'house': return 'Casa';
      case 'room': return 'Habitación';
      case 'studio': return 'Studio';
      case 'office': return 'Oficina';
      case 'land': return 'Terreno';
      case 'warehouse': return 'Almacén';
      case 'penthouse': return 'Penthouse';
      default: return type || 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeProperties = properties.filter(p => p.status === 'published').length;
  const totalProperties = properties.length;
  
  // Solo propiedades tipo Airbnb
  const airbnbProperties = properties.filter(p => p.rental_model === 'airbnb' || p.is_airbnb_available);
  const activeAirbnbProperties = airbnbProperties.filter(p => p.status === 'published');
  
  // Contadores de vistas y contactos totales
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalContacts = properties.reduce((sum, p) => sum + (p.leads_count || 0), 0);

  return (
    <>
      <Head>
        <title>Dashboard - RENTA fácil</title>
        <meta name="description" content="Gestiona tus propiedades en alquiler" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    {successMessageType === 'created' 
                      ? '¡Propiedad creada exitosamente!' 
                      : '¡Propiedad actualizada exitosamente!'}
                  </p>
                  <p className="text-sm text-green-700">
                    {successMessageType === 'created'
                      ? 'Tu propiedad ha sido publicada y ahora está visible en el catálogo.'
                      : 'Los cambios en tu propiedad han sido guardados exitosamente.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-600 hover:text-green-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Header del Dashboard */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus propiedades y configuraciones
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/dashboard/contacto')}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Configurar Contacto
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/create-listing')}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nueva Propiedad
                </Button>
              </div>
            </div>
          </div>

          {/* Navegación por Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'properties'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BuildingOfficeIcon className="w-4 h-4" />
                  Mis Propiedades
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <PresentationChartBarIcon className="w-4 h-4" />
                  Analíticas
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'verification'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  Verificación
                </button>
              </nav>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Búsqueda */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título o dirección..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="apartment">Departamento</option>
                  <option value="house">Casa</option>
                  <option value="room">Habitación</option>
                  <option value="studio">Studio</option>
                  <option value="office">Oficina</option>
                  <option value="land">Terreno</option>
                  <option value="warehouse">Almacén</option>
                  <option value="penthouse">Penthouse</option>
                </select>

                <select
                  value={filters.rentalType}
                  onChange={(e) => handleFilterChange('rentalType', e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Todas las modalidades</option>
                  <option value="traditional">Tradicional</option>
                  <option value="airbnb">Airbnb</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                  <option value="under_review">En revisión</option>
                </select>

                {/* Rango de precios */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Precio mín"
                    value={filters.priceMin}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Precio máx"
                    value={filters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Ordenamiento */}
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="createdAt">Fecha de creación</option>
                    <option value="title">Título</option>
                    <option value="price">Precio</option>
                    <option value="views">Vistas</option>
                    <option value="contacts">Contactos</option>
                    <option value="rating">Puntuación</option>
                  </select>
                  <button
                    onClick={() => handleSortChange(filters.sortBy)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {filters.sortOrder === 'desc' ? 
                      <ArrowDownIcon className="w-4 h-4 text-gray-500" /> : 
                      <ArrowUpIcon className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>

                {/* Limpiar filtros */}
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>{filteredProperties.length} de {properties.length} propiedades</span>
              {filters.search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Buscando: "{filters.search}"
                </span>
              )}
            </div>
          </div>

          {/* Contenido por Tabs */}
          {activeTab === 'overview' && (
            <>
              {/* Indicador de carga de suscripción */}
              {subscriptionLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-700">Cargando información de tu plan...</p>
                  </div>
                </div>
              )}

              {/* Error al cargar suscripción */}
              {subscriptionError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                      {subscriptionError}. Usando plan gratuito por defecto.
                    </p>
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Límite de propiedades activas según plan */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Propiedades Activas</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900">{activeProperties}</p>
                        {planLimits.maxActiveListings !== -1 && (
                          <p className="text-lg text-gray-500">/ {planLimits.maxActiveListings}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Plan {planLimits.name}</p>
                        {planLimits.maxActiveListings !== -1 && (
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                activeProperties >= planLimits.maxActiveListings 
                                  ? 'bg-red-500' 
                                  : activeProperties >= planLimits.maxActiveListings * 0.8 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((activeProperties / planLimits.maxActiveListings) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        )}
                        {planLimits.maxActiveListings === -1 && (
                          <p className="text-xs text-green-600 font-medium">Ilimitadas ✨</p>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <HomeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Propiedades tipo Airbnb */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Propiedades Airbnb</p>
                      <p className="text-3xl font-bold text-gray-900">{activeAirbnbProperties.length}</p>
                      <p className="text-xs text-gray-500">{airbnbProperties.length} total ({activeAirbnbProperties.length} activas)</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Total de vistas */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vistas Totales</p>
                      <div className="flex items-center gap-1">
                        <p className="text-3xl font-bold text-gray-900">
                          {totalViews.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {totalProperties > 0 
                          ? `En ${totalProperties} propiedad${totalProperties !== 1 ? 'es' : ''}`
                          : 'Sin propiedades'
                        }
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                {/* Total de contactos */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Contactos</p>
                      <p className="text-3xl font-bold text-gray-900">{totalContacts.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {totalProperties > 0
                          ? 'Total de consultas'
                          : 'Sin propiedades'
                        }
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerta de límite de plan */}
              {planLimits.maxActiveListings !== -1 && activeProperties >= planLimits.maxActiveListings * 0.8 && (
                <div className={`mb-8 rounded-xl border-2 p-6 ${
                  activeProperties >= planLimits.maxActiveListings
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      activeProperties >= planLimits.maxActiveListings
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      <InformationCircleIcon className={`w-6 h-6 ${
                        activeProperties >= planLimits.maxActiveListings
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${
                        activeProperties >= planLimits.maxActiveListings
                          ? 'text-red-900'
                          : 'text-yellow-900'
                      }`}>
                        {activeProperties >= planLimits.maxActiveListings
                          ? '¡Has alcanzado el límite de tu plan!'
                          : '¡Estás cerca del límite de tu plan!'
                        }
                      </h3>
                      <p className={`text-sm mb-3 ${
                        activeProperties >= planLimits.maxActiveListings
                          ? 'text-red-700'
                          : 'text-yellow-700'
                      }`}>
                        {activeProperties >= planLimits.maxActiveListings
                          ? `Tienes ${activeProperties} propiedades activas de ${planLimits.maxActiveListings} permitidas en el plan ${planLimits.name}. Para publicar más propiedades, desactiva algunas existentes o mejora tu plan.`
                          : `Tienes ${activeProperties} de ${planLimits.maxActiveListings} propiedades activas en el plan ${planLimits.name}. Considera mejorar tu plan para publicar más propiedades.`
                        }
                      </p>
                      <button 
                        onClick={() => router.push('/dashboard/planes')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          activeProperties >= planLimits.maxActiveListings
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        Mejorar Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen Rápido de Propiedades */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Resumen de Propiedades</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{properties.filter(p => p.status === 'published').length}</p>
                      <p className="text-sm text-gray-600">Publicadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{properties.filter(p => p.status === 'draft').length}</p>
                      <p className="text-sm text-gray-600">Borradores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{properties.filter(p => p.status === 'under_review').length}</p>
                      <p className="text-sm text-gray-600">En revisión</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{properties.filter(p => p.status === 'archived').length}</p>
                      <p className="text-sm text-gray-600">Archivadas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Plan Actual */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Plan {planLimits.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Tu plan actual y sus beneficios
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                    {planLimits.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Límites del Plan</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Propiedades activas:</span>
                        <span className="font-semibold text-gray-900">
                          {planLimits.maxActiveListings === -1 
                            ? 'Ilimitadas' 
                            : `${activeProperties} / ${planLimits.maxActiveListings}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Propiedades totales:</span>
                        <span className="font-semibold text-gray-900">{totalProperties}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tipo Airbnb:</span>
                        <span className="font-semibold text-gray-900">{airbnbProperties.length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Características Incluidas</h3>
                    <ul className="space-y-2">
                      {planLimits.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {planLimits.name.toLowerCase() !== 'premium' && planLimits.maxActiveListings !== -1 && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">¿Necesitas más propiedades?</p>
                        <p className="text-sm text-gray-600 mt-1">Mejora tu plan y obtén más beneficios</p>
                      </div>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Ver Planes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'properties' && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Mis Propiedades</h2>
              </div>
              
              {properties.length === 0 ? (
                <div className="p-12 text-center">
                  <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No tienes propiedades</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera propiedad.</p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        setEditingProperty(null);
                        setShowPropertyModal(true);
                      }}
                      variant="primary"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Nueva Propiedad
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-6">
                  {/* Leyenda de estados */}
                  <div className="mt-4 mb-4 flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">Estado de publicación:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Activa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Inactiva</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto -mx-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propiedad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo & Modalidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estadísticas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FunnelIcon className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron propiedades</h3>
                            <p className="text-gray-500 mb-4">
                              {filters.search || filters.type || filters.rentalType || filters.status || filters.priceMin || filters.priceMax
                                ? 'Intenta ajustar los filtros para ver más resultados.'
                                : 'Aún no tienes propiedades. ¡Crea tu primera propiedad!'}
                            </p>
                            {!(filters.search || filters.type || filters.rentalType || filters.status || filters.priceMin || filters.priceMax) && (
                              <Button
                                onClick={() => setShowPropertyModal(true)}
                                variant="primary"
                                className="flex items-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Nueva Propiedad
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {property.images && property.images.length > 0 ? (
                                <img
                                  src={`http://localhost:8000${
                                    property.images.find(img => img.is_main)?.url || 
                                    property.images[0]?.url
                                  }`}
                                  alt={property.title}
                                  className="h-12 w-12 rounded-lg object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center ${
                                property.images && property.images.length > 0 ? 'hidden' : ''
                              }`}>
                                <CameraIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4 max-w-xs">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {property.district || property.province || property.address || 'Ubicación no especificada'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
                              {getPropertyTypeText(property.property_type)}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                property.operation === 'rent' ? 'bg-blue-100 text-blue-800' :
                                property.operation === 'sale' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {property.operation === 'rent' ? 'Alquiler' :
                                 property.operation === 'sale' ? 'Venta' :
                                 'Temp'}
                              </span>
                              {(property.rental_model === 'airbnb' || property.is_airbnb_available) && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Airbnb
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {property.currency || 'PEN'} {property.price?.toLocaleString()}
                          </div>
                          {property.rental_term && (
                            <div className="text-xs text-gray-500">
                              /{property.rental_term === 'daily' ? 'día' :
                                property.rental_term === 'weekly' ? 'semana' :
                                property.rental_term === 'monthly' ? 'mes' :
                                property.rental_term === 'yearly' ? 'año' : property.rental_term}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                              {getStatusText(property.status)}
                            </span>
                            {property.verification_status && property.verification_status !== 'unverified' && (
                              <div className="text-xs text-gray-500">
                                {property.verification_status === 'verified' ? '✓ Verificado' :
                                 property.verification_status === 'pending' ? '⏳ Pendiente' :
                                 property.verification_status === 'rejected' ? '✗ Rechazado' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-3 w-3" />
                            {property.views_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <ChatBubbleLeftEllipsisIcon className="h-3 w-3" />
                            {property.leads_count || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(property.id)}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              title={property.status === 'published' 
                                ? 'Activa y visible - Click para archivar' 
                                : property.status === 'draft'
                                  ? 'Borrador - Click para publicar'
                                  : 'Archivada - Click para publicar'}
                            >
                              <div className={`w-3 h-3 rounded-full ${
                                property.status === 'published' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            </button>
                            <button
                              onClick={() => setPreviewProperty(property)}
                              className="p-1 rounded-full hover:bg-gray-100 text-indigo-600"
                              title="Vista Previa"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditProperty(property)}
                              className="p-1 rounded-full hover:bg-gray-100 text-blue-600"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProperty(property)}
                              className="p-1 rounded-full hover:bg-gray-100 text-purple-600"
                              title="Duplicar"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="p-1 rounded-full hover:bg-gray-100 text-red-600"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Analíticas</h2>
              </div>
              <div className="p-12 text-center">
                <PresentationChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Próximamente</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aquí podrás ver gráficos y métricas detalladas de tus propiedades.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6">
              {/* Aquí se renderizará el contenido de verificación */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Verificación de Propiedades</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Verifica la legitimidad de tus propiedades con documentos legales
                  </p>
                </div>
                <div className="p-12 text-center">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Sistema de Verificación</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Para acceder al sistema completo de verificación, visita la página dedicada
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push('/dashboard/verificacion')}
                      variant="primary"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      Ir a Verificación
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Propiedad (Crear/Editar) */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h3>
                <button
                  onClick={() => {
                    setShowPropertyModal(false);
                    setEditingProperty(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="text-center py-12">
                <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Formulario en desarrollo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  El formulario completo de propiedades estará disponible próximamente.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      setShowPropertyModal(false);
                      setEditingProperty(null);
                    }}
                    variant="primary"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comentarios */}
      {showCommentsModal && selectedPropertyComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Comentarios y Reseñas
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedPropertyComments.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarSolidIcon
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (selectedPropertyComments.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedPropertyComments.rating?.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({selectedPropertyComments.totalReviews} reseñas)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCommentsModal(false);
                    setSelectedPropertyComments(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedPropertyComments.comments?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {comment.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {comment.author}
                          </h4>
                          <p className="text-xs text-gray-500">{comment.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarSolidIcon
                            key={star}
                            className={`w-3 h-3 ${
                              star <= comment.rating
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowCommentsModal(false);
                    setSelectedPropertyComments(null);
                  }}
                  variant="primary"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Límite de Propiedades Alcanzado */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Límite de Propiedades Alcanzado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Has alcanzado el límite de propiedades activas de tu plan actual.
                  </p>
                </div>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Plan Actual:</span>
                  <span className="text-sm font-semibold text-blue-600">{planLimits.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Propiedades Activas:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {properties.filter(p => p.status === 'published').length} / {planLimits.maxActiveListings}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600">
                  Para publicar más propiedades, puedes:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Despublicar alguna de tus propiedades actuales</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Actualizar a un plan superior para más propiedades activas</span>
                  </li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowLimitModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Entendido
                </Button>
                <Button
                  onClick={() => {
                    setShowLimitModal(false);
                    router.push('/dashboard/planes');
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  Ver Planes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {renderPreviewModal()}
    </>
  );
};

export default DashboardPage;
