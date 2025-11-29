import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../../lib/hooks/useAuth';
import { useIsMobile } from '../../lib/hooks/useIsMobile';
import { useGeocoding } from '../../lib/hooks/useGeocoding';
import { createListing, getListing, updateListing } from '../../lib/api/listings';
import { getAmenities, updateListingAmenities, getListingAmenities, type Amenity } from '../../lib/api/amenities';
import { Header } from '../../components/Header';
import Button from '../../components/ui/Button';
import AutocompleteInput from '../../components/AutocompleteInput';
import ImageUploader from '../../components/ImageUploader';
import { MobileListingPage } from '../../components/dashboard/mobile/listing';
import {
  getDepartments,
  getProvinces,
  getDistricts,
  getDistrictCoordinates,
} from '../../lib/data/peru-locations';
import {
  ArrowLeftIcon,
  HomeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

// Importar MapPicker dinámicamente para evitar SSR issues con Leaflet
const MapPicker = dynamic(() => import('../../components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  ),
});

// Tipos de propiedad
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Habitación' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'warehouse', label: 'Almacén' },
  { value: 'garage', label: 'Cochera' },
  { value: 'other', label: 'Otro' },
];

// Tipo de operación
const OPERATION_TYPES = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'sale', label: 'Venta' },
  { value: 'temp_rent', label: 'Alquiler Temporal' },
];

// Periodo de alquiler
const RENTAL_TERMS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

// Modalidad de renta
const RENTAL_MODES = [
  { value: 'full_property', label: 'Propiedad Completa' },
  { value: 'private_room', label: 'Habitación Privada' },
  { value: 'shared_room', label: 'Habitación Compartida' },
];

// Políticas de cancelación
const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible - Reembolso hasta 24h antes' },
  { value: 'moderate', label: 'Moderada - Reembolso hasta 5 días antes' },
  { value: 'strict', label: 'Estricta - Reembolso hasta 30 días antes' },
];

// Amenidades mock (esto debería venir del backend)
const AMENITIES = [
  { id: 1, name: 'WiFi', icon: '📶' },
  { id: 2, name: 'Piscina', icon: '🏊' },
  { id: 3, name: 'Gimnasio', icon: '💪' },
  { id: 4, name: 'Ascensor', icon: '🛗' },
  { id: 5, name: 'Estacionamiento', icon: '🚗' },
  { id: 6, name: 'Seguridad 24/7', icon: '🔒' },
  { id: 7, name: 'Aire Acondicionado', icon: '❄️' },
  { id: 8, name: 'Calefacción', icon: '🔥' },
  { id: 9, name: 'Lavandería', icon: '🧺' },
  { id: 10, name: 'Jardín', icon: '🌳' },
  { id: 11, name: 'Terraza/Balcón', icon: '🏡' },
  { id: 12, name: 'Cocina Equipada', icon: '🍳' },
  { id: 13, name: 'TV Cable', icon: '📺' },
  { id: 14, name: 'Amoblado', icon: '🛋️' },
  { id: 15, name: 'Sala de Juegos', icon: '🎮' },
  { id: 16, name: 'BBQ/Parrilla', icon: '🍖' },
  { id: 17, name: 'Vista al Mar', icon: '🌊' },
  { id: 18, name: 'Pet-Friendly', icon: '🐕' },
  { id: 19, name: 'Acceso Discapacitados', icon: '♿' },
  { id: 20, name: 'Zona de Coworking', icon: '💼' },
];

interface FormData {
  title: string;
  description: string;
  operation: string;
  property_type: string;
  // advertiser_type se determina automáticamente según el rol del usuario
  
  // Ubicación
  department: string;
  province: string;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  
  // Precio
  price: string;
  currency: string;
  deposit_required: boolean;
  deposit_amount: string;
  
  // Detalles
  area_built: string;
  area_total: string;
  bedrooms: string;
  bathrooms: string;
  parking_spots: string;
  max_guests: string;
  floors: string;
  floor_number: string;
  
  // Alquiler
  rental_term: string;
  rental_model: 'traditional' | 'airbnb';
  rental_mode: string;
  furnished: boolean;
  
  // Políticas y reglas
  pet_friendly: 'yes' | 'no' | 'none';
  smoking_allowed: 'yes' | 'no' | 'none';
  house_rules: string;
  cancellation_policy: string;
  
  // Estadía (para Airbnb)
  max_guests: string;
  minimum_stay_nights: string;
  maximum_stay_nights: string;
  check_in_time: string;
  check_out_time: string;
  
  // Servicios incluidos
  utilities_included: boolean;
  internet_included: boolean;
  cleaning_included: boolean;
  cleaning_fee: string;
  
  // Disponibilidad
  available_from: string;
  
  // Amenidades seleccionadas
  selectedAmenities: number[];
  
  // Imágenes
  images: Array<{ file?: File; url: string; preview: string; isMain: boolean }>;
  
  // Información de contacto
  contact_name: string;
  contact_phone_e164: string;
  contact_whatsapp_phone_e164: string;
}

const CreateListingPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { geocodeAddress, reverseGeocode, loading: geocoding } = useGeocoding();
  const [activeSection, setActiveSection] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [loadingListing, setLoadingListing] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    operation: 'rent',
    property_type: 'apartment',
    
    department: '',
    province: '',
    district: '',
    address: '',
    latitude: null,
    longitude: null,
    
    price: '',
    currency: 'PEN',
    deposit_required: false,
    deposit_amount: '',
    
    area_built: '',
    area_total: '',
    bedrooms: '',
    bathrooms: '',
    parking_spots: '',
    max_guests: '',
    floors: '',
    floor_number: '',
    
    rental_term: 'monthly',
    rental_model: 'traditional',
    rental_mode: 'full_property',
    furnished: false,
    
    pet_friendly: 'none',
    smoking_allowed: 'none',
    house_rules: '',
    cancellation_policy: 'flexible',
    
    max_guests: '2',
    minimum_stay_nights: '1',
    maximum_stay_nights: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    
    utilities_included: false,
    internet_included: false,
    cleaning_included: false,
    cleaning_fee: '',
    
    available_from: '',
    selectedAmenities: [],
    images: [],
    contact_name: '',
    contact_phone_e164: '',
    contact_whatsapp_phone_e164: '',
  });

  // Redirigir si no está autenticado
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Cargar amenidades disponibles
  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setLoadingAmenities(true);
        const amenities = await getAmenities();
        setAvailableAmenities(amenities);
      } catch (error) {
        console.error('Error loading amenities:', error);
        // Si falla, usar las amenidades mock
        const mockAmenities: Amenity[] = AMENITIES.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon
        }));
        setAvailableAmenities(mockAmenities);
      } finally {
        setLoadingAmenities(false);
      }
    };
    
    loadAmenities();
  }, []);

  // Cargar propiedad si estamos en modo edición
  useEffect(() => {
    const loadListing = async () => {
      const editId = router.query.edit as string;
      const tabParam = router.query.tab as string;
      
      if (editId && user) {
        setIsEditMode(true);
        setEditingListingId(editId);
        setLoadingListing(true);
        
        // Si hay un tab específico en la URL, navegar a ese tab
        if (tabParam && sections.some(s => s.id === tabParam)) {
          setActiveSection(tabParam);
        }
        
        try {
          const listing = await getListing(editId);
          
          // Convertir los datos de la propiedad al formato del formulario
          const convertYesNoNone = (value: boolean | null | undefined): string => {
            if (value === true) return 'yes';
            if (value === false) return 'no';
            return 'none';
          };
          
          setFormData({
            title: listing.title || '',
            description: listing.description || '',
            operation: listing.operation || 'rent',
            property_type: listing.property_type || 'apartment',
            
            department: listing.department || '',
            province: listing.province || '',
            district: listing.district || '',
            address: listing.address || '',
            latitude: listing.latitude ? Number(listing.latitude) : null,
            longitude: listing.longitude ? Number(listing.longitude) : null,
            
            price: listing.price?.toString() || '',
            currency: listing.currency || 'PEN',
            deposit_required: listing.deposit_required || false,
            deposit_amount: listing.deposit_amount?.toString() || '',
            
            area_built: listing.area_built?.toString() || '',
            area_total: listing.area_total?.toString() || '',
            bedrooms: listing.bedrooms?.toString() || '',
            bathrooms: listing.bathrooms?.toString() || '',
            parking_spots: listing.parking_spots?.toString() || '',
            max_guests: listing.max_guests?.toString() || '',
            floors: 0, // No está en Listing
            floor_number: listing.floor_number?.toString() || '',
            
            rental_term: listing.rental_term || 'monthly',
            rental_model: listing.rental_model || 'traditional',
            rental_mode: listing.rental_mode || 'full_property',
            furnished: listing.furnished || false,
            
            pet_friendly: convertYesNoNone(listing.pet_friendly),
            smoking_allowed: convertYesNoNone(listing.smoking_allowed),
            house_rules: listing.house_rules || '',
            cancellation_policy: listing.cancellation_policy || 'flexible',
            
            max_guests: listing.max_guests?.toString() || '2',
            minimum_stay_nights: listing.minimum_stay_nights?.toString() || '1',
            maximum_stay_nights: listing.maximum_stay_nights?.toString() || '',
            check_in_time: listing.check_in_time || '14:00',
            check_out_time: listing.check_out_time || '12:00',
            
            utilities_included: listing.utilities_included || false,
            internet_included: listing.internet_included || false,
            cleaning_included: listing.cleaning_included || false,
            cleaning_fee: listing.cleaning_fee?.toString() || '',
            
            available_from: listing.available_from || '',
            selectedAmenities: listing.amenities?.map(a => a.id) || [],
            images: listing.images || [], // Cargar imágenes del listing
            contact_name: listing.contact_name || '',
            contact_phone_e164: listing.contact_phone_e164 || '',
            contact_whatsapp_phone_e164: listing.contact_whatsapp_phone_e164 || '',
          });
          
        } catch (error) {
          console.error('Error loading listing:', error);
          setError('Error al cargar la propiedad');
        } finally {
          setLoadingListing(false);
        }
      }
    };
    
    if (router.isReady) {
      loadListing();
    }
  }, [router.isReady, router.query.edit, user]);

  // Obtener coordenadas automáticamente cuando se completa la dirección
  useEffect(() => {
    const getCoordinates = async () => {
      // Solo geocodificar si tenemos al menos distrito, provincia y departamento
      if (formData.district && formData.province && formData.department) {
        setGeocodingStatus('🔍 Obteniendo coordenadas...');
        
        // Si hay dirección específica, usarla; sino usar el distrito
        const searchAddress = formData.address?.trim() || formData.district;
        
        const coordinates = await geocodeAddress(
          searchAddress,
          formData.district,
          formData.province,
          formData.department
        );

        if (coordinates) {
          setFormData(prev => ({
            ...prev,
            latitude: Number(coordinates.latitude),
            longitude: Number(coordinates.longitude),
          }));
          
          const accuracyMsg = formData.address?.trim() 
            ? '✅ Ubicación exacta encontrada' 
            : '✅ Ubicación del distrito encontrada';
          
          setGeocodingStatus(accuracyMsg);
          
          // Limpiar mensaje después de 3 segundos
          setTimeout(() => setGeocodingStatus(''), 3000);
        } else {
          setGeocodingStatus('⚠️ No se pudo obtener ubicación exacta, ajusta en el mapa');
          setTimeout(() => setGeocodingStatus(''), 5000);
        }
      }
    };

    // Debounce: esperar 1 segundo después de que el usuario deje de escribir
    const timeoutId = setTimeout(() => {
      if (formData.district && formData.province && formData.department) {
        getCoordinates();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.address, formData.district, formData.province, formData.department]);
  // Nota: geocodeAddress removido de las dependencias para evitar loops infinitos

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Convertir yes/no/none a boolean o null
      const convertYesNoNone = (value: string): boolean | null => {
        if (value === 'yes') return true;
        if (value === 'no') return false;
        return null;
      };

      // Preparar datos del formulario
      const listingData = {
        // Básico
        title: formData.title,
        description: formData.description,
        operation: formData.operation,
        property_type: formData.property_type,
        
        // Precio
        price: parseFloat(formData.price),
        currency: formData.currency,
        deposit_required: formData.deposit_required,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        
        // Ubicación
        address: formData.address,
        department: formData.department,
        province: formData.province,
        district: formData.district,
        latitude: formData.latitude,
        longitude: formData.longitude,
        
        // Detalles
        area_built: formData.area_built ? parseFloat(formData.area_built) : null,
        area_total: formData.area_total ? parseFloat(formData.area_total) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        parking_spots: formData.parking_spots ? parseInt(formData.parking_spots) : null,
        max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        
        // Alquiler
        rental_term: formData.rental_term,
        rental_model: formData.rental_model,
        rental_mode: formData.rental_mode,
        furnished: formData.furnished,
        
        // Políticas
        pet_friendly: convertYesNoNone(formData.pet_friendly),
        smoking_allowed: convertYesNoNone(formData.smoking_allowed),
        house_rules: formData.house_rules,
        cancellation_policy: formData.cancellation_policy,
        
        // Airbnb específico
        max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
        minimum_stay_nights: formData.minimum_stay_nights ? parseInt(formData.minimum_stay_nights) : 1,
        maximum_stay_nights: formData.maximum_stay_nights ? parseInt(formData.maximum_stay_nights) : null,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        
        // Servicios incluidos
        utilities_included: formData.utilities_included,
        internet_included: formData.internet_included,
        cleaning_included: formData.cleaning_included,
        cleaning_fee: formData.cleaning_fee ? parseFloat(formData.cleaning_fee) : null,
        
        // Disponibilidad
        available_from: formData.available_from,
        
        // Amenidades
        amenities: formData.selectedAmenities,
        
        // Información de contacto
        contact_name: formData.contact_name || null,
        contact_phone_e164: formData.contact_phone_e164 || null,
        contact_whatsapp_phone_e164: formData.contact_whatsapp_phone_e164 || null,
        contact_whatsapp_link: formData.contact_whatsapp_phone_e164 
          ? `https://wa.me/${formData.contact_whatsapp_phone_e164.replace(/[^0-9]/g, '')}`
          : null,
      };

      // Crear o actualizar listing según el modo
      let listingId = editingListingId;
      
      if (isEditMode && editingListingId) {
        await updateListing(editingListingId, listingData);
        // Actualizar amenidades
        await updateListingAmenities(editingListingId, formData.selectedAmenities);
      } else {
        const createdListing = await createListing(listingData);
        listingId = createdListing.id;
        
        // Guardar amenidades para la nueva propiedad
        if (listingId && formData.selectedAmenities.length > 0) {
          await updateListingAmenities(listingId, formData.selectedAmenities);
        }
        
        // Si es creación nueva, cambiar a modo edición automáticamente
        // para que el usuario pueda subir imágenes
        if (!isEditMode && listingId) {
          setIsEditMode(true);
          setEditingListingId(listingId);
          // Actualizar URL sin recargar la página
          window.history.replaceState(null, '', `/dashboard/create-listing?edit=${listingId}`);
          setError(null);
          setSubmitting(false);
          // Mostrar mensaje de éxito y permitir continuar editando
          alert('✅ Propiedad creada exitosamente. Ahora puedes subir imágenes.');
          return; // No redirigir aún, dejar que agregue imágenes
        }
      }
      
      // Redirigir al dashboard con mensaje de éxito
      if (isEditMode) {
        // En modo edición, redirigir a la pestaña "Mis Propiedades"
        router.push(`/dashboard?tab=listings&success=listing_updated`);
      } else {
        // En modo creación, redirigir al resumen
        router.push(`/dashboard?success=listing_created`);
      }
    } catch (err: any) {
      console.error('Error saving listing:', err);
      const errorMessage = isEditMode 
        ? 'Error al actualizar la propiedad. Por favor intenta de nuevo.'
        : 'Error al crear la propiedad. Por favor intenta de nuevo.';
      setError(err.response?.data?.detail || errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { id: 'basic', title: 'Información Básica', icon: HomeIcon },
    { id: 'location', title: 'Ubicación', icon: MapPinIcon },
    { id: 'details', title: 'Detalles y Precio', icon: CurrencyDollarIcon },
    { id: 'amenities', title: 'Amenidades', icon: BuildingOfficeIcon },
    { id: 'policies', title: 'Políticas', icon: DocumentTextIcon },
    { id: 'contact', title: 'Información de Contacto', icon: PhoneIcon },
    { id: 'images', title: 'Imágenes', icon: PhotoIcon },
  ];

  // Funciones de navegación entre secciones
  const goToNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se carga la propiedad en modo edición
  if (loadingListing) {
    return (
      <>
        <Head>
          <title>Cargando - EasyRent</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando propiedad...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isMobile = useIsMobile(768);

  // Mobile view
  if (isMobile) {
    return (
      <>
        <Head>
          <title>{isEditMode ? 'Editar Propiedad' : 'Crear Propiedad'} - EasyRent</title>
        </Head>
        <Header />
        <MobileListingPage />
      </>
    );
  }

  // Desktop view
  return (
    <>
      <Head>
        <title>{isEditMode ? 'Editar Propiedad' : 'Crear Propiedad'} - EasyRent</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver al Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode ? 'Actualiza la información de tu propiedad' : 'Completa la información de tu propiedad'}
            </p>
          </div>

          {/* Layout con menú lateral */}
          <div className="flex gap-8 max-w-7xl mx-auto">
            {/* Menú lateral */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Secciones</h2>
                </div>
                <nav className="p-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 max-w-4xl">
              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                {activeSection === 'basic' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <HomeIcon className="w-6 h-6 text-blue-600" />
                      Información Básica
                    </h2>
                    <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la Propiedad *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Departamento moderno en San Isidro"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe tu propiedad, servicios incluidos, características especiales..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Operación *
                    </label>
                    <select
                      name="operation"
                      value={formData.operation}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {OPERATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Propiedad *
                    </label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROPERTY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mensaje informativo sobre tipo de anunciante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Tipo de anunciante</p>
                      <p>
                        {user?.role === 'agent' 
                          ? user?.agency_name 
                            ? `Publicarás como agente de ${user.agency_name}`
                            : 'Publicarás como corredor independiente'
                          : 'Publicarás como propietario'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {(formData.operation === 'rent' || formData.operation === 'temp_rent') && (
                  <>
                    {/* Selector de Modelo de Alquiler */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ¿Qué tipo de alquiler es? *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rental_model: 'traditional' }))}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.rental_model === 'traditional'
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-center">
                            <HomeIcon className={`w-8 h-8 mx-auto mb-2 ${
                              formData.rental_model === 'traditional' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <h3 className="font-semibold text-gray-900">Alquiler Tradicional</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Contratos de largo plazo, mensual o anual
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // Al seleccionar Airbnb, aplicar configuración recomendada
                            setFormData(prev => ({ 
                              ...prev, 
                              rental_model: 'airbnb',
                              rental_term: 'daily', // Airbnb es diario
                              furnished: true, // Debe estar amoblado
                              rental_mode: 'full_property', // Por defecto propiedad completa
                            }));
                          }}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.rental_model === 'airbnb'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-center">
                            <BuildingOfficeIcon className={`w-8 h-8 mx-auto mb-2 ${
                              formData.rental_model === 'airbnb' ? 'text-purple-600' : 'text-gray-600'
                            }`} />
                            <h3 className="font-semibold text-gray-900">Estilo Airbnb</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Alquileres de corta estadía, diario o semanal
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Requisitos para Airbnb */}
                    {formData.rental_model === 'airbnb' && (
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <InformationCircleIcon className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-purple-900 mb-2">
                              📋 Requisitos para Alquiler tipo Airbnb
                            </h3>
                            <ul className="space-y-2 text-sm text-purple-800">
                              <li className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold mt-0.5">✓</span>
                                <span><strong>Amoblado obligatorio:</strong> La propiedad debe estar completamente equipada y lista para habitar</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold mt-0.5">✓</span>
                                <span><strong>Periodo diario o semanal:</strong> Ideal para estadías cortas de turistas o viajeros</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold mt-0.5">✓</span>
                                <span><strong>Amenidades importantes:</strong> WiFi, limpieza, ropa de cama, toallas, cocina equipada</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold mt-0.5">✓</span>
                                <span><strong>Horarios definidos:</strong> Debes especificar check-in y check-out</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold mt-0.5">✓</span>
                                <span><strong>Políticas claras:</strong> Reglas de la casa, cancelación, mascotas, fumar</span>
                              </li>
                            </ul>
                            <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-700">
                                <strong>💡 Tip:</strong> Los alquileres tipo Airbnb funcionan mejor con fotos profesionales, 
                                descripciones detalladas y respuesta rápida a consultas.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Periodo de Alquiler *
                        </label>
                        <select
                          name="rental_term"
                          value={formData.rental_term}
                          onChange={handleInputChange}
                          disabled={formData.rental_model === 'airbnb'}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formData.rental_model === 'airbnb' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          {formData.rental_model === 'airbnb' ? (
                            <>
                              <option value="daily">Diario (Requerido para Airbnb)</option>
                              <option value="weekly">Semanal</option>
                            </>
                          ) : (
                            RENTAL_TERMS.map(term => (
                              <option key={term.value} value={term.value}>{term.label}</option>
                            ))
                          )}
                        </select>
                        {formData.rental_model === 'airbnb' && (
                          <p className="text-xs text-purple-600 mt-1">
                            ⚠️ Para Airbnb se recomienda periodo diario
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modalidad *
                        </label>
                        <select
                          name="rental_mode"
                          value={formData.rental_mode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {RENTAL_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                          ))}
                        </select>
                        {formData.rental_model === 'airbnb' && (
                          <p className="text-xs text-purple-600 mt-1">
                            💡 Propiedad completa es más popular en Airbnb
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="furnished"
                          checked={formData.furnished}
                          onChange={handleInputChange}
                          disabled={formData.rental_model === 'airbnb'}
                          className={`w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                            formData.rental_model === 'airbnb' ? 'cursor-not-allowed' : ''
                          }`}
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          Amoblado / Equipado
                          {formData.rental_model === 'airbnb' && (
                            <span className="ml-2 text-purple-600 font-semibold">(Obligatorio para Airbnb)</span>
                          )}
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* Botones de navegación/acción */}
              {!isEditMode ? (
                /* Modo creación: Navegación paso a paso */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    disabled={isFirstSection}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isFirstSection
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar →
                  </button>
                </div>
              ) : (
                /* Modo edición: Botón de actualizar */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

            {/* Ubicación */}
            {activeSection === 'location' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPinIcon className="w-6 h-6 text-blue-600" />
                  Ubicación
                </h2>
                <div className="space-y-6">
                
                {/* Estado de Geocodificación */}
                {geocodingStatus && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    geocodingStatus.includes('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : geocodingStatus.includes('⚠️')
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {geocoding && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    )}
                    <span>{geocodingStatus}</span>
                  </div>
                )}

                {/* Info sobre coordenadas */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">📍 Ubicación Interactiva</p>
                      <p>
                        Selecciona la ubicación en el mapa o completa la dirección. Obtendremos 
                        automáticamente las coordenadas GPS. La dirección exacta solo se mostrará 
                        a usuarios interesados.
                      </p>
                      {formData.latitude && formData.longitude && (
                        <p className="mt-2 text-xs text-blue-700 font-mono">
                          ✓ Coordenadas: {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Departamento - Select simple */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Resetear provincia y distrito al cambiar departamento
                        setFormData(prev => ({
                          ...prev,
                          department: e.target.value,
                          province: '',
                          district: '',
                        }));
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      {getDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Provincia - Autocompletado */}
                  <AutocompleteInput
                    label="Provincia"
                    value={formData.province}
                    options={
                      formData.department
                        ? getProvinces(formData.department).map(p => ({
                            value: p.name,
                            label: p.name,
                            coordinates: p.coordinates,
                          }))
                        : []
                    }
                    onChange={(value, coordinates) => {
                      setFormData(prev => ({
                        ...prev,
                        province: value,
                        district: '', // Resetear distrito
                        ...(coordinates && { latitude: Number(coordinates.latitude), longitude: Number(coordinates.longitude) }),
                      }));
                    }}
                    placeholder="Escribe o selecciona..."
                    required
                    disabled={!formData.department}
                  />

                  {/* Distrito - Autocompletado */}
                  <AutocompleteInput
                    label="Distrito"
                    value={formData.district}
                    options={
                      formData.department && formData.province
                        ? getDistricts(formData.department, formData.province).map(d => ({
                            value: d.name,
                            label: d.name,
                            coordinates: d.coordinates,
                          }))
                        : []
                    }
                    onChange={(value, coordinates) => {
                      setFormData(prev => ({
                        ...prev,
                        district: value,
                        ...(coordinates && { latitude: Number(coordinates.latitude), longitude: Number(coordinates.longitude) }),
                      }));
                    }}
                    placeholder="Escribe o selecciona..."
                    required
                    disabled={!formData.province}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Av. Principal 123, Piso 5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.district}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.district 
                      ? '💡 La dirección ayuda a ubicar tu propiedad con más precisión en el mapa'
                      : '⚠️ Primero selecciona el distrito'}
                  </p>
                  {formData.address && geocoding && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span className="animate-spin">🔄</span>
                      Actualizando ubicación en el mapa...
                    </p>
                  )}
                </div>

                {/* Mapa Interactivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Ubicación en el Mapa
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    💡 Haz clic o arrastra el pin para ajustar la ubicación. La dirección se actualizará automáticamente.
                  </p>
                  <MapPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={async (lat, lng) => {
                      // Actualizar coordenadas inmediatamente
                      setFormData(prev => ({
                        ...prev,
                        latitude: Number(lat),
                        longitude: Number(lng),
                      }));
                      
                      // Obtener dirección desde las coordenadas
                      setGeocodingStatus('🔍 Detectando dirección desde el mapa...');
                      const detectedAddress = await reverseGeocode(lat, lng);
                      
                      if (detectedAddress) {
                        setFormData(prev => ({
                          ...prev,
                          address: detectedAddress,
                        }));
                        setGeocodingStatus('✅ Dirección detectada desde el mapa');
                        setTimeout(() => setGeocodingStatus(''), 3000);
                      } else {
                        setGeocodingStatus('⚠️ No se pudo detectar la dirección. Complétala manualmente.');
                        setTimeout(() => setGeocodingStatus(''), 5000);
                      }
                    }}
                    height="400px"
                  />
                </div>
              </div>

              {/* Botones de navegación/acción */}
              {!isEditMode ? (
                /* Modo creación: Navegación paso a paso */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar →
                  </button>
                </div>
              ) : (
                /* Modo edición: Botón de actualizar */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

            {/* Detalles y Precio */}
            {activeSection === 'details' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                  Detalles y Precio
                </h2>
                <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio {formData.operation === 'rent' || formData.operation === 'temp_rent' ? (formData.rental_term === 'daily' ? 'por Noche' : 'Mensual') : ''} *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        S/
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="1500.00"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disponible desde
                    </label>
                    <input
                      type="date"
                      name="available_from"
                      value={formData.available_from}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Depósito */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="deposit_required"
                        checked={formData.deposit_required}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        Requiere depósito de garantía
                      </span>
                    </label>
                  </div>

                  {formData.deposit_required && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto del Depósito *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          S/
                        </span>
                        <input
                          type="number"
                          name="deposit_amount"
                          value={formData.deposit_amount}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder="1500.00"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Área Construida (m²)
                    </label>
                    <input
                      type="number"
                      name="area_built"
                      value={formData.area_built}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="75.50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Área Total (m²)
                    </label>
                    <input
                      type="number"
                      name="area_total"
                      value={formData.area_total}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="85.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dormitorios
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Baños
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estacionamientos
                    </label>
                    <input
                      type="number"
                      name="parking_spots"
                      value={formData.parking_spots}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {formData.rental_model === 'airbnb' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máx. Huéspedes
                      </label>
                      <input
                        type="number"
                        name="max_guests"
                        value={formData.max_guests}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Campos específicos para Airbnb */}
                {formData.rental_model === 'airbnb' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                      <BuildingOfficeIcon className="w-5 h-5" />
                      Configuración para Alquiler Tipo Airbnb
                    </h3>

                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>⚠️ Importante:</strong> Para alquileres tipo Airbnb debes:
                      </p>
                      <ul className="text-xs text-purple-700 space-y-1 ml-4">
                        <li>• Definir horarios claros de entrada y salida</li>
                        <li>• Establecer una estancia mínima (recomendado: 2-3 noches)</li>
                        <li>• Considerar una tarifa de limpieza si no está incluida</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacidad Máxima (huéspedes) *
                        </label>
                        <input
                          type="number"
                          name="max_guests"
                          value={formData.max_guests}
                          onChange={handleInputChange}
                          min="1"
                          max="50"
                          placeholder="2"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          👥 Número máximo de personas que pueden alojarse
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estancia Mínima (noches) *
                        </label>
                        <input
                          type="number"
                          name="minimum_stay_nights"
                          value={formData.minimum_stay_nights}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="2"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Recomendado: 2-3 noches para estadías cortas
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estancia Máxima (noches)
                        </label>
                        <input
                          type="number"
                          name="maximum_stay_nights"
                          value={formData.maximum_stay_nights}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="30"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Opcional: límite de noches por reserva
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora de Check-in *
                        </label>
                        <input
                          type="time"
                          name="check_in_time"
                          value={formData.check_in_time}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          🕐 Común: 14:00 - 16:00
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora de Check-out *
                        </label>
                        <input
                          type="time"
                          name="check_out_time"
                          value={formData.check_out_time}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          🕐 Común: 10:00 - 12:00
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="cleaning_included"
                          checked={formData.cleaning_included}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          Limpieza incluida en el precio
                        </span>
                      </label>

                      {!formData.cleaning_included && (
                        <div className="flex-1">
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              Tarifa de limpieza S/
                            </span>
                            <input
                              type="number"
                              name="cleaning_fee"
                              value={formData.cleaning_fee}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="50.00"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Típico: S/ 30-80 por limpieza
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de navegación/acción */}
              {!isEditMode ? (
                /* Modo creación: Navegación paso a paso */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar →
                  </button>
                </div>
              ) : (
                /* Modo edición: Botón de actualizar */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

            {/* Amenidades y Servicios */}
            {activeSection === 'amenities' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  Amenidades y Servicios
                </h2>
                <div className="space-y-6">
                
                {/* Recomendaciones para Airbnb */}
                {formData.rental_model === 'airbnb' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-purple-800">
                        <p className="font-medium mb-2">🌟 Amenidades Esenciales para Airbnb</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-purple-600">•</span>
                            <span>WiFi (obligatorio)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-purple-600">•</span>
                            <span>Cocina Equipada</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-purple-600">•</span>
                            <span>Aire Acondicionado/Calefacción</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-purple-600">•</span>
                            <span>TV Cable</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-purple-700">
                          💡 Cuantas más amenidades ofrezcas, más atractiva será tu propiedad
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Grid de Amenidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecciona las amenidades de tu propiedad
                  </label>
                  
                  {loadingAmenities ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Cargando amenidades...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(availableAmenities.length > 0 ? availableAmenities : AMENITIES.map(a => ({
                        id: a.id,
                        name: a.name,
                        icon: a.icon
                      }))).map(amenity => (
                        <label
                          key={amenity.id}
                          className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedAmenities.includes(amenity.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedAmenities: [...prev.selectedAmenities, amenity.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedAmenities: prev.selectedAmenities.filter(id => id !== amenity.id)
                                }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          {amenity.icon && <span className="text-2xl">{amenity.icon}</span>}
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Seleccionadas: {formData.selectedAmenities.length}
                  </p>
                </div>

                {/* Servicios Incluidos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Servicios Incluidos en el Precio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="utilities_included"
                        checked={formData.utilities_included}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Servicios Básicos</span>
                        <p className="text-xs text-gray-600">Luz, agua, gas incluidos</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="internet_included"
                        checked={formData.internet_included}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Internet/WiFi</span>
                        <p className="text-xs text-gray-600">Conexión incluida</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones de navegación/acción */}
              {!isEditMode ? (
                /* Modo creación: Navegación paso a paso */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar →
                  </button>
                </div>
              ) : (
                /* Modo edición: Botón de actualizar */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

            {/* Políticas */}
            {activeSection === 'policies' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  Políticas y Reglas
                </h2>
                <div className="space-y-6">
                
                {/* Info para Airbnb */}
                {formData.rental_model === 'airbnb' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-purple-800">
                        <p className="font-medium mb-2">🏠 Políticas Claras = Más Reservas</p>
                        <p>
                          Los huéspedes de Airbnb valoran la transparencia. Especifica claramente tus reglas sobre 
                          mascotas, fumar, fiestas, ruido, etc. Esto evita problemas y mejora tu calificación.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mascotas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Se permiten mascotas? *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pet_friendly: 'yes' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.pet_friendly === 'yes'
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🐕</span>
                        <span className="text-sm font-medium">Sí, se permiten</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pet_friendly: 'no' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.pet_friendly === 'no'
                          ? 'border-red-600 bg-red-50 text-red-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🚫</span>
                        <span className="text-sm font-medium">No se permiten</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pet_friendly: 'none' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.pet_friendly === 'none'
                          ? 'border-gray-600 bg-gray-50 text-gray-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🤷</span>
                        <span className="text-sm font-medium">No especificado</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Fumar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Se permite fumar? *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, smoking_allowed: 'yes' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.smoking_allowed === 'yes'
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🚬</span>
                        <span className="text-sm font-medium">Sí, se permite</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, smoking_allowed: 'no' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.smoking_allowed === 'no'
                          ? 'border-red-600 bg-red-50 text-red-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🚭</span>
                        <span className="text-sm font-medium">No se permite</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, smoking_allowed: 'none' }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.smoking_allowed === 'none'
                          ? 'border-gray-600 bg-gray-50 text-gray-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-2xl block mb-1">🤷</span>
                        <span className="text-sm font-medium">No especificado</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reglas de la casa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reglas de la Casa {formData.rental_model === 'airbnb' && <span className="text-purple-600">(Importante para Airbnb)</span>}
                  </label>
                  <textarea
                    name="house_rules"
                    value={formData.house_rules}
                    onChange={handleInputChange}
                    rows={formData.rental_model === 'airbnb' ? 6 : 4}
                    placeholder={
                      formData.rental_model === 'airbnb' 
                        ? "Ejemplo de reglas para Airbnb:\n• No se permiten fiestas ni eventos\n• Horario de silencio: 10pm - 8am\n• No fumar dentro de la propiedad\n• Respetar a los vecinos\n• Máximo X personas\n• No se permiten visitas sin autorización\n• Mantener limpia la propiedad\n• Reportar cualquier daño inmediatamente"
                        : "Ej: No fiestas, horario de silencio 10pm-8am, respetar áreas comunes..."
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.rental_model === 'airbnb' && (
                    <p className="text-xs text-purple-600 mt-1">
                      💡 Tip: Reglas claras y específicas mejoran la experiencia de tus huéspedes
                    </p>
                  )}
                </div>

                {/* Política de cancelación solo para Airbnb */}
                {formData.rental_model === 'airbnb' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Política de Cancelación *
                    </label>
                    <select
                      name="cancellation_policy"
                      value={formData.cancellation_policy}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {CANCELLATION_POLICIES.map(policy => (
                        <option key={policy.value} value={policy.value}>{policy.label}</option>
                      ))}
                    </select>
                    
                    {/* Explicación de las políticas */}
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs font-medium text-purple-900 mb-2">📋 Detalles de cada política:</p>
                      <div className="space-y-2 text-xs text-purple-800">
                        <div className={formData.cancellation_policy === 'flexible' ? 'font-semibold' : ''}>
                          <strong>Flexible:</strong> Los huéspedes reciben reembolso completo si cancelan hasta 24 horas antes del check-in.
                          <span className="text-green-700"> (Más reservas, más cancelaciones)</span>
                        </div>
                        <div className={formData.cancellation_policy === 'moderate' ? 'font-semibold' : ''}>
                          <strong>Moderada:</strong> Reembolso completo si cancelan 5 días antes del check-in.
                          <span className="text-blue-700"> (Balance recomendado)</span>
                        </div>
                        <div className={formData.cancellation_policy === 'strict' ? 'font-semibold' : ''}>
                          <strong>Estricta:</strong> Reembolso del 50% si cancelan 30 días antes, sin reembolso después.
                          <span className="text-red-700"> (Menos cancelaciones, menos reservas)</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-purple-700">
                        💡 Tip: La política <strong>Moderada</strong> es la más popular y equilibrada.
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen antes de publicar */}
                <div className={`${formData.rental_model === 'airbnb' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6 mt-6`}>
                  <h3 className={`font-semibold ${formData.rental_model === 'airbnb' ? 'text-purple-900' : 'text-blue-900'} mb-4 text-lg`}>
                    📋 Resumen de tu Publicación
                  </h3>
                  <div className={`space-y-2 text-sm ${formData.rental_model === 'airbnb' ? 'text-purple-800' : 'text-blue-800'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">• Título:</p>
                        <p className="ml-4">{formData.title || 'Sin título'}</p>
                      </div>
                      <div>
                        <p className="font-medium">• Tipo:</p>
                        <p className="ml-4">{PROPERTY_TYPES.find(t => t.value === formData.property_type)?.label}</p>
                      </div>
                      <div>
                        <p className="font-medium">• Operación:</p>
                        <p className="ml-4">{OPERATION_TYPES.find(t => t.value === formData.operation)?.label}</p>
                      </div>
                      {formData.rental_model === 'airbnb' && (
                        <div>
                          <p className="font-medium text-purple-600">• Modalidad:</p>
                          <p className="ml-4 font-semibold">🏠 Airbnb (Corta estadía)</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">• Ubicación:</p>
                        <p className="ml-4">{formData.district}, {formData.province}</p>
                      </div>
                      <div>
                        <p className="font-medium">• Precio:</p>
                        <p className="ml-4">S/ {formData.price || '0'} {formData.rental_model === 'airbnb' ? '/noche' : '/mes'}</p>
                      </div>
                      {formData.rental_model === 'airbnb' && (
                        <>
                          <div>
                            <p className="font-medium">• Capacidad:</p>
                            <p className="ml-4">👥 {formData.max_guests || '2'} huéspedes máximo</p>
                          </div>
                          <div>
                            <p className="font-medium">• Check-in/Check-out:</p>
                            <p className="ml-4">{formData.check_in_time || '14:00'} - {formData.check_out_time || '12:00'}</p>
                          </div>
                          <div>
                            <p className="font-medium">• Estancia mínima:</p>
                            <p className="ml-4">{formData.minimum_stay_nights || '1'} noches</p>
                          </div>
                          {formData.cleaning_fee && (
                            <div>
                              <p className="font-medium">• Tarifa de limpieza:</p>
                              <p className="ml-4">S/ {formData.cleaning_fee}</p>
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <p className="font-medium">• Amenidades:</p>
                        <p className="ml-4">{formData.selectedAmenities.length} seleccionadas</p>
                      </div>
                    </div>
                  </div>
                  
                  {formData.rental_model === 'airbnb' && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-purple-700">
                        ✨ <strong>Tu propiedad está lista para publicarse en estilo Airbnb!</strong> 
                        <br />La información de contacto se tomará de la configuración de tu perfil.
                      </p>
                    </div>
                  )}
                  
                  {formData.rental_model === 'traditional' && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-blue-700">
                        ✅ <strong>Todo listo para publicar!</strong> 
                        <br />La información de contacto se tomará de la configuración de tu perfil.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de navegación/acción */}
              {!isEditMode ? (
                /* Modo creación: Navegación paso a paso */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continuar →
                  </button>
                </div>
              ) : (
                /* Modo edición: Botón de actualizar */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

            {/* Información de Contacto */}
            {activeSection === 'contact' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <PhoneIcon className="w-6 h-6 text-blue-600" />
                  Información de Contacto
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">📞 Contacto específico para esta propiedad</p>
                      <p>
                        Los inquilinos interesados podrán contactarte usando estos métodos. 
                        Puedes configurar diferentes contactos para cada propiedad.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Nombre de contacto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Ej: Juan Pérez, Inmobiliaria XYZ"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este nombre aparecerá como contacto en el anuncio
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de contacto
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone_e164}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9+]/g, '');
                        setFormData({ ...formData, contact_phone_e164: value });
                      }}
                      placeholder="+51987654321"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formato internacional: +51 seguido del número (9 dígitos)
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_whatsapp_phone_e164}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9+]/g, '');
                        setFormData({ ...formData, contact_whatsapp_phone_e164: value });
                      }}
                      placeholder="+51987654321"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si es diferente al teléfono principal. Formato: +51 seguido del número
                    </p>
                  </div>

                  {/* Vista previa de contacto */}
                  {(formData.contact_name || formData.contact_phone_e164 || formData.contact_whatsapp_phone_e164) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-3">Vista previa del contacto:</p>
                      <div className="space-y-2">
                        {formData.contact_name && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Contacto:</span> {formData.contact_name}
                          </p>
                        )}
                        {formData.contact_phone_e164 && (
                          <div className="flex items-center gap-2 text-sm">
                            <PhoneIcon className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-700">{formData.contact_phone_e164}</span>
                          </div>
                        )}
                        {formData.contact_whatsapp_phone_e164 && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="text-gray-700">{formData.contact_whatsapp_phone_e164}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Advertencia si no hay contacto */}
                  {!formData.contact_phone_e164 && !formData.contact_whatsapp_phone_e164 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Agrega al menos un método de contacto</p>
                          <p className="mt-1">
                            Sin información de contacto, los inquilinos no podrán comunicarse contigo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de navegación/acción */}
                {!isEditMode ? (
                  /* Modo creación: Navegación paso a paso */
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={goToPreviousSection}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      onClick={goToNextSection}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continuar →
                    </button>
                  </div>
                ) : (
                  /* Modo edición: Botón de actualizar */
                  <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          Actualizar Propiedad
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Imágenes */}
            {activeSection === 'images' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <PhotoIcon className="w-6 h-6 text-blue-600" />
                  Imágenes de la Propiedad
                </h2>
                <div className="space-y-6">
                
                {formData.rental_model === 'airbnb' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-purple-800">
                        <p className="font-medium mb-2">📸 Fotos de Calidad = Más Reservas</p>
                        <p>
                          Los anuncios con 5+ fotos profesionales reciben un 40% más de reservas en Airbnb. 
                          Muestra espacios bien iluminados, limpios y ordenados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <ImageUploader
                  listingId={editingListingId || undefined}
                  initialImages={formData.images || []}
                  onImagesChange={(images) => {
                    setFormData(prev => ({ ...prev, images }));
                  }}
                  maxImages={20}
                  apiBaseUrl="http://localhost:8000/v1"
                />
              </div>

              {/* Botones de navegación/submit */}
              {!isEditMode ? (
                /* Modo creación: Mostrar navegación + botón de publicar */
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={goToPreviousSection}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Publicando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Publicar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Modo edición: Solo mostrar botón de actualizar a la derecha */
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Actualizar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          </form>
        </div>
      </div>
    </div>
      </div>
    </>
  );
};

export default CreateListingPage;
