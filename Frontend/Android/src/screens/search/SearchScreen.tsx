import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SearchMode = 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb';

interface RouteParams {
  mode?: SearchMode;
  location?: string;
  propertyType?: string;
}

interface SearchHistory {
  text: string;
  timestamp: number;
}

const STORAGE_KEY = 'rentafacil_search_history';
const MAX_HISTORY = 5;

// Distritos de Lima y Callao - Lista completa como en web
const POPULAR_LOCATIONS = [
  // Lima Centro
  'Lima Centro',
  'Cercado de Lima',
  'Breña',
  'La Victoria',
  'Rímac',
  
  // Lima Moderna
  'Miraflores',
  'San Isidro',
  'Barranco',
  'Santiago de Surco',
  'Surco',
  'La Molina',
  'San Borja',
  'Jesús María',
  'Lince',
  'Magdalena del Mar',
  'Magdalena',
  'Pueblo Libre',
  'San Miguel',
  
  // Lima Este
  'Ate',
  'Santa Anita',
  'El Agustino',
  'San Luis',
  'Chaclacayo',
  'Lurigancho',
  'Chosica',
  
  // Lima Norte
  'Los Olivos',
  'Independencia',
  'San Martín de Porres',
  'Comas',
  'Carabayllo',
  'Puente Piedra',
  'Santa Rosa',
  'Ancón',
  
  // Lima Sur
  'Chorrillos',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'San Juan de Miraflores',
  'Lurín',
  'Pachacamac',
  'Punta Hermosa',
  'Punta Negra',
  'San Bartolo',
  'Santa María del Mar',
  'Pucusana',
  
  // Callao
  'Callao',
  'Bellavista',
  'La Perla',
  'La Punta',
  'Carmen de la Legua',
  'Ventanilla',
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;

  const [searchQuery, setSearchQuery] = useState(params.location || '');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Filtros avanzados
  const [propertyType, setPropertyType] = useState(params.propertyType || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [furnished, setFurnished] = useState<boolean | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [petFriendly, setPetFriendly] = useState<boolean | undefined>(undefined);

  // Cargar historial desde AsyncStorage
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const history: SearchHistory[] = JSON.parse(stored);
        setSearchHistory(history.slice(0, MAX_HISTORY));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToHistory = async (searchText: string) => {
    if (!searchText.trim()) return;

    const newHistory: SearchHistory[] = [
      { text: searchText, timestamp: Date.now() },
      ...searchHistory.filter(item => item.text !== searchText)
    ].slice(0, MAX_HISTORY);

    setSearchHistory(newHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = async (text: string) => {
    const newHistory = searchHistory.filter(item => item.text !== text);
    setSearchHistory(newHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = POPULAR_LOCATIONS.filter(location =>
        location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  };

  const handleSelectLocation = async (location: string) => {
    setSearchQuery(location);
    await saveToHistory(location);
    
    // Navegar a la pantalla de resultados
    navigation.navigate('SearchResultsScreen', {
      mode: params.mode || 'alquiler',
      location: location,
      propertyType: propertyType
    });
  };

  const handleSubmitSearch = async () => {
    if (searchQuery.trim().length > 0) {
      await saveToHistory(searchQuery);
      
      // Navegar a la pantalla de resultados
      navigation.navigate('SearchResultsScreen', {
        mode: params.mode || 'alquiler',
        location: searchQuery,
        propertyType: propertyType
      });
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

  const handleUseMyLocation = () => {
    // Aquí integrarías con geolocalización
    // navigator.geolocation.getCurrentPosition(...)
    alert('Función de geolocalización - Por implementar');
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
        
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Distrito, ciudad o dirección"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de filtros */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFiltersModal(true)}
        >
          <Feather name="sliders" size={20} color="#1E293B" />
          {countActiveFilters() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{countActiveFilters()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Botón Mi Ubicación */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleUseMyLocation}
        >
          <Feather name="navigation" size={20} color="#2563EB" />
          <Text style={styles.myLocationText}>Usar mi ubicación</Text>
        </TouchableOpacity>

        {/* Search History */}
        {searchQuery.length === 0 && searchHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Limpiar todo</Text>
              </TouchableOpacity>
            </View>
            
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleSelectLocation(item.text)}
              >
                <Feather name="clock" size={20} color="#64748B" />
                <Text style={styles.historyText}>{item.text}</Text>
                <TouchableOpacity
                  onPress={() => removeFromHistory(item.text)}
                  style={styles.removeButton}
                >
                  <Feather name="x" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Results / Suggestions */}
        {searchQuery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filteredLocations.length > 0 ? 'Sugerencias' : 'No se encontraron resultados'}
            </Text>
            
            {filteredLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSelectLocation(location)}
              >
                <Feather name="map-pin" size={20} color="#2563EB" />
                <Text style={styles.suggestionText}>{location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Popular Locations */}
        {searchQuery.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicaciones populares</Text>
            
            <View style={styles.chipsContainer}>
              {POPULAR_LOCATIONS.slice(0, 15).map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => handleSelectLocation(location)}
                >
                  <Text style={styles.chipText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Filtros Avanzados */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Feather name="x" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Tipo de Propiedad */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tipo de Propiedad</Text>
              <View style={styles.propertyTypeGrid}>
                {[
                  { value: 'apartment', label: 'Departamento' },
                  { value: 'house', label: 'Casa' },
                  { value: 'room', label: 'Habitación' },
                  { value: 'studio', label: 'Estudio' },
                  { value: 'office', label: 'Oficina' },
                  { value: 'commercial', label: 'Comercial' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.propertyTypeButton,
                      propertyType === type.value && styles.propertyTypeButtonActive
                    ]}
                    onPress={() => setPropertyType(propertyType === type.value ? '' : type.value)}
                  >
                    <Text style={[
                      styles.propertyTypeText,
                      propertyType === type.value && styles.propertyTypeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rango de Precio */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Rango de Precio (S/)</Text>
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="5000"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* Habitaciones y Baños */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Habitaciones</Text>
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
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Baños</Text>
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

            {/* Área */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Área (m²)</Text>
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Mínima</Text>
                  <TextInput
                    style={styles.input}
                    value={minArea}
                    onChangeText={setMinArea}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.inputLabel}>Máxima</Text>
                  <TextInput
                    style={styles.input}
                    value={maxArea}
                    onChangeText={setMaxArea}
                    placeholder="200"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* Amenidades */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Amenidades</Text>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFurnished(furnished === true ? undefined : true)}
              >
                <View style={[styles.checkbox, furnished === true && styles.checkboxActive]}>
                  {furnished === true && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Amoblado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setVerified(verified === true ? undefined : true)}
              >
                <View style={[styles.checkbox, verified === true && styles.checkboxActive]}>
                  {verified === true && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Verificado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setPetFriendly(petFriendly === true ? undefined : true)}
              >
                <View style={[styles.checkbox, petFriendly === true && styles.checkboxActive]}>
                  {petFriendly === true && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Acepta mascotas</Text>
              </TouchableOpacity>
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
                setMinArea('');
                setMaxArea('');
                setFurnished(undefined);
                setVerified(undefined);
                setPetFriendly(undefined);
              }}
            >
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFiltersModal(false);
                handleSubmitSearch();
              }}
            >
              <Text style={styles.applyFiltersText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SearchScreen;

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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  searchIcon: {
    marginRight: SIZES.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  filterButton: {
    padding: SIZES.sm,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  myLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    gap: SIZES.sm,
  },
  myLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  section: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  clearText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: SIZES.md,
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  removeButton: {
    padding: SIZES.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: SIZES.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
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
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  propertyTypeButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  propertyTypeButtonActive: {
    borderColor: '#5AB0DB',
    backgroundColor: '#EFF6FF',
  },
  propertyTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  propertyTypeTextActive: {
    color: '#2563EB',
    fontWeight: '600',
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
    fontSize: 16,
    color: '#1E293B',
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
    borderColor: '#5AB0DB',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    gap: SIZES.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radius.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1E293B',
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
    flex: 1,
    paddingVertical: SIZES.md,
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
