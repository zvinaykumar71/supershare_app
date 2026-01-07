import { ActiveRideCard } from '@/components/shared/ActiveRideCard';
import { RideCard } from '@/components/shared/RideCard';
import { SearchForm } from '@/components/shared/SearchForm';
import { Colors } from '@/Constants/Colors';
import { useAllRides } from '@/hooks/useRides';
import { usePassengerActiveRides } from '@/hooks/useTracking';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useUserMode } from '../../hooks/useDriverActiveRide';

export default function HomeScreen() {
  const { user } = useAuth();
  const { mode, canOfferRide, showDriverFeatures, hasActiveRide, activeRide, isLoading: isModeLoading, refetch: refetchMode } = useUserMode();
  const { data: allRides = [], isLoading: isLoadingRides, refetch: refetchRides, isRefetching } = useAllRides();
  const { data: passengerActiveRidesData, refetch: refetchPassengerRides } = usePassengerActiveRides();
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date(),
    passengers: 1,
  });

  const passengerActiveRides = passengerActiveRidesData?.activeRides || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMode(), refetchRides(), refetchPassengerRides()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    const d = searchParams.date instanceof Date ? searchParams.date : new Date(searchParams.date as any);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    router.push({
      pathname: '/search/results',
      params: {
        from: searchParams.from,
        to: searchParams.to,
        date,
        seats: String(searchParams.passengers),
      },
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello{user?.name ? `, ${user.name}` : ''}</Text>
          {/* Show different subtitle based on mode */}
          {showDriverFeatures ? (
            <Text style={styles.subtitle}>Manage your active ride</Text>
          ) : (
            <Text style={styles.subtitle}>Where are you going today?</Text>
          )}
          
          {/* Show mode indicator for drivers */}
          {user?.isDriver && (
            <View style={styles.modeIndicator}>
              <Ionicons 
                name={showDriverFeatures ? "car" : "person"} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.modeText}>
                {showDriverFeatures ? "Driver Mode" : "Passenger Mode"}
              </Text>
            </View>
          )}
          
          {/* Show "Offer a ride" button only when driver has NO active ride */}
          {canOfferRide && (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/ride/create')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.headerButtonText}>Offer a ride</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Show active ride info when driver has active ride */}
          {showDriverFeatures && activeRide && (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={[styles.headerButton, styles.activeRideButton]}
                onPress={() => router.push(`/ride/${activeRide.id || activeRide._id}`)}
              >
                <Ionicons name="car" size={18} color={Colors.primary} />
                <Text style={styles.activeRideButtonText}>View Active Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: ((user as any)?.avatar) || 'https://picsum.photos/200' }} 
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* Show search form only for passenger mode (not when driver has active ride) */}
      {!showDriverFeatures && (
        <View style={styles.searchContainer}>
          <SearchForm
            values={searchParams}
            onChange={setSearchParams}
            onSubmit={handleSearch}
          />
        </View>
      )}

      {/* Show passenger's active rides (confirmed bookings) */}
      {!showDriverFeatures && passengerActiveRides.length > 0 && (
        <View style={styles.activeRidesSection}>
          <Text style={styles.activeRidesSectionTitle}>Your Active Rides</Text>
          {passengerActiveRides.map((item: any) => (
            <ActiveRideCard
              key={item.booking._id}
              ride={item.ride}
              booking={item.booking}
              tracking={item.tracking}
              isDriver={false}
            />
          ))}
        </View>
      )}
      
      {/* Show active ride management section for drivers with active ride */}
      {showDriverFeatures && activeRide && (
        <View style={styles.activeRideContainer}>
          <View style={styles.activeRideCard}>
            <View style={styles.activeRideHeader}>
              <Ionicons name="car" size={24} color={Colors.primary} />
              <Text style={styles.activeRideTitle}>Your Active Ride</Text>
            </View>
            <View style={styles.activeRideRoute}>
              <Text style={styles.activeRideCity}>{activeRide.from?.city || 'Origin'}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.gray} />
              <Text style={styles.activeRideCity}>{activeRide.to?.city || 'Destination'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.manageRideButton}
              onPress={() => router.push(`/ride/${activeRide.id || activeRide._id}`)}
            >
              <Text style={styles.manageRideButtonText}>Manage Ride & Requests</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Show available rides section only for passenger mode */}
      {!showDriverFeatures && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available rides</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>Search all</Text>
            </TouchableOpacity>
          </View>

          {isLoadingRides ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : allRides.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {allRides.slice(0, 5).map((ride: any) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  style={styles.horizontalCard}
                  onPress={() => router.push(`/ride/${ride.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyRides}>
              <Ionicons name="car-outline" size={40} color={Colors.gray} />
              <Text style={styles.emptyRidesText}>No rides available</Text>
              <Text style={styles.emptyRidesSubtext}>Check back later or search for specific routes</Text>
            </View>
          )}
        </View>
      )}

      {/* Show more rides section only for passenger mode */}
      {!showDriverFeatures && allRides.length > 5 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More rides</Text>
          </View>
          
          {allRides.slice(5, 8).map((ride: any) => (
            <RideCard 
              key={ride.id} 
              ride={ride} 
              style={styles.verticalCard}
              onPress={() => router.push(`/ride/${ride.id}`)}
            />
          ))}
        </View>
      )}
      
      {/* Show driver tips when in driver mode */}
      {showDriverFeatures && (
        <View style={styles.section}>
          <View style={styles.driverTipsCard}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <View style={styles.driverTipsContent}>
              <Text style={styles.driverTipsTitle}>Driver Mode Active</Text>
              <Text style={styles.driverTipsText}>
                You have an active ride. Manage booking requests and track your ride from the "My Rides" tab.
              </Text>
              <Text style={styles.driverTipsText}>
                Once your ride is completed, you'll return to passenger mode and can search for rides or offer a new one.
              </Text>
            </View>
          </View>
        </View>
      )}

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchContainer: {
    padding: 20,
    marginTop: -20,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: Colors.primary,
    fontWeight: '500',
  },
  horizontalScroll: {
    marginHorizontal: -20,
  },
  horizontalCard: {
    width: 300,
    marginRight: 15,
  },
  verticalCard: {
    marginBottom: 15,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  headerButtonSecondary: {
    backgroundColor: 'white',
  },
  headerButtonTextSecondary: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  activeRideButton: {
    backgroundColor: 'white',
  },
  activeRideButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeRideContainer: {
    padding: 20,
    marginTop: -20,
  },
  activeRideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  activeRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightGray,
  },
  activeRideCity: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  manageRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  manageRideButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  driverTipsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  driverTipsContent: {
    flex: 1,
  },
  driverTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  driverTipsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyRides: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  emptyRidesText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: Colors.text,
  },
  emptyRidesSubtext: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  activeRidesSection: {
    paddingTop: 10,
  },
  activeRidesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
    marginBottom: 5,
  },
});