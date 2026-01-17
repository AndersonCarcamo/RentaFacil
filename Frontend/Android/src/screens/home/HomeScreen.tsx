import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SIZES, ROUTES } from '@/constants';
import { RootStackParamList } from '@/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const { width, height } = Dimensions.get('window');

type SearchMode = 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rating: number;
  isVerified: boolean;
  views?: number;
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const [, forceUpdate] = useState({});
  const [searchMode, setSearchMode] = useState<SearchMode>('alquiler');
  const [searchLocation, setSearchLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filterStep, setFilterStep] = useState<'propertyType' | 'price' | 'rooms' | 'area' | 'amenities'>('propertyType');
  
  // Filtros
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [furnished, setFurnished] = useState<boolean | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [petFriendly, setPetFriendly] = useState<boolean | undefined>(undefined);

  // Debug: mostrar el estado de autenticación
  useEffect(() => {
    console.log('🏠 HomeScreen - isAuthenticated:', isAuthenticated);
    console.log('🏠 HomeScreen - user:', user);
  }, [user, isAuthenticated]);

  // Recargar el estado cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 HomeScreen - Focus received, checking auth state');
      console.log('🏠 Current user:', user);
      console.log('🏠 Is authenticated:', isAuthenticated);
      // Forzar re-render para mostrar el estado actualizado
      forceUpdate({});
    }, [user, isAuthenticated])
  );

  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Departamento Moderno en San Isidro',
      price: 1200,
      location: 'San Isidro, Lima',
      bedrooms: 2,
      bathrooms: 2,
      area: 85,
      rating: 4.8,
      isVerified: true,
      views: 245,
    },
    {
      id: '2',
      title: 'Casa Amplia con Jardín',
      price: 2500,
      location: 'Miraflores, Lima',
      bedrooms: 3,
      bathrooms: 3,
      area: 150,
      rating: 4.9,
      isVerified: true,
      views: 189,
    },
    {
      id: '3',
      title: 'Departamento Vista al Mar',
      price: 1800,
      location: 'Barranco, Lima',
      bedrooms: 2,
      bathrooms: 2,
      area: 95,
      rating: 4.7,
      isVerified: false,
      views: 312,
    },
  ];

  useEffect(() => {
    setFeaturedProperties(mockProperties);
  }, []);

  const handleSearch = () => {
    // Si hay filtros configurados O hay ubicación, ir directo a resultados
    const hasFilters = minPrice || maxPrice || bedrooms || bathrooms || minArea || maxArea || 
                       furnished !== undefined || verified !== undefined || petFriendly !== undefined;
    
    if (searchLocation || hasFilters) {
      // Ir directamente a resultados con todos los filtros
      navigation.navigate('SearchResultsScreen', {
        mode: searchMode,
        location: searchLocation || undefined,
        propertyType: propertyType || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        minArea: minArea ? Number(minArea) : undefined,
        maxArea: maxArea ? Number(maxArea) : undefined,
        furnished: furnished,
        verified: verified,
        petFriendly: petFriendly,
      });
    } else {
      // Si no hay nada, ir a SearchScreen para que ingrese ubicación
      navigation.navigate('SearchScreen', {
        mode: searchMode,
        propertyType: propertyType
      });
    }
  };

  const handleVoiceSearch = () => {
    setIsRecording(!isRecording);
    alert('Asistente de voz activado');
  };

  const handleUseLocation = () => {
    // Navegar al SearchScreen y activar la geolocalización
    navigation.navigate('SearchScreen', {
      mode: searchMode,
      location: 'Mi ubicación',
      propertyType: propertyType,
      useGeolocation: true
    });
  };

  const handleOpenFilters = () => {
    setFilterStep('propertyType');
    setShowFiltersModal(true);
  };

  const handleNextFilterStep = () => {
    const steps: Array<'propertyType' | 'price' | 'rooms' | 'area' | 'amenities'> = 
      ['propertyType', 'price', 'rooms', 'area', 'amenities'];
    const currentIndex = steps.indexOf(filterStep);
    if (currentIndex < steps.length - 1) {
      setFilterStep(steps[currentIndex + 1]);
    } else {
      // Último paso, aplicar filtros y buscar
      setShowFiltersModal(false);
      handleSearch();
    }
  };

  const handlePrevFilterStep = () => {
    const steps: Array<'propertyType' | 'price' | 'rooms' | 'area' | 'amenities'> = 
      ['propertyType', 'price', 'rooms', 'area', 'amenities'];
    const currentIndex = steps.indexOf(filterStep);
    if (currentIndex > 0) {
      setFilterStep(steps[currentIndex - 1]);
    }
  };

  const countActiveFilters = () => {
    let count = 0;
    if (propertyType) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (bedrooms) count++;
    if (bathrooms) count++;
    if (minArea) count++;
    if (maxArea) count++;
    if (furnished !== undefined) count++;
    if (verified !== undefined) count++;
    if (petFriendly !== undefined) count++;
    return count;
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => alert(`Ver propiedad: ${item.title}`)}
      activeOpacity={0.8}
    >
      <View style={styles.propertyImageContainer}>
        <View style={styles.propertyImagePlaceholder}>
          <Feather name="image" size={48} color="#CBD5E1" />
        </View>
        
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="check" size={12} color="#FFFFFF" />
            <Text style={styles.verifiedText}>Verificada</Text>
          </View>
        )}
        
        {item.views && (
          <View style={styles.viewsBadge}>
            <Feather name="eye" size={12} color="#FFFFFF" />
            <Text style={styles.viewsText}>{item.views}</Text>
          </View>
        )}
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color="#64748B" style={styles.locationPin} />
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.propertyDetails}>
          <View style={styles.detailItem}>
            <Feather name="home" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="droplet" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="maximize" size={14} color="#64748B" />
            <Text style={styles.detailText}>{item.area}m²</Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="star" size={14} color="#FCD34D" />
            <Text style={styles.detailText}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.propertyPrice}>
            S/ {item.price.toLocaleString()}
          </Text>
          <Text style={styles.propertyPriceLabel}>/mes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo_sin_fondo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
          {isAuthenticated && user ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => (navigation as any).navigate(ROUTES.PROFILE)}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user.firstName || user.email.split('@')[0]}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
              {user.profilePictureUrl ? (
                <Image source={{ uri: user.profilePictureUrl }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Feather name="user" size={20} color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => (navigation as any).navigate(ROUTES.LOGIN)}
            >
              <Text style={styles.loginButtonText}>Ingresar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Background Pattern */}
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Background Pattern Overlay - SVG Pattern */}
          <View style={styles.patternOverlay}>
            <View style={styles.patternContainer}>
              {/* House Icon Pattern */}
              {[...Array(8)].map((_, i) => (
                <View key={`house-${i}`} style={[styles.patternIcon, {
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  opacity: 0.15,
                }]}>
                  <Feather name="home" size={24} color="#2563EB" />
                </View>
              ))}
              {/* Building Icon Pattern */}
              {[...Array(6)].map((_, i) => (
                <View key={`building-${i}`} style={[styles.patternIcon, {
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  opacity: 0.12,
                }]}>
                  <Feather name="package" size={24} color="#2563EB" />
                </View>
              ))}
              {/* Key Icon Pattern */}
              {[...Array(5)].map((_, i) => (
                <View key={`key-${i}`} style={[styles.patternIcon, {
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  opacity: 0.1,
                  transform: [{ rotate: `${Math.random() * 60 - 30}deg` }],
                }]}>
                  <Feather name="key" size={20} color="#2563EB" />
                </View>
              ))}
              {/* Door Icon Pattern */}
              {[...Array(4)].map((_, i) => (
                <View key={`door-${i}`} style={[styles.patternIcon, {
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  opacity: 0.1,
                }]}>
                  <Feather name="square" size={20} color="#2563EB" />
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.heroContent}>
            {/* Search Form Card */}
            <View style={styles.searchCard}>
              {/* Mode Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modeTabs}
                contentContainerStyle={styles.modeTabsContent}
              >
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    searchMode === 'alquiler' && styles.modeTabActive,
                  ]}
                  onPress={() => setSearchMode('alquiler')}
                >
                  <View style={styles.modeTabContent}>
                    <Feather 
                      name="home" 
                      size={16} 
                      color={searchMode === 'alquiler' ? '#FFFFFF' : '#64748B'} 
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        searchMode === 'alquiler' && styles.modeTabTextActive,
                      ]}
                    >
                      Alquiler
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    searchMode === 'comprar' && styles.modeTabActive,
                  ]}
                  onPress={() => setSearchMode('comprar')}
                >
                  <View style={styles.modeTabContent}>
                    <Feather 
                      name="shopping-bag" 
                      size={16} 
                      color={searchMode === 'comprar' ? '#FFFFFF' : '#64748B'} 
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        searchMode === 'comprar' && styles.modeTabTextActive,
                      ]}
                    >
                      Comprar
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    searchMode === 'proyecto' && styles.modeTabActive,
                  ]}
                  onPress={() => setSearchMode('proyecto')}
                >
                  <View style={styles.modeTabContent}>
                    <Feather 
                      name="tool" 
                      size={16} 
                      color={searchMode === 'proyecto' ? '#FFFFFF' : '#64748B'} 
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        searchMode === 'proyecto' && styles.modeTabTextActive,
                      ]}
                    >
                      Proyecto
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    searchMode === 'tipo_Airbnb' && styles.modeTabActive,
                  ]}
                  onPress={() => setSearchMode('tipo_Airbnb')}
                >
                  <View style={styles.modeTabContent}>
                    <Feather 
                      name="coffee" 
                      size={16} 
                      color={searchMode === 'tipo_Airbnb' ? '#FFFFFF' : '#64748B'} 
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        searchMode === 'tipo_Airbnb' && styles.modeTabTextActive,
                      ]}
                    >
                      Tipo Airbnb
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Property Type Selector */}
              <View style={styles.propertyTypeRow}>
                <Text style={styles.propertyTypeLabel}>Tipo de Propiedad</Text>
                <TouchableOpacity
                  style={styles.propertyTypeSelector}
                  onPress={() => setShowPropertyTypeModal(true)}
                >
                  <Text style={styles.propertyTypeSelectorText}>
                    {propertyType || 'Todos'}
                  </Text>
                  <Feather name="chevron-down" size={14} color="#1E40AF" />
                </TouchableOpacity>
              </View>

              {/* Location Search */}
              <View style={styles.searchRow}>
                <View style={styles.searchInputContainer}>
                  <Text style={styles.searchLabel}>Ubicación</Text>
                  <TouchableOpacity
                    style={styles.searchInputWrapper}
                    onPress={handleSearch}
                    activeOpacity={0.7}
                  >
                    <Feather name="map-pin" size={18} color="#64748B" style={styles.searchIcon} />
                    <Text style={[
                      styles.searchInput,
                      !searchLocation && styles.searchPlaceholder
                    ]}>
                      {searchLocation || "Distrito, ciudad o dirección"}
                    </Text>
                    <TouchableOpacity
                      style={styles.voiceButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleVoiceSearch();
                      }}
                    >
                      <Feather 
                        name={isRecording ? 'square' : 'mic'} 
                        size={18} 
                        color={isRecording ? '#EF4444' : '#64748B'} 
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.useLocationButton}
                  onPress={handleUseLocation}
                >
                  <Feather name="navigation" size={18} color="#2563EB" style={styles.useLocationIcon} />
                  <Text style={styles.useLocationText}>Mi ubicación</Text>
                </TouchableOpacity>
              </View>

              {/* Search Button */}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Feather name="search" size={20} color="#FFFFFF" style={styles.searchButtonIcon} />
                <Text style={styles.searchButtonText}>Buscar Propiedades</Text>
              </TouchableOpacity>

              {/* Filters Button */}
              <TouchableOpacity
                style={styles.filtersButton}
                onPress={handleOpenFilters}
              >
                <Feather name="sliders" size={18} color="#2563EB" />
                <Text style={styles.filtersButtonText}>
                  Filtros avanzados
                </Text>
                {countActiveFilters() > 0 && (
                  <View style={styles.filtersBadge}>
                    <Text style={styles.filtersBadgeText}>{countActiveFilters()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Featured Properties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedades Destacadas</Text>
          <Text style={styles.sectionSubtitle}>
            Descubre las mejores opciones seleccionadas para ti
          </Text>
        </View>

        <FlatList
          data={featuredProperties}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.propertiesList}
        />

        {/* CTA Banner */}
        <LinearGradient
          colors={['#FCD34D', '#FDE68A', '#FCD34D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBanner}
        >
          <Text style={styles.ctaTitle}>
            ¿Tienes una propiedad para alquilar?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Publícala en cualquier modalidad
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Publicar Gratis</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Por qué RENTA fácil?</Text>
        </View>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Feather name="shield" size={32} color="#2563EB" />
            </View>
            <Text style={styles.benefitTitle}>Seguro</Text>
            <Text style={styles.benefitText}>
              Propiedades verificadas
            </Text>
          </View>
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Feather name="zap" size={32} color="#2563EB" />
            </View>
            <Text style={styles.benefitTitle}>Rápido</Text>
            <Text style={styles.benefitText}>
              Búsqueda inteligente
            </Text>
          </View>
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Feather name="mic" size={32} color="#2563EB" />
            </View>
            <Text style={styles.benefitTitle}>Voz</Text>
            <Text style={styles.benefitText}>
              Búsqueda por voz
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Filters Step Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.filtersModalContainer}>
          {/* Header */}
          <View style={styles.filtersModalHeader}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Feather name="x" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.filtersModalTitle}>
              {filterStep === 'propertyType' && 'Tipo de Propiedad'}
              {filterStep === 'price' && 'Rango de Precio'}
              {filterStep === 'rooms' && 'Habitaciones y Baños'}
              {filterStep === 'area' && 'Área'}
              {filterStep === 'amenities' && 'Comodidades'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowFiltersModal(false);
              handleSearch();
            }}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {['propertyType', 'price', 'rooms', 'area', 'amenities'].map((step, index) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  step === filterStep && styles.progressDotActive,
                  ['propertyType', 'price', 'rooms', 'area', 'amenities'].indexOf(filterStep) > index && 
                    styles.progressDotCompleted
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.filtersModalContent}>
            {/* Property Type Step */}
            {filterStep === 'propertyType' && (
              <View style={styles.filterStepContainer}>
                <Text style={styles.filterStepTitle}>¿Qué tipo de propiedad buscas?</Text>
                <View style={styles.propertyTypesGrid}>
                  {[
                    { value: '', label: 'Todos', icon: 'grid' },
                    { value: 'Departamento', label: 'Departamento', icon: 'home' },
                    { value: 'Casa', label: 'Casa', icon: 'home' },
                    { value: 'Habitación', label: 'Habitación', icon: 'square' },
                    { value: 'Estudio', label: 'Estudio', icon: 'briefcase' },
                    { value: 'Oficina', label: 'Oficina', icon: 'briefcase' },
                    { value: 'Comercial', label: 'Comercial', icon: 'shopping-bag' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.propertyTypeCard,
                        propertyType === type.value && styles.propertyTypeCardActive
                      ]}
                      onPress={() => setPropertyType(type.value)}
                    >
                      <Feather 
                        name={type.icon as any} 
                        size={32} 
                        color={propertyType === type.value ? '#2563EB' : '#64748B'} 
                      />
                      <Text style={[
                        styles.propertyTypeCardText,
                        propertyType === type.value && styles.propertyTypeCardTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Price Step */}
            {filterStep === 'price' && (
              <View style={styles.filterStepContainer}>
                <Text style={styles.filterStepTitle}>Rango de precio (S/)</Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceInputGroup}>
                    <Text style={styles.priceLabel}>Mínimo</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceCurrency}>S/</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={minPrice}
                        onChangeText={setMinPrice}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                  <View style={styles.priceInputGroup}>
                    <Text style={styles.priceLabel}>Máximo</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceCurrency}>S/</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                        placeholder="5000"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Rooms Step */}
            {filterStep === 'rooms' && (
              <View style={styles.filterStepContainer}>
                <Text style={styles.filterStepTitle}>Habitaciones</Text>
                <View style={styles.roomsGrid}>
                  {['1', '2', '3', '4+'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.roomButton,
                        bedrooms === num.replace('+', '') && styles.roomButtonActive
                      ]}
                      onPress={() => setBedrooms(bedrooms === num.replace('+', '') ? '' : num.replace('+', ''))}
                    >
                      <Text style={[
                        styles.roomButtonText,
                        bedrooms === num.replace('+', '') && styles.roomButtonTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.filterStepTitle, { marginTop: SIZES.xl }]}>Baños</Text>
                <View style={styles.roomsGrid}>
                  {['1', '2', '3', '4+'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.roomButton,
                        bathrooms === num.replace('+', '') && styles.roomButtonActive
                      ]}
                      onPress={() => setBathrooms(bathrooms === num.replace('+', '') ? '' : num.replace('+', ''))}
                    >
                      <Text style={[
                        styles.roomButtonText,
                        bathrooms === num.replace('+', '') && styles.roomButtonTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Area Step */}
            {filterStep === 'area' && (
              <View style={styles.filterStepContainer}>
                <Text style={styles.filterStepTitle}>Área (m²)</Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceInputGroup}>
                    <Text style={styles.priceLabel}>Mínima</Text>
                    <TextInput
                      style={styles.areaInput}
                      value={minArea}
                      onChangeText={setMinArea}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.priceInputGroup}>
                    <Text style={styles.priceLabel}>Máxima</Text>
                    <TextInput
                      style={styles.areaInput}
                      value={maxArea}
                      onChangeText={setMaxArea}
                      placeholder="500"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Amenities Step */}
            {filterStep === 'amenities' && (
              <View style={styles.filterStepContainer}>
                <Text style={styles.filterStepTitle}>Comodidades</Text>
                <View style={styles.amenitiesList}>
                  <TouchableOpacity
                    style={styles.amenityItem}
                    onPress={() => setFurnished(furnished === true ? undefined : true)}
                  >
                    <Text style={styles.amenityText}>Amoblado</Text>
                    <View style={[
                      styles.amenityCheckbox,
                      furnished === true && styles.amenityCheckboxActive
                    ]}>
                      {furnished === true && <Feather name="check" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.amenityItem}
                    onPress={() => setVerified(verified === true ? undefined : true)}
                  >
                    <Text style={styles.amenityText}>Solo verificados</Text>
                    <View style={[
                      styles.amenityCheckbox,
                      verified === true && styles.amenityCheckboxActive
                    ]}>
                      {verified === true && <Feather name="check" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.amenityItem}
                    onPress={() => setPetFriendly(petFriendly === true ? undefined : true)}
                  >
                    <Text style={styles.amenityText}>🐕 Pet Friendly</Text>
                    <View style={[
                      styles.amenityCheckbox,
                      petFriendly === true && styles.amenityCheckboxActive
                    ]}>
                      {petFriendly === true && <Feather name="check" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.filtersModalFooter}>
            {['propertyType', 'price', 'rooms', 'area', 'amenities'].indexOf(filterStep) > 0 && (
              <TouchableOpacity
                style={styles.filterBackButton}
                onPress={handlePrevFilterStep}
              >
                <Feather name="arrow-left" size={20} color="#64748B" />
                <Text style={styles.filterBackButtonText}>Atrás</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.filterNextButton, 
                ['propertyType', 'price', 'rooms', 'area', 'amenities'].indexOf(filterStep) === 0 && 
                { flex: 1 }
              ]}
              onPress={handleNextFilterStep}
            >
              <Text style={styles.filterNextButtonText}>
                {filterStep === 'amenities' ? 'Buscar' : 'Siguiente'}
              </Text>
              {filterStep !== 'amenities' && (
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Property Type Modal */}
      <Modal
        visible={showPropertyTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertyTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPropertyTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Propiedad</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {[
              { value: '', label: 'Todos' },
              { value: 'Departamento', label: 'Departamento' },
              { value: 'Casa', label: 'Casa' },
              { value: 'Habitación', label: 'Habitación' },
              { value: 'Estudio', label: 'Estudio' },
              { value: 'Oficina', label: 'Oficina' },
              { value: 'Comercial', label: 'Comercial' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setPropertyType(option.value);
                  setShowPropertyTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {propertyType === option.value && (
                  <Feather name="check" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  logoImage: {
    width: 150,
    height: 40,
  },
  logoRenta: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FCD34D',
    letterSpacing: 1.5,
  },
  logoFacil: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    elevation: 2,
    boxShadow: '0px 2px 3px rgba(37, 99, 235, 0.25)',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileInfo: {
    maxWidth: 120,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  profileAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingBottom: SIZES.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    position: 'relative',
  },
  patternIcon: {
    position: 'absolute',
  },
  patternIconText: {
    fontSize: 32,
    color: '#ffffff',
  },
  heroContent: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: SIZES.radius.xl,
    padding: SIZES.md,
    elevation: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
  },
  modeTabs: {
    marginBottom: SIZES.md,
  },
  modeTabsContent: {
    gap: SIZES.sm,
  },
  modeTab: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    backgroundColor: 'transparent',
  },
  modeTabActive: {
    backgroundColor: '#FCD34D',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    opacity: 0.7,
  },
  modeTabTextActive: {
    color: '#1E40AF',
    opacity: 1,
  },
  modeTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  propertyTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  propertyTypeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30,64,175,0.2)',
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  propertyTypeSelectorText: {
    fontSize: 14,
    color: '#1E40AF',
  },
  searchRow: {
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: SIZES.xs,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30,64,175,0.2)',
    borderRadius: SIZES.radius.md,
    paddingLeft: SIZES.md,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: SIZES.sm,
    color: '#1E40AF',
    outlineStyle: 'none',
  },
  searchPlaceholder: {
    color: '#94A3B8',
  },
  voiceButton: {
    padding: SIZES.sm,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,211,77,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.6)',
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    gap: SIZES.xs,
  },
  useLocationIcon: {
    marginRight: 4,
  },
  useLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
    elevation: 2,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.15)',
  },
  searchButtonIcon: {
    marginRight: 4,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.sm,
    gap: SIZES.xs,
    marginTop: SIZES.sm,
    position: 'relative',
  },
  filtersButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filtersModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filtersModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filtersModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: '#FFFFFF',
    gap: SIZES.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#2563EB',
  },
  progressDotCompleted: {
    backgroundColor: '#5AB0DB',
  },
  filtersModalContent: {
    flex: 1,
  },
  filterStepContainer: {
    padding: SIZES.xl,
  },
  filterStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SIZES.lg,
  },
  propertyTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
  },
  propertyTypeCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.xl,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  propertyTypeCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  propertyTypeCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  propertyTypeCardTextActive: {
    color: '#2563EB',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  priceInputGroup: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: SIZES.sm,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SIZES.md,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginRight: SIZES.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: SIZES.md,
    outlineStyle: 'none',
  },
  areaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: 16,
    color: '#1E293B',
  },
  roomsGrid: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  roomButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: SIZES.lg,
    alignItems: 'center',
  },
  roomButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roomButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  roomButtonTextActive: {
    color: '#2563EB',
  },
  amenitiesList: {
    gap: SIZES.md,
  },
  amenityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  amenityCheckbox: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radius.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityCheckboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filtersModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: SIZES.md,
  },
  filterBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: SIZES.xs,
  },
  filterBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  filterNextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    gap: SIZES.xs,
  },
  filterNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  propertiesList: {
    paddingHorizontal: SIZES.lg,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: SIZES.radius.xl,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
  },
  propertyImageContainer: {
    position: 'relative',
  },
  propertyImagePlaceholder: {
    height: 200,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.sm,
    gap: 4,
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewsBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: SIZES.md,
  },
  propertyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SIZES.sm,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  locationPin: {
    marginRight: SIZES.xs,
  },
  propertyLocation: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    gap: SIZES.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  propertyPriceLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  ctaBanner: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
    padding: SIZES.xl,
    borderRadius: SIZES.radius.xl,
    alignItems: 'center',
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: '#1E40AF',
    marginBottom: SIZES.lg,
    textAlign: 'center',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    elevation: 2,
    boxShadow: '0px 1px 3px rgba(37, 99, 235, 0.2)',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  benefitsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SIZES.xs,
  },
  benefitText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    paddingVertical: SIZES.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
});
