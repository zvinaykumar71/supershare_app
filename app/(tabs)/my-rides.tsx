import { BookingCard } from '@/components/shared/BookingCard';
import { BookingRequestCard } from '@/components/shared/BookingRequestCard';
import { PassengerBookingCard } from '@/components/shared/PassengerBookingCard';
import { RideCard } from '@/components/shared/RideCard';
import { Colors } from '@/Constants/Colors';
import { useAcceptBooking, usePassengerBookingRequests, useRejectBooking, useUserBookings } from '@/hooks/useBookings';
import { useUserMode } from '@/hooks/useDriverActiveRide';
import { useCurrentRideRequests, useDriverRides } from '@/hooks/useRides';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function MyRidesScreen() {
  const { user } = useAuth();
  const { mode, hasActiveRide, activeRide, showDriverFeatures, showPassengerFeatures, canOfferRide, isLoading: isModeLoading, refetch: refetchMode } = useUserMode();

  // Offered rides for drivers should call GET /rides (driver's own offers)
  const { data: offeredRides = [], isLoading: isLoadingOffered, refetch: refetchOffered, isRefetching: isRefetchingOffered } = useDriverRides();
  const { data:  bookingsData, isLoading: isLoadingBooked, refetch: refetchBooked, isRefetching: isRefetchingBooked } = useUserBookings();
  const { data: currentRideData, isLoading: isLoadingCurrentRide, refetch: refetchCurrentRide, isRefetching: isRefetchingCurrentRide } = useCurrentRideRequests();
  // Separate confirmed (active) rides from pending bookings for passengers
  // Active rides = bookings with status 'confirmed' OR 'accepted' (driver accepted the booking)
  const allPassengerBookings = useMemo(() => bookingsData?.asPassenger || [], [bookingsData]);
  const confirmedRides = useMemo(() => allPassengerBookings.filter((b: any) => 
    b.status === 'confirmed' || b.status === 'accepted'
  ), [allPassengerBookings]);
  const pendingBookings = useMemo(() => allPassengerBookings.filter((b: any) => b.status === 'pending'), [allPassengerBookings]);
  const bookedRides = allPassengerBookings; // Keep for backward compatibility
  const driverRequests = useMemo(() => (bookingsData?.asDriver || []).filter((b: any) => b.status === 'pending'), [bookingsData]);
  const currentRideRequests = currentRideData?.bookingRequests || [];

  // Add passenger requests hook
  const { data: passengerRequestsData, isLoading: isLoadingPassengerRequests, refetch: refetchPassengerRequests, isRefetching: isRefetchingPassengerRequests } = usePassengerBookingRequests();
  // Filter only pending requests for the "Requests" tab (confirmed ones go to "Active" tab)
  const allPassengerRequests = passengerRequestsData?.bookingRequests || [];
  const passengerRequests = useMemo(() => 
    allPassengerRequests.filter((b: any) => b.status === 'pending'), 
    [allPassengerRequests]
  );
  
  // Get confirmed/accepted rides from passenger requests data as well
  const acceptedFromRequests = useMemo(() => 
    allPassengerRequests.filter((b: any) => b.status === 'confirmed' || b.status === 'accepted'),
    [allPassengerRequests]
  );
  
  // Combine confirmed rides from both sources (avoid duplicates by id)
  const allActiveRides = useMemo(() => {
    const rideIds = new Set(confirmedRides.map((r: any) => r.id || r._id));
    const additionalRides = acceptedFromRequests.filter((r: any) => !rideIds.has(r.id || r._id));
    return [...confirmedRides, ...additionalRides];
  }, [confirmedRides, acceptedFromRequests]);

  // Check if any active ride is in progress (for polling)
  const hasRideInProgress = useMemo(() => {
    return allActiveRides.some((b: any) => b.ride?.rideStatus === 'in_progress');
  }, [allActiveRides]);

  // Set default tab based on mode
  // Driver with active ride: show 'requests' tab by default
  // Driver without active ride or regular user: show 'activeRides' tab by default
  const getDefaultTab = () => {
    if (showDriverFeatures) return 'requests';
    return 'activeRides';
  };

  const [activeTab, setActiveTab] = useState<'offered' | 'booked' | 'requests' | 'passengerRequests' | 'activeRides'>(getDefaultTab());
  const [refreshing, setRefreshing] = useState(false);

  // Polling for real-time updates when ride is in progress
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Start polling when on activeRides tab and there's a ride in progress
    if (activeTab === 'activeRides' && hasRideInProgress) {
      pollingIntervalRef.current = setInterval(() => {
        refetchBooked();
        refetchPassengerRequests();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeTab, hasRideInProgress, refetchBooked, refetchPassengerRequests]);

  const isDriver = !!user?.isDriver;

  // Update active tab when mode changes
  useEffect(() => {
    if (showDriverFeatures && activeTab !== 'requests' && activeTab !== 'offered') {
      setActiveTab('requests');
    } else if (!showDriverFeatures && (activeTab === 'requests' || activeTab === 'offered')) {
      setActiveTab('activeRides');
    }
  }, [showDriverFeatures]);

  const isLoading = activeTab === 'offered'
    ? isLoadingOffered
    : activeTab === 'booked'
    ? isLoadingBooked
    : activeTab === 'activeRides'
    ? isLoadingBooked || isLoadingPassengerRequests
    : activeTab === 'requests'
    ? isLoadingCurrentRide
    : isLoadingPassengerRequests;

  const isRefetching = activeTab === 'offered'
    ? isRefetchingOffered
    : activeTab === 'booked'
    ? isRefetchingBooked
    : activeTab === 'activeRides'
    ? isRefetchingBooked || isRefetchingPassengerRequests
    : activeTab === 'requests'
    ? isRefetchingCurrentRide
    : isRefetchingPassengerRequests;

  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const { mutate: rejectBooking, isPending: isRejecting } = useRejectBooking();

  const handleAccept = (id: string) => {
    (acceptBooking as unknown as (id: string, options?: any) => void)(id, { onSuccess: () => refetchBooked() });
  };

  const handleReject = (id: string) => {
    (rejectBooking as unknown as (id: string, options?: any) => void)(id, { onSuccess: () => refetchBooked() });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Always refresh mode status
      await refetchMode();
      
      if (activeTab === 'offered') {
        await refetchOffered();
      } else if (activeTab === 'booked' || activeTab === 'activeRides') {
        // Refresh both sources for active rides (bookings + passenger requests)
        await Promise.all([refetchBooked(), refetchPassengerRequests()]);
      } else if (activeTab === 'requests') {
        await refetchCurrentRide();
      } else {
        await refetchPassengerRequests();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchBooked, refetchOffered, refetchCurrentRide, refetchPassengerRequests, refetchMode]);

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
        
        {/* Mode indicator */}
        {isDriver && (
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
        
        {/* DRIVER WITH ACTIVE RIDE: Show only driver-related tabs */}
        {showDriverFeatures && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('requests')} style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Booking Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('offered')} style={[styles.tabButton, activeTab === 'offered' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'offered' && styles.tabTextActive]}>Active Ride</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* DRIVER WITHOUT ACTIVE RIDE: Show passenger tabs + offer ride option */}
        {isDriver && !showDriverFeatures && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('activeRides')} style={[styles.tabButton, activeTab === 'activeRides' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'activeRides' && styles.tabTextActive]}>Active</Text>
              {allActiveRides.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{allActiveRides.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('passengerRequests')} style={[styles.tabButton, activeTab === 'passengerRequests' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'passengerRequests' && styles.tabTextActive]}>Requests</Text>
              {passengerRequests.length > 0 && (
                <View style={styles.tabBadgePending}>
                  <Text style={styles.tabBadgeText}>{passengerRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* REGULAR USER (not a driver): Show only passenger tabs */}
        {!isDriver && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('activeRides')} style={[styles.tabButton, activeTab === 'activeRides' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'activeRides' && styles.tabTextActive]}>Active</Text>
              {allActiveRides.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{allActiveRides.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('passengerRequests')} style={[styles.tabButton, activeTab === 'passengerRequests' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'passengerRequests' && styles.tabTextActive]}>Requests</Text>
              {passengerRequests.length > 0 && (
                <View style={styles.tabBadgePending}>
                  <Text style={styles.tabBadgeText}>{passengerRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Active Ride Banner for drivers with active ride */}
      {showDriverFeatures && activeRide && (
        <View style={styles.activeRideBanner}>
          <View style={styles.activeRideBannerContent}>
            <Ionicons name="car" size={20} color={Colors.primary} />
            <View style={styles.activeRideBannerText}>
              <Text style={styles.activeRideBannerTitle}>Active Ride</Text>
              <Text style={styles.activeRideBannerRoute}>
                {activeRide.from?.city || 'Origin'} → {activeRide.to?.city || 'Destination'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.activeRideBannerButton}
            onPress={() => router.push(`/ride/${activeRide.id || activeRide._id}`)}
          >
            <Text style={styles.activeRideBannerButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Offer Ride Button for drivers without active ride */}
      {canOfferRide && (
        <TouchableOpacity 
          style={styles.offerRideBanner}
          onPress={() => router.push('/ride/create')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.offerRideBannerText}>Offer a New Ride</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (activeTab === 'offered'
        ? offeredRides.length === 0
        : activeTab === 'booked'
        ? bookedRides.length === 0
        : activeTab === 'activeRides'
        ? allActiveRides.length === 0
        : activeTab === 'requests'
        ? currentRideRequests.length === 0
        : passengerRequests.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'activeRides' ? 'car-outline' : activeTab === 'passengerRequests' ? 'time-outline' : 'document-outline'} 
            size={48} 
            color={Colors.gray} 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'activeRides' ? 'No active rides' : 'No rides yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'offered'
              ? 'Create your first ride to see it here.'
              : activeTab === 'booked'
              ? 'Book your first ride to see it here.'
              : activeTab === 'activeRides'
              ? 'When your booking is confirmed, your active rides will appear here.'
              : activeTab === 'requests'
              ? 'No pending requests right now.'
              : 'Your pending booking requests will appear here.'}
          </Text>
          {activeTab === 'offered' && isDriver && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/ride/create')}>
              <Text style={styles.ctaText}>Offer a ride</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'activeRides' && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.ctaText}>Search for rides</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {activeTab === 'offered' && (
            <>
              {offeredRides.map((ride: any) => (
                <RideCard key={ride.id} ride={ride} onPress={() => router.push(`/ride/${ride.id}`)} style={styles.card} />
              ))}
            </>
          )}
          {activeTab === 'booked' && (
            <>
              {bookedRides.map((booking: any) => (
                <BookingCard key={booking.id || booking._id} booking={booking} style={styles.card} />
              ))}
            </>
          )}
          {activeTab === 'activeRides' && (
            <>
              {allActiveRides.map((booking: any) => (
                <PassengerBookingCard
                  key={booking.id || booking._id}
                  booking={booking}
                  style={styles.card}
                  showStatus={true}
                />
              ))}
            </>
          )}
          {activeTab === 'requests' && (
            <>
              {currentRideRequests.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id || booking._id}
                  booking={booking}
                  style={styles.card}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isAccepting={isAccepting}
                  isRejecting={isRejecting}
                />
              ))}
            </>
          )}
          {activeTab === 'passengerRequests' && (
            <>
              {passengerRequests.map((booking: any) => (
                <PassengerBookingCard
                  key={booking.id || booking._id}
                  booking={booking}
                  style={styles.card}
                />
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.success,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgePending: {
    backgroundColor: Colors.warning,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  activeRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightPrimary,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  activeRideBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeRideBannerText: {
    flex: 1,
  },
  activeRideBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  activeRideBannerRoute: {
    fontSize: 12,
    color: Colors.text,
  },
  activeRideBannerButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeRideBannerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  offerRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
  },
  offerRideBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  loaderContainer: {
    padding: 40,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
});
