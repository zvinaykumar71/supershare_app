import { RideCard } from '@/components/shared/RideCard';
import { RideMapView } from '@/components/shared/RideMapView';
import { Colors } from '@/Constants/Colors';
import { filters } from '@/data/mockData';
import { useRides } from '@/hooks/useRides';
import { formatDate } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ViewMode = 'list' | 'map';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const searchParams = useMemo(() => {
    return {
      from: params.from as string,
      to: params.to as string,
      date: params.date as string,
      seats: Number(params.seats ?? 1),
    } as any;
  }, [params]);

  const { data: rides = [], isLoading, refetch, isRefetching } = useRides(searchParams);

  const sortedRides = useMemo(() => {
    let results = rides;
    if (activeFilters.length > 0) {
      results = results.filter((ride: any) => {
        if (activeFilters.includes('verified') && !ride.driver?.isVerified) return false;
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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.route}>
            {params.from} → {params.to}
          </Text>
          <Text style={styles.date}>
            {formatDate(new Date(params.date as string))} • {params.seats} seat{params.seats !== '1' ? 's' : ''}
          </Text>
        </View>
        
        {/* View Toggle Button */}
        <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
          <Ionicons 
            name={viewMode === 'list' ? 'map' : 'list'} 
            size={22} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* View Mode Tabs */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity 
          style={[styles.viewModeTab, viewMode === 'list' && styles.viewModeTabActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={viewMode === 'list' ? Colors.primary : Colors.gray} 
          />
          <Text style={[styles.viewModeTabText, viewMode === 'list' && styles.viewModeTabTextActive]}>
            List View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.viewModeTab, viewMode === 'map' && styles.viewModeTabActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons 
            name="map" 
            size={18} 
            color={viewMode === 'map' ? Colors.primary : Colors.gray} 
          />
          <Text style={[styles.viewModeTabText, viewMode === 'map' && styles.viewModeTabTextActive]}>
            Map View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView 
        style={styles.filtersContainer} 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
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

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching for rides...</Text>
        </View>
      ) : viewMode === 'list' ? (
        /* List View */
        <ScrollView style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {sortedRides.length} ride{sortedRides.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
              <Ionicons 
                name="refresh" 
                size={18} 
                color={Colors.primary} 
                style={isRefetching ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>

          {sortedRides.length > 0 ? (
            sortedRides.map((ride: any) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onPress={() => router.push(`/ride/${ride.id}`)}
                style={styles.rideCard}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <View style={styles.noResultsIcon}>
                <Ionicons name="search" size={48} color={Colors.gray} />
              </View>
              <Text style={styles.noResultsText}>No rides found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search criteria or check back later
              </Text>
              <TouchableOpacity style={styles.searchAgainButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color={Colors.primary} />
                <Text style={styles.searchAgainText}>Modify Search</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* Map View */
        <View style={styles.mapContainer}>
          {sortedRides.length > 0 ? (
            <RideMapView 
              rides={sortedRides}
              fromCity={params.from as string}
              toCity={params.to as string}
            />
          ) : (
            <View style={styles.noResultsMap}>
              <Ionicons name="location-outline" size={48} color={Colors.gray} />
              <Text style={styles.noResultsText}>No rides to display on map</Text>
              <TouchableOpacity 
                style={styles.switchToListButton}
                onPress={() => setViewMode('list')}
              >
                <Text style={styles.switchToListText}>Switch to List View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
    padding: 16,
    paddingTop: 56,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  route: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  viewToggle: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  viewModeTabActive: {
    backgroundColor: Colors.lightPrimary,
  },
  viewModeTabText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  viewModeTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    maxHeight: 56,
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginHorizontal: 4,
    gap: 6,
  },
  filterActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightPrimary,
  },
  filterText: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 15,
    color: Colors.gray,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    opacity: 0.5,
  },
  rideCard: {
    marginBottom: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noResultsIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: Colors.gray,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  searchAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  searchAgainText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  mapContainer: {
    flex: 1,
  },
  noResultsMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.lightGray,
  },
  switchToListButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  switchToListText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});
