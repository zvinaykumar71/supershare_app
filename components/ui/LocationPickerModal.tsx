import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAPBOX_ACCESS_TOKEN } from '@/Constants/Env';
import { Colors } from '@/Constants/Colors';

interface LocationResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  place_type: string[];
  context?: {
    id: string;
    text: string;
  }[];
}

interface RecentSearch {
  id: string;
  name: string;
  address: string;
  timestamp: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: { name: string; address: string; coordinates?: { lat: number; lng: number } }) => void;
  placeholder?: string;
  title?: string;
  recentSearches?: RecentSearch[];
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  placeholder = 'Search for a location...',
  title = 'Select Location',
  recentSearches = [],
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const debounceTimer = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
      setLocationError(null);
    }
  }, [visible]);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?country=IN&types=place,locality,neighborhood,address,poi&limit=10&access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      setResults(data.features || []);
    } catch (error) {
      console.error('Location search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = (text: string) => {
    setQuery(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(text);
    }, 300);
  };

  const handleSelectLocation = (location: LocationResult) => {
    let name = location.text;
    let address = location.place_name;

    // Try to get a cleaner city name from context
    if (location.context) {
      const placeContext = location.context.find((c) => c.id.startsWith('place.'));
      const localityContext = location.context.find((c) => c.id.startsWith('locality.'));
      const districtContext = location.context.find((c) => c.id.startsWith('district.'));

      if (placeContext) {
        name = placeContext.text;
      } else if (localityContext) {
        name = localityContext.text;
      } else if (districtContext) {
        name = districtContext.text;
      }
    }

    Keyboard.dismiss();
    onSelect({
      name,
      address,
      coordinates: {
        lat: location.center[1],
        lng: location.center[0],
      },
    });
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setIsGettingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.coords.longitude},${location.coords.latitude}.json?types=place,locality,neighborhood,address&limit=1&access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        let name = feature.text;

        // Try to get city name from context
        if (feature.context) {
          const placeContext = feature.context.find((c: any) => c.id.startsWith('place.'));
          if (placeContext) {
            name = placeContext.text;
          }
        }

        onSelect({
          name,
          address: feature.place_name,
          coordinates: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        });
        onClose();
      } else {
        setLocationError('Could not determine your location');
      }
    } catch (error) {
      console.error('Current location error:', error);
      setLocationError('Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSelectRecent = (recent: RecentSearch) => {
    onSelect({
      name: recent.name,
      address: recent.address,
    });
    onClose();
  };

  const getLocationIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('poi')) return 'business';
    if (placeTypes.includes('address')) return 'home';
    if (placeTypes.includes('neighborhood')) return 'grid';
    if (placeTypes.includes('locality')) return 'location';
    return 'navigate';
  };

  const renderResultItem = ({ item }: { item: LocationResult }) => {
    const placeParts = item.place_name.split(', ');
    const mainText = placeParts[0];
    const subText = placeParts.slice(1).join(', ');

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectLocation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultIcon}>
          <Ionicons
            name={getLocationIcon(item.place_type) as any}
            size={20}
            color="#666"
          />
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={styles.resultMainText} numberOfLines={1}>
            {mainText}
          </Text>
          <Text style={styles.resultSubText} numberOfLines={1}>
            {subText}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  const renderRecentItem = ({ item }: { item: RecentSearch }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectRecent(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="time-outline" size={20} color="#666" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultMainText} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.resultSubText} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleTextChange}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Use Current Location */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={isGettingLocation}
        >
          <View style={styles.currentLocationIcon}>
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="locate" size={22} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.currentLocationText}>
            {isGettingLocation ? 'Getting location...' : 'Use current location'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {locationError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResultItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        )}

        {/* No Results */}
        {!isLoading && query.length >= 2 && results.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.noResultsText}>No locations found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        )}

        {/* Recent Searches (when no query) */}
        {!isLoading && query.length < 2 && recentSearches.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Popular Cities (when no query and no recent) */}
        {!isLoading && query.length < 2 && recentSearches.length === 0 && (
          <View style={styles.popularContainer}>
            <Text style={styles.sectionTitle}>Popular Cities</Text>
            {['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur'].map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.popularItem}
                onPress={() => {
                  setQuery(city);
                  searchLocations(city);
                }}
              >
                <View style={styles.popularIcon}>
                  <Ionicons name="location" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.popularText}>{city}</Text>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  resultsContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultSubText: {
    fontSize: 13,
    color: '#777',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  recentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 12,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  popularIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  popularText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
