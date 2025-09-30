import { BookingRequestCard } from '@/components/shared/BookingRequestCard';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/Constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useAcceptBooking, useRejectBooking, useUserBookings } from '@/hooks/useBookings';
import { useRide } from '@/hooks/useRides';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams();
  const rideId = Array.isArray(id) ? id[0] : id?.toString();
  console.log('ride/[id]: id =', rideId);
  const { data: ride, isLoading } = useRide(rideId || '');
  const { user } = useAuth();
  const { data: bookingsData } = useUserBookings();
  
  // Get booking requests for this specific ride
  const bookingRequests = useMemo(() => {
    if (!bookingsData?.asDriver || !rideId) return [];
    return (bookingsData.asDriver || []).filter((booking: any) => 
      booking.ride?._id === rideId && booking.status === 'pending'
    );
  }, [bookingsData, rideId]);
  
  // Check if current user is the driver of this ride
  const isDriver = user?.isDriver && ride?.driver?.id === user?.id;
  
  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const { mutate: rejectBooking, isPending: isRejecting } = useRejectBooking();
  
  const handleAccept = (bookingId: string) => {
    acceptBooking(bookingId as any);
  };
  
  const handleReject = (bookingId: string) => {
    rejectBooking(bookingId as any);
  };


  


  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text>Ride not found</Text>
      </View>
    );
  }

  const handleBookRide = () => {
    router.push({ pathname: '/ride/book', params: { id: ride.id } });
  };

  const handleContactDriver = () => {
    Linking.openURL(`tel:${ride.driver.phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride details</Text>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.route}>
          <View style={styles.routeTimeline}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineLine} />
            <View style={styles.timelineDot} />
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.location}>
              <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
              <Text style={styles.city}>{ride.from.city}</Text>
              <Text style={styles.address}>{ride.from.address}</Text>
            </View>
            
            <View style={styles.duration}>
              <Text style={styles.durationText}>{ride.duration}</Text>
              <View style={styles.durationLine} />
            </View>
            
            <View style={styles.location}>
              <Text style={styles.time}>{formatTime(ride.arrivalTime)}</Text>
              <Text style={styles.city}>{ride.to.city}</Text>
              <Text style={styles.address}>{ride.to.address}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.rideInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20}
            color={Colors.gray}
              />
            <Text style={styles.infoText}>{formatDate(ride.date)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="pricetag" size={20} 
            color={Colors.gray}
             />
            <Text style={styles.infoText}>{formatCurrency(ride.price)} per seat</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20}
            color={Colors.gray} 
             />
            <Text style={styles.infoText}>{ride.availableSeats} of {ride.totalSeats} seats available</Text>
          </View>
        </View>
      </View>

      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <Image source={{ uri: ride.driver.avatar }} style={styles.driverAvatar} />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.driver.name}</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} 
              color={Colors.warning}
               />
              <Text style={styles.ratingText}>{ride.driver.rating} • {ride.driver.trips} trips</Text>
            </View>
          </View>
          {ride.driver.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          )}
        </View>
        
        <Text style={styles.driverBio}>{ride.driver.bio}</Text>
        
        <View style={styles.carInfo}>
          <Ionicons name="car" size={20}
          color={Colors.gray}
           />
          <Text style={styles.carText}>{ride.car.model} • {ride.car.color} • {ride.car.plate}</Text>
        </View>
        
        <TouchableOpacity style={styles.contactButton} onPress={handleContactDriver}>
          <Ionicons name="call" size={20}
          color={Colors.primary} 
           />
          <Text style={styles.contactText}>Contact driver</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Requests Section - Only show for drivers */}
      {isDriver && (
        <View style={styles.bookingRequestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Requests</Text>
            <View style={styles.requestCount}>
              <Text style={styles.requestCountText}>{bookingRequests.length}</Text>
            </View>
          </View>
          
          {bookingRequests.length === 0 ? (
            <View style={styles.emptyRequests}>
              <Ionicons name="people-outline" size={48} color={Colors.gray} />
              <Text style={styles.emptyRequestsText}>No pending requests</Text>
              <Text style={styles.emptyRequestsSubtext}>When passengers request to book your ride, you'll see them here</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {bookingRequests.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isAccepting={isAccepting}
                  isRejecting={isRejecting}
                  style={styles.requestCard}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <Button 
          title={`Book seat • ${formatCurrency(ride.price)}`}
          onPress={handleBookRide}
          style={styles.bookButton}
        />
      </View>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  routeCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
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
    marginRight: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.lightGray,
    marginVertical: 5,
  },
  routeDetails: {
    flex: 1,
  },
  location: {
    marginBottom: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  city: {
    fontSize: 16,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: Colors.gray,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -25,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 14,
    color: Colors.gray,
    marginRight: 10,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 15,
  },
  rideInfo: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: Colors.gray,
  },
  driverCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: Colors.gray,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBio: {
    color: Colors.gray,
    marginBottom: 15,
    lineHeight: 20,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  carText: {
    color: Colors.gray,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  contactText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  bookButton: {
    marginBottom: 30,
  },
  bookingRequestsSection: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  requestCount: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  requestCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyRequestsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyRequestsSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    marginBottom: 0,
  },
});