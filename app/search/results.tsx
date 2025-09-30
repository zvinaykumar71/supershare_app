import { RideCard } from '@/components/shared/RideCard';
import { Colors } from '@/Constants/Colors';
import { filters } from '@/data/mockData';
import { useRides } from '@/hooks/useRides';
import { formatDate } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const searchParams = useMemo(() => {
    return {
      from: params.from as string,
      to: params.to as string,
      date: params.date as string, // already formatted YYYY-MM-DD
      seats: Number(params.seats ?? 1),
    } as any;
  }, [params]);

  const { data: rides = [], isLoading } = useRides(searchParams);

  const sortedRides = useMemo(() => {
    let results = rides;
    if (activeFilters.length > 0) {
      results = results.filter((ride: any) => {
        if (activeFilters.includes('verified') && !ride.driver?.isVerified) return false;
        // instant / womenOnly flags may not exist in API; ignore unless present
        if (activeFilters.includes('instant') && (ride as any).instantBooking === false) return false;
        if (activeFilters.includes('womenOnly') && (ride as any).womenOnly === false) return false;
        return true;
      });
    }
    return results;
  }, [rides, activeFilters]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.route}>
            {params.from} → {params.to}
          </Text>
          <Text style={styles.date}>
            {formatDate(new Date(params.date as string))} • {params.seats} seat{params.seats !== '1' ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.filtersContainer} horizontal showsHorizontalScrollIndicator={false}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filter,
              activeFilters.includes(filter.id) && styles.filterActive
            ]}
            onPress={() => toggleFilter(filter.id)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={16} 
              color={activeFilters.includes(filter.id) ? Colors.primary : Colors.gray} 
            />
            <Text style={[
              styles.filterText,
              activeFilters.includes(filter.id) && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {sortedRides.length} ride{sortedRides.length !== 1 ? 's' : ''} found
            </Text>

            {sortedRides.map((ride: any) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onPress={() => router.push(`/ride/${ride.id}`)}
              />
            ))}

            {sortedRides.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search" size={48} 
                color={Colors.gray}
                 />
                <Text style={styles.noResultsText}>No rides found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search criteria</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  backButton: {
    marginRight: 15,
  },
  route: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginRight: 10,
    gap: 5,
  },
  filterActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightPrimary,
  },
  filterText: {
    color: Colors.gray,
    fontSize: 14,
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsCount: {
    fontSize: 16,
    marginBottom: 15,
    color: Colors.gray,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  noResultsSubtext: {
    color: Colors.gray,
    textAlign: 'center',
  },
  loaderContainer: {
    padding: 40,
  },
});