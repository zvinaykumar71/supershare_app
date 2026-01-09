import { ActiveRideCard } from '@/components/shared/ActiveRideCard';
import { BookingRequestCard } from '@/components/shared/BookingRequestCard';
import { RideCard } from '@/components/shared/RideCard';
import { SearchForm } from '@/components/shared/SearchForm';
import { Colors } from '@/Constants/Colors';
import { useAcceptBooking, useRejectBooking } from '@/hooks/useBookings';
import { useAllRides, useRideBookingRequests } from '@/hooks/useRides';
import { usePassengerActiveRides, useStartRide } from '@/hooks/useTracking';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  // Get ride ID for booking requests
  const rideId = activeRide?.id || activeRide?._id;
  
  // Fetch booking requests for driver's active ride
  const { data: bookingRequestsData, isLoading: isLoadingRequests, refetch: refetchBookingRequests } = useRideBookingRequests(rideId || '');
  
  // Booking actions
  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const { mutate: rejectBooking, isPending: isRejecting } = useRejectBooking();
  const { mutate: startRide, isPending: isStarting } = useStartRide();

  const passengerActiveRides = passengerActiveRidesData?.activeRides || [];
  
  // Check if ride can be started - show button when there are booked seats
  const confirmedBookings = bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'confirmed') || [];
  const bookedSeats = bookingRequestsData?.rideDetails?.bookedSeats ?? 0;
  const canStartRide = showDriverFeatures && bookedSeats > 0 && activeRide?.rideStatus !== 'in_progress' && activeRide?.rideStatus !== 'completed';
  const isRideInProgress = activeRide?.rideStatus === 'in_progress';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMode(), refetchRides(), refetchPassengerRides(), refetchBookingRequests()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = (bookingId: string) => {
    const booking = bookingRequestsData?.bookingRequests?.find((b: any) => b._id === bookingId || b.id === bookingId);
    const requestedSeats = booking?.seats || 1;
    const availableSeats = bookingRequestsData?.rideDetails?.availableSeats ?? activeRide?.availableSeats ?? 0;
    
    if (availableSeats < requestedSeats) {
      Alert.alert("Cannot Accept", `Not enough seats. Requested: ${requestedSeats}, Available: ${availableSeats}`);
      return;
    }
    
    Alert.alert("Accept Booking", `Accept booking for ${requestedSeats} seat(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          (acceptBooking as any)(bookingId, {
            onSuccess: () => Alert.alert("Success", "Booking accepted!"),
            onError: (error: any) => Alert.alert("Error", error.response?.data?.message || "Failed to accept")
          });
        }
      }
    ]);
  };

  const handleReject = (bookingId: string) => {
    Alert.alert("Reject Booking", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          (rejectBooking as any)(bookingId, {
            onSuccess: () => Alert.alert("Success", "Booking rejected!"),
            onError: (error: any) => Alert.alert("Error", error.response?.data?.message || "Failed to reject")
          });
        }
      }
    ]);
  };

  const handleStartRide = () => {
    if (!rideId) return;
    Alert.alert("Start Ride", `Start ride with ${bookedSeats} booked seat(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          startRide({ rideId }, {
            onSuccess: () => {
              Alert.alert("Success", "Ride started!", [
                { text: "Go to Active Ride", onPress: () => router.push({ pathname: '/ride/active', params: { rideId } }) }
              ]);
            },
            onError: (error: any) => Alert.alert("Error", error.response?.data?.message || "Failed to start ride")
          });
        }
      }
    ]);
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
          {/* Route Card */}
          <View style={styles.routeCard}>
            <View style={styles.route}>
              <View style={styles.routeTimeline}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDot} />
              </View>
              
              <View style={styles.routeDetails}>
                <View style={styles.locationItem}>
                  <Text style={styles.timeText}>{formatTime(activeRide.departureTime)}</Text>
                  <Text style={styles.cityText}>{activeRide.from?.city || 'Origin'}</Text>
                  <Text style={styles.addressText}>{activeRide.from?.address}</Text>
                </View>
                
                <View style={styles.durationRow}>
                  <Text style={styles.durationText}>{activeRide.duration || '1h 0m'}</Text>
                  <View style={styles.durationLine} />
                </View>
                
                <View style={styles.locationItem}>
                  <Text style={styles.timeText}>{formatTime(activeRide.arrivalTime)}</Text>
                  <Text style={styles.cityText}>{activeRide.to?.city || 'Destination'}</Text>
                  <Text style={styles.addressText}>{activeRide.to?.address}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.rideInfoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={18} color={Colors.gray} />
                <Text style={styles.infoText}>Today</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="pricetag" size={18} color={Colors.gray} />
                <Text style={styles.infoText}>{formatCurrency(activeRide.price)} per seat</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={18} color={Colors.gray} />
                <Text style={styles.infoText}>{bookingRequestsData?.rideDetails?.availableSeats ?? activeRide.availableSeats} of {activeRide.totalSeats} seats available</Text>
              </View>
            </View>
          </View>

          {/* Seat Status Card */}
          <View style={styles.seatStatsCard}>
            <Text style={styles.seatStatsTitle}>Seat Status</Text>
            <View style={styles.seatStatsContainer}>
              <View style={styles.seatStatItem}>
                <View style={[styles.seatStatCircle, styles.availableCircle]}>
                  <Text style={styles.seatStatNumber}>
                    {bookingRequestsData?.rideDetails?.availableSeats ?? activeRide?.availableSeats ?? 0}
                  </Text>
                </View>
                <Text style={styles.seatStatLabel}>Available</Text>
              </View>
              
              <View style={styles.seatStatDivider} />
              
              <View style={styles.seatStatItem}>
                <View style={[styles.seatStatCircle, styles.bookedCircle]}>
                  <Text style={styles.seatStatNumber}>
                    {bookingRequestsData?.rideDetails?.bookedSeats ?? 0}
                  </Text>
                </View>
                <Text style={styles.seatStatLabel}>Booked</Text>
              </View>
              
              <View style={styles.seatStatDivider} />
              
              <View style={styles.seatStatItem}>
                <View style={[styles.seatStatCircle, styles.pendingCircle]}>
                  <Text style={styles.seatStatNumber}>
                    {bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.reduce((sum: number, b: any) => sum + (b.seats || 1), 0) ?? 0}
                  </Text>
                </View>
                <Text style={styles.seatStatLabel}>Pending</Text>
              </View>
              
              <View style={styles.seatStatDivider} />
              
              <View style={styles.seatStatItem}>
                <View style={[styles.seatStatCircle, styles.totalCircle]}>
                  <Text style={styles.seatStatNumber}>
                    {activeRide?.totalSeats ?? 0}
                  </Text>
                </View>
                <Text style={styles.seatStatLabel}>Total</Text>
              </View>
            </View>
            
            {/* Progress bar */}
            <View style={styles.seatProgressContainer}>
              <View style={styles.seatProgressBar}>
                <View 
                  style={[
                    styles.seatProgressBooked, 
                    { width: `${((bookingRequestsData?.rideDetails?.bookedSeats ?? 0) / (activeRide?.totalSeats || 1)) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.seatProgressPending, 
                    { width: `${((bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.reduce((sum: number, b: any) => sum + (b.seats || 1), 0) ?? 0) / (activeRide?.totalSeats || 1)) * 100}%` }
                  ]} 
                />
              </View>
              <View style={styles.seatProgressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.lightGray }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Booking Requests Card */}
          <View style={styles.bookingRequestsCard}>
            <View style={styles.bookingRequestsHeader}>
              <Text style={styles.bookingRequestsTitle}>Booking Requests</Text>
              <View style={styles.requestCountBadge}>
                <Text style={styles.requestCountText}>
                  {bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.length || 0}
                </Text>
              </View>
            </View>
            
            {isLoadingRequests ? (
              <View style={styles.loadingRequests}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : bookingRequestsData?.bookingRequests?.length === 0 ? (
              <View style={styles.emptyRequests}>
                <Ionicons name="people-outline" size={40} color={Colors.gray} />
                <Text style={styles.emptyRequestsText}>No booking requests yet</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {bookingRequestsData?.bookingRequests?.map((booking: any) => (
                  <BookingRequestCard
                    key={booking._id}
                    booking={booking}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isAccepting={isAccepting}
                    isRejecting={isRejecting}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Start Ride Button */}
          {canStartRide && (
            <TouchableOpacity
              style={styles.startRideButton}
              onPress={handleStartRide}
              disabled={isStarting}
            >
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.startRideButtonText}>
                {isStarting ? 'Starting...' : `Start Ride (${bookedSeats} seat${bookedSeats > 1 ? 's' : ''} booked)`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Go to Active Ride Button */}
          {isRideInProgress && (
            <TouchableOpacity
              style={[styles.startRideButton, { backgroundColor: Colors.success }]}
              onPress={() => router.push({ pathname: '/ride/active', params: { rideId } })}
            >
              <Ionicons name="navigate" size={24} color="white" />
              <Text style={styles.startRideButtonText}>Go to Active Ride</Text>
            </TouchableOpacity>
          )}
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
  // Route Card Styles
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  route: {
    flexDirection: 'row',
  },
  routeTimeline: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: Colors.lightGray,
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
  },
  locationItem: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  addressText: {
    fontSize: 13,
    color: Colors.gray,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: -22,
  },
  durationText: {
    fontSize: 13,
    color: Colors.gray,
    marginRight: 8,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  rideInfoRow: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray,
  },
  // Seat Stats Styles
  seatStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seatStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  seatStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  seatStatItem: {
    alignItems: 'center',
  },
  seatStatCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  availableCircle: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bookedCircle: {
    backgroundColor: Colors.success + '20',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  pendingCircle: {
    backgroundColor: Colors.warning + '20',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  totalCircle: {
    backgroundColor: Colors.gray + '20',
    borderWidth: 2,
    borderColor: Colors.gray,
  },
  seatStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seatStatLabel: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '500',
  },
  seatStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: Colors.lightGray,
  },
  seatProgressContainer: {
    marginTop: 4,
  },
  seatProgressBar: {
    height: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  seatProgressBooked: {
    backgroundColor: Colors.success,
    height: '100%',
  },
  seatProgressPending: {
    backgroundColor: Colors.warning,
    height: '100%',
  },
  seatProgressLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.gray,
  },
  // Booking Requests Styles
  bookingRequestsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingRequestsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  requestCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  requestCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingRequests: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    color: Colors.gray,
    fontSize: 13,
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRequestsText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 8,
  },
  requestsList: {
    gap: 10,
  },
  startRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  startRideButtonText: {
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