import { BookingCard } from '@/components/shared/BookingCard';
import { BookingRequestCard } from '@/components/shared/BookingRequestCard';
import { RideCard } from '@/components/shared/RideCard';
import { Colors } from '@/Constants/Colors';
import { useAcceptBooking, usePassengerBookingRequests, useRejectBooking, useUserBookings } from '@/hooks/useBookings';
// import { useCurrentRideRequests } from '@/hooks/useCurrentRideRequests';
// import { usePassengerBookingRequests } from '@/hooks/usePassengerBookingRequests';
import { PassengerBookingCard } from '@/components/shared/PassengerBookingCard';
import { useCurrentRideRequests, useDriverRides } from '@/hooks/useRides';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function MyRidesScreen() {
  const { user } = useAuth();

  // Offered rides for drivers should call GET /rides (driver's own offers)
  const { data: offeredRides = [], isLoading: isLoadingOffered, refetch: refetchOffered, isRefetching: isRefetchingOffered } = useDriverRides();
  const { data:  bookingsData, isLoading: isLoadingBooked, refetch: refetchBooked, isRefetching: isRefetchingBooked } = useUserBookings();
  const { data: currentRideData, isLoading: isLoadingCurrentRide, refetch: refetchCurrentRide, isRefetching: isRefetchingCurrentRide } = useCurrentRideRequests();
  const bookedRides = useMemo(() => bookingsData?.asPassenger || [], [bookingsData]);
  const driverRequests = useMemo(() => (bookingsData?.asDriver || []).filter((b: any) => b.status === 'pending'), [bookingsData]);
  const currentRideRequests = currentRideData?.bookingRequests || [];

  // Add passenger requests hook
  const { data: passengerRequestsData, isLoading: isLoadingPassengerRequests, refetch: refetchPassengerRequests, isRefetching: isRefetchingPassengerRequests } = usePassengerBookingRequests();
  const passengerRequests = passengerRequestsData?.bookingRequests || [];

  const [activeTab, setActiveTab] = useState<'offered' | 'booked' | 'requests' | 'passengerRequests'>(user?.isDriver ? 'offered' : 'booked');
  const [refreshing, setRefreshing] = useState(false);

  const isDriver = !!user?.isDriver;

  const isLoading = activeTab === 'offered'
    ? isLoadingOffered
    : activeTab === 'booked'
    ? isLoadingBooked
    : activeTab === 'requests'
    ? isLoadingCurrentRide
    : isLoadingPassengerRequests;

  const isRefetching = activeTab === 'offered'
    ? isRefetchingOffered
    : activeTab === 'booked'
    ? isRefetchingBooked
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
      if (activeTab === 'offered') {
        await refetchOffered();
      } else if (activeTab === 'booked') {
        await refetchBooked();
      } else if (activeTab === 'requests') {
        await refetchCurrentRide();
      } else {
        await refetchPassengerRequests();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchBooked, refetchOffered, refetchCurrentRide, refetchPassengerRequests]);

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
        {isDriver && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('offered')} style={[styles.tabButton, activeTab === 'offered' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'offered' && styles.tabTextActive]}>Offered</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('booked')} style={[styles.tabButton, activeTab === 'booked' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'booked' && styles.tabTextActive]}>Booked</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('requests')} style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Requests</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isDriver && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('booked')} style={[styles.tabButton, activeTab === 'booked' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'booked' && styles.tabTextActive]}>Booked</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('passengerRequests')} style={[styles.tabButton, activeTab === 'passengerRequests' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, activeTab === 'passengerRequests' && styles.tabTextActive]}>Requests</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (activeTab === 'offered'
        ? offeredRides.length === 0
        : activeTab === 'booked'
        ? bookedRides.length === 0
        : activeTab === 'requests'
        ? currentRideRequests.length === 0
        : passengerRequests.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'offered'
              ? 'Create your first ride to see it here.'
              : activeTab === 'booked'
              ? 'Book your first ride to see it here.'
              : activeTab === 'requests'
              ? 'No pending requests right now.'
              : 'No booking requests yet.'}
          </Text>
          {activeTab === 'offered' && isDriver && (
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/ride/create')}>
              <Text style={styles.ctaText}>Offer a ride</Text>
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
                <BookingCard key={booking.id} booking={booking} style={styles.card} />
              ))}
            </>
          )}
          {activeTab === 'requests' && (
            <>
              {currentRideRequests.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id}
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
                  key={booking.id}
                  booking={booking}
                  style={styles.card}
                  // Optionally, add cancel handler here if needed
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
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tabButton: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  loaderContainer: {
    padding: 40,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
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
