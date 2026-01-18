import { MAPBOX_ACCESS_TOKEN } from '@/Constants/Env';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface LocationResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [longitude, latitude]
  context?: {
    id: string;
    text: string;
  }[];
}

interface LocationSearchInputProps {
  placeholder?: string;
  value: string;
  onLocationSelect: (location: {
    city: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  placeholder = 'Search location...',
  value,
  onLocationSelect,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  label,
  error,
}) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);
  const isTypingRef = useRef(false);

  // Initialize query from value on mount
  useEffect(() => {
    if (value && !query) {
      setQuery(value);
    }
  }, [value, query]);

  // Sync external value changes - only update when not focused/typing and value changed externally
  // This prevents the input from resetting while the user is typing
  useEffect(() => {
    // Don't sync if user is actively interacting with the input
    if (!isFocused && !isTypingRef.current) {
      // Only sync if the value is actually different
      if (value !== query) {
        setQuery(value);
      }
    }
  }, [value, isFocused, query]);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Mapbox Geocoding API - restricted to India
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?country=IN&types=place,locality,neighborhood,address,poi&limit=8&access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      setResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Location search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = (text: string) => {
    isTypingRef.current = true;
    setQuery(text);
    // Update parent's display value when user types (but don't block typing)
    onChangeText?.(text);

    // Debounce the search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only search if text is long enough
    if (text.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        searchLocations(text);
        isTypingRef.current = false;
      }, 300);
    } else {
      // Clear results if text is too short
      setResults([]);
      setShowResults(false);
      isTypingRef.current = false;
    }
  };

  const handleSelectLocation = (location: LocationResult) => {
    // Extract city from context or use the main text
    let city = location.text;
    let address = location.place_name;

    // Try to get a cleaner city name from context
    if (location.context) {
      const placeContext = location.context.find((c) =>
        c.id.startsWith('place.')
      );
      const localityContext = location.context.find((c) =>
        c.id.startsWith('locality.')
      );
      const districtContext = location.context.find((c) =>
        c.id.startsWith('district.')
      );

      if (placeContext) {
        city = placeContext.text;
      } else if (localityContext) {
        city = localityContext.text;
      } else if (districtContext) {
        city = districtContext.text;
      }
    }

    // Create a cleaner address - remove country and state if present
    const addressParts = location.place_name.split(', ');
    if (addressParts.length > 2) {
      // Remove the last parts (state, country, postal code)
      address = addressParts.slice(0, -2).join(', ');
    }

    // Update query to show the full place name
    const displayValue = location.place_name;
    setQuery(displayValue);
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();

    // Update the parent's display value
    onChangeText?.(displayValue);

    onLocationSelect({
      city,
      address,
      coordinates: {
        lat: location.center[1],
        lng: location.center[0],
      },
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    isTypingRef.current = false;
    // Ensure query is in sync when focusing
    if (query !== value && value) {
      setQuery(value);
    }
    onFocus?.();
    // Show previous results if available
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    isTypingRef.current = false;
    onBlur?.();
    // Delay hiding results to allow tap on result item
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const clearInput = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onChangeText?.('');
    onClear?.(); // Notify parent to clear form data
    inputRef.current?.focus();
  };

  const getLocationIcon = (placeType: string) => {
    if (placeType.includes('poi')) return 'location';
    if (placeType.includes('address')) return 'home';
    if (placeType.includes('neighborhood')) return 'business';
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
            name={getLocationIcon(item.id)}
            size={20}
            color="#00A2FF"
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputError, isFocused && styles.inputFocused]}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? '#00A2FF' : '#999'}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          blurOnSubmit={false}
          caretHidden={false}
        />
        {isLoading && (
          <ActivityIndicator size="small" color="#00A2FF" style={styles.loader} />
        )}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((item) => (
            <View key={item.id}>
              {renderResultItem({ item })}
            </View>
          ))}
        </View>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="location-outline" size={24} color="#999" />
          <Text style={styles.noResultsText}>No locations found in India</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 50,
  },
  inputFocused: {
    borderColor: '#00A2FF',
    backgroundColor: '#FFF',
    shadowColor: '#00A2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1001,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultSubText: {
    fontSize: 13,
    color: '#777',
  },
  noResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 4,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1001,
  },
  noResultsText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
});
