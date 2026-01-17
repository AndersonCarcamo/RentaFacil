import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '@/constants';
import { 
  fetchProperties, 
  PropertyResponse, 
  PropertyFilters,
  formatPrice 
} from '@/services/api/propertiesApi';

const { width, height } = Dimensions.get('window');

type SearchMode = 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb';

interface RouteParams {
  mode?: SearchMode;
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  verified?: boolean;
  petFriendly?: boolean;
}

const SearchResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyResponse | null>(null);
  
  // Filtros
  const [minPrice, setMinPrice] = useState(params.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(params.maxPrice?.toString() || '');
  const [bedrooms, setBedrooms] = useState(params.bedrooms?.toString() || '');
  const [bathrooms, setBathrooms] = useState(params.bathrooms?.toString() || '');
  const [propertyType, setPropertyType] = useState(params.propertyType || '');

  useEffect(() => {
    loadProperties();
  }, [params]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading properties with params:', params);
      
      // Construir filtros de API desde los parámetros de navegación
      const filters: PropertyFilters = {};
      
      // Modo de búsqueda (operation)
      if (params.mode === 'alquiler') {
        filters.operation = 'rent';
      } else if (params.mode === 'comprar') {
        filters.operation = 'sale';
      } else if (params.mode === 'tipo_Airbnb' || params.mode === 'proyecto') {
        filters.operation = 'temp_rent';
        filters.rental_model = 'airbnb';
      }
      
      // Ubicación
      if (params.location) {
        filters.district = params.location;
      }
      
      // Tipo de propiedad
      if (params.propertyType && params.propertyType !== 'Todos') {
        const typeMap: Record<string, string> = {
          'Departamento': 'apartment',
          'Casa': 'house',
          'Habitación': 'room',
          'Estudio': 'studio',
          'Oficina': 'office',
          'Comercial': 'commercial',
        };
        filters.property_type = typeMap[params.propertyType] || params.propertyType.toLowerCase();
      }
      
      // Precio
      if (params.minPrice) filters.min_price = params.minPrice;
      if (params.maxPrice) filters.max_price = params.maxPrice;
      
      // Habitaciones y baños
      if (params.bedrooms) filters.min_bedrooms = params.bedrooms;
      if (params.bathrooms) filters.min_bathrooms = params.bathrooms;
      
      // Área
      if (params.minArea) filters.min_area_built = params.minArea;
      if (params.maxArea) filters.max_area_built = params.maxArea;
      
      // Características booleanas
      if (params.furnished) filters.furnished = true;
      if (params.petFriendly) filters.pet_friendly = true;
      if (params.verified) filters.has_media = true;
      
      // Llamar a la API
      const apiProperties = await fetchProperties(filters);
      console.log('✅ Properties loaded:', apiProperties.length);
      
      // Detectar propiedades tipo Airbnb
      const airbnbProperties = apiProperties.filter(p => p.rental_model === 'airbnb');
      if (airbnbProperties.length > 0) {
        console.log('🏖️ Airbnb properties found:', airbnbProperties.length);
        airbnbProperties.forEach(prop => {
          console.log('🏖️', {
            id: prop.id,
            title: prop.title,
            rental_model: prop.rental_model,
            rental_term: prop.rental_term
          });
        });
      }
      
      setProperties(apiProperties);
    } catch (err) {
      console.error('❌ Error loading properties:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const countActiveFilters = () => {
    let count = 0;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (bedrooms) count++;
    if (bathrooms) count++;
    if (propertyType) count++;
    return count;
  };

  const renderPropertyCard = (property: PropertyResponse) => {
    const firstImage = property.images && property.images.length > 0 
      ? property.images[0].url 
      : null;
    
    return (
      <TouchableOpacity
        key={property.id}
        style={styles.propertyCard}
        onPress={() => alert(`Ver propiedad: ${property.title}`)}
        activeOpacity={0.8}
      >
        {/* Imagen de la propiedad */}
        {firstImage ? (
          <Image 
            source={{ uri: firstImage }} 
            style={styles.propertyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.propertyImagePlaceholder}>
            <Feather name="image" size={48} color="#CBD5E1" />
          </View>
        )}

        <View style={styles.propertyInfo}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {property.title}
            </Text>
            {(property.verification_status === 'verified' || property.has_media) && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={16} color="#10B981" />
              </View>
            )}
          </View>

          <View style={styles.propertyLocation}>
            <Feather name="map-pin" size={14} color="#64748B" />
            <Text style={styles.locationText}>
              {property.district || property.address || 'Sin ubicación'}
            </Text>
          </View>

          <View style={styles.propertyFeatures}>
            {property.bedrooms && (
              <View style={styles.feature}>
                <Feather name="home" size={14} color="#64748B" />
                <Text style={styles.featureText}>{property.bedrooms} hab</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.feature}>
                <Feather name="droplet" size={14} color="#64748B" />
                <Text style={styles.featureText}>{property.bathrooms} baños</Text>
              </View>
            )}
            {property.area_built && (
              <View style={styles.feature}>
                <Feather name="maximize" size={14} color="#64748B" />
                <Text style={styles.featureText}>{property.area_built}m²</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(property.price, property.currency)}</Text>
            {property.rental_model === 'airbnb' && (
              <View style={styles.airbnbBadge}>
                <Text style={styles.airbnbBadgeText}>Airbnb</Text>
              </View>
            )}
            {property.operation === 'rent' && (
              <Text style={styles.priceLabel}>/mes</Text>
            )}
            {property.rental_term === 'daily' && (
              <Text style={styles.priceLabel}>/noche</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {params.location || 'Todas las ubicaciones'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="search" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Toggle de Vista y Filtros */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, viewMode === 'list' && styles.toolbarButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Feather name="list" size={18} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
          <Text style={[styles.toolbarButtonText, viewMode === 'list' && styles.toolbarButtonTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolbarButton, viewMode === 'map' && styles.toolbarButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Feather name="map" size={18} color={viewMode === 'map' ? '#2563EB' : '#64748B'} />
          <Text style={[styles.toolbarButtonText, viewMode === 'map' && styles.toolbarButtonTextActive]}>
            Mapa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Feather name="sliders" size={18} color="#2563EB" />
          <Text style={styles.filterButtonText}>Filtros</Text>
          {countActiveFilters() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{countActiveFilters()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Buscando propiedades...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadProperties}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'list' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {properties.length > 0 ? (
            properties.map(property => renderPropertyCard(property))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No se encontraron propiedades</Text>
              <Text style={styles.emptyText}>
                {params.mode === 'tipo_Airbnb' 
                  ? 'No hay propiedades tipo Airbnb disponibles en este momento'
                  : 'Intenta ajustar tus filtros o buscar en otra ubicación'}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // Vista de Mapa
        <View style={styles.mapContainer}>
          {properties.length > 0 && properties.some(p => p.latitude && p.longitude) ? (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: properties.find(p => p.latitude)?.latitude || -12.0464,
                  longitude: properties.find(p => p.longitude)?.longitude || -77.0428,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation
                showsMyLocationButton
              >
                {properties.map(property => {
                  if (!property.latitude || !property.longitude) return null;
                  
                  return (
                    <Marker
                      key={property.id}
                      coordinate={{
                        latitude: property.latitude,
                        longitude: property.longitude,
                      }}
                      onPress={() => setSelectedProperty(property)}
                    >
                      <View style={[
                        styles.markerContainer,
                        selectedProperty?.id === property.id && styles.markerContainerSelected
                      ]}>
                        <Text style={styles.markerText}>
                          {formatPrice(property.price, property.currency)}
                        </Text>
                      </View>
                    </Marker>
                  );
                })}
              </MapView>

              {/* Property Card Overlay */}
              {selectedProperty && (
                <View style={styles.mapPropertyCard}>
                  <TouchableOpacity
                    style={styles.mapPropertyCardContent}
                    onPress={() => alert(`Ver propiedad: ${selectedProperty.title}`)}
                    activeOpacity={0.8}
                  >
                    {selectedProperty.images && selectedProperty.images.length > 0 ? (
                      <Image 
                        source={{ uri: selectedProperty.images[0].url }} 
                        style={styles.mapPropertyImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mapPropertyImagePlaceholder}>
                        <Feather name="image" size={32} color="#CBD5E1" />
                      </View>
                    )}

                    <View style={styles.mapPropertyInfo}>
                      <Text style={styles.mapPropertyTitle} numberOfLines={2}>
                        {selectedProperty.title}
                      </Text>
                      <Text style={styles.mapPropertyPrice}>
                        {formatPrice(selectedProperty.price, selectedProperty.currency)}
                      </Text>
                      <View style={styles.mapPropertyFeatures}>
                        {selectedProperty.bedrooms && (
                          <Text style={styles.mapPropertyFeature}>
                            {selectedProperty.bedrooms} hab
                          </Text>
                        )}
                        {selectedProperty.bathrooms && (
                          <Text style={styles.mapPropertyFeature}>
                            • {selectedProperty.bathrooms} baños
                          </Text>
                        )}
                        {selectedProperty.area_built && (
                          <Text style={styles.mapPropertyFeature}>
                            • {selectedProperty.area_built}m²
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.mapPropertyClose}
                      onPress={() => setSelectedProperty(null)}
                    >
                      <Feather name="x" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Feather name="map-pin" size={64} color="#CBD5E1" />
              <Text style={styles.mapPlaceholderText}>
                {properties.length === 0 
                  ? 'No hay propiedades para mostrar en el mapa'
                  : 'Las propiedades no tienen coordenadas para mostrar en el mapa'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modal de Filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Feather name="x" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Rango de Precio */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Rango de Precio (S/)</Text>
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <View style={styles.input}>
                    <Text style={styles.inputPlaceholder}>
                      {minPrice || '0'}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <View style={styles.input}>
                    <Text style={styles.inputPlaceholder}>
                      {maxPrice || '5000'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Habitaciones */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Habitaciones</Text>
              <View style={styles.roomsGrid}>
                {['1', '2', '3', '4+'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.roomButton,
                      bedrooms === num && styles.roomButtonActive
                    ]}
                    onPress={() => setBedrooms(bedrooms === num ? '' : num)}
                  >
                    <Text style={[
                      styles.roomButtonText,
                      bedrooms === num && styles.roomButtonTextActive
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Baños */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Baños</Text>
              <View style={styles.roomsGrid}>
                {['1', '2', '3', '4+'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.roomButton,
                      bathrooms === num && styles.roomButtonActive
                    ]}
                    onPress={() => setBathrooms(bathrooms === num ? '' : num)}
                  >
                    <Text style={[
                      styles.roomButtonText,
                      bathrooms === num && styles.roomButtonTextActive
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setPropertyType('');
                setMinPrice('');
                setMaxPrice('');
                setBedrooms('');
                setBathrooms('');
              }}
            >
              <Text style={styles.clearFiltersText}>Limpiar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFilters(false);
                // Aplicar filtros y recargar resultados
              }}
            >
              <Text style={styles.applyFiltersText}>Ver {properties.length} resultados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SearchResultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: SIZES.sm,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchButton: {
    padding: SIZES.xs,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: SIZES.sm,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.lg,
    gap: SIZES.xs,
    backgroundColor: '#F8FAFC',
  },
  toolbarButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  toolbarButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.lg,
    gap: SIZES.xs,
    backgroundColor: '#EFF6FF',
    marginLeft: 'auto',
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.md,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  airbnbBadge: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.md,
    marginLeft: SIZES.xs,
  },
  airbnbBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: SIZES.lg,
    backgroundColor: '#2563EB',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: SIZES.md,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  verifiedBadge: {
    marginTop: 2,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
  },
  propertyFeatures: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: SIZES.lg,
    marginBottom: SIZES.xs,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    backgroundColor: '#2563EB',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    borderRadius: SIZES.radius.lg,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainerSelected: {
    backgroundColor: '#FCD34D',
    transform: [{ scale: 1.1 }],
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mapPropertyCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mapPropertyCardContent: {
    flexDirection: 'row',
    padding: SIZES.sm,
  },
  mapPropertyImage: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius.md,
  },
  mapPropertyImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPropertyInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
    justifyContent: 'space-between',
  },
  mapPropertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mapPropertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  mapPropertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mapPropertyFeature: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 4,
  },
  mapPropertyClose: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    padding: 4,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: SIZES.md,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
  },
  filterSection: {
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: SIZES.md,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: SIZES.xs,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#94A3B8',
  },
  roomsGrid: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  roomButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  roomButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roomButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  roomButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: SIZES.md,
  },
  clearFiltersButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
