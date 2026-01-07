import { Colors } from '@/Constants/Colors';
import { MAPBOX_ACCESS_TOKEN } from '@/Constants/Env';
import { useAuth } from '@/hooks/useAuth';
import { useDriverActiveRide, useUpdateLocation, useCompleteRide, useStartRide } from '@/hooks/useTracking';
import { trackingService } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple map component using Mapbox Static API
const StaticMap = ({ 
  driverLocation, 
  fromCoords, 
  toCoords,
  passengers = []
}: { 
  driverLocation?: { lat: number; lng: number };
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  passengers?: any[];
}) => {
  // Build markers for Mapbox Static API
  let markers = '';
  
  // Driver marker (blue)
  if (driverLocation?.lat && driverLocation?.lng) {
    markers += `pin-l-car+0066FF(${driverLocation.lng},${driverLocation.lat}),`;
  }
  
  // From marker (green)
  if (fromCoords?.lat && fromCoords?.lng) {
    markers += `pin-s-a+00FF00(${fromCoords.lng},${fromCoords.lat}),`;
  }
  
  // To marker (red)
  if (toCoords?.lat && toCoords?.lng) {
    markers += `pin-s-b+FF0000(${toCoords.lng},${toCoords.lat}),`;
  }
  
  // Remove trailing comma
  markers = markers.slice(0, -1);
  
  // Calculate center and zoom
  const centerLat = driverLocation?.lat || fromCoords?.lat || 28.6139;
  const centerLng = driverLocation?.lng || fromCoords?.lng || 77.2090;
  
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers ? markers + '/' : ''}${centerLng},${centerLat},12,0/${Math.round(width - 40)}x300@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

  return (
    <View style={styles.mapContainer}>
      <Image 
        source={{ uri: mapUrl }} 
        style={styles.mapImage}
        resizeMode="cover"
      />
      <View style={styles.mapOverlay}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0066FF' }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00FF00' }]} />
            <Text style={styles.legendText}>Pickup</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF0000' }]} />
            <Text style={styles.legendText}>Destination</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ActiveRideScreen() {
  const { rideId } = useLocalSearchParams();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; heading?: number; speed?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: activeRideData, isLoading, refetch } = useDriverActiveRide();
  const { mutate: updateLocation } = useUpdateLocation();
  const { mutate: completeRide, isPending: isCompleting } = useCompleteRide();
  const { mutate: startRide, isPending: isStarting } = useStartRide();

  const ride = activeRideData?.ride;
  const passengers = activeRideData?.passengers || [];

  // Simulate location updates (in production, use expo-location)
  useEffect(() => {
    if (ride?.rideStatus === 'in_progress' && ride?._id) {
      setIsTracking(true);
      
      // Simulate location updates every 5 seconds
      locationIntervalRef.current = setInterval(() => {
        // In production, get real location from expo-location
        const simulatedLocation = {
          lat: (ride.from?.coordinates?.lat || 28.6139) + (Math.random() - 0.5) * 0.01,
          lng: (ride.from?.coordinates?.lng || 77.2090) + (Math.random() - 0.5) * 0.01,
          heading: Math.random() * 360,
          speed: 30 + Math.random() * 20
        };
        
        setCurrentLocation(simulatedLocation);
        
        // Send location to server
        updateLocation({
          rideId: ride._id,
          location: simulatedLocation
        });
      }, 5000);
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [ride?.rideStatus, ride?._id]);

  const handleStartRide = () => {
    if (!rideId) return;
    
    Alert.alert(
      'Start Ride',
      'Are you sure you want to start this ride? All passengers will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            startRide(
              { rideId: rideId as string, location: currentLocation || undefined },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Ride started! Passengers have been notified.');
                  refetch();
                },
                onError: (error: any) => {
                  Alert.alert('Error', error.response?.data?.message || 'Failed to start ride');
                }
              }
            );
          }
        }
      ]
    );
  };

  const handleCompleteRide = () => {
    if (!ride?._id) return;
    
    Alert.alert(
      'Complete Ride',
      'Are you sure you want to complete this ride? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: () => {
            completeRide(ride._id, {
              onSuccess: () => {
                Alert.alert('Success', 'Ride completed successfully!', [
                  { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') }
                ]);
              },
              onError: (error: any) => {
                Alert.alert('Error', error.response?.data?.message || 'Failed to complete ride');
              }
            });
          }
        }
      ]
    );
  };

  const handleCallPassenger = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading active ride...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.noRideContainer}>
        <Ionicons name="car-outline" size={64} color={Colors.gray} />
        <Text style={styles.noRideTitle}>No Active Ride</Text>
        <Text style={styles.noRideSubtitle}>
          You don't have any ride in progress. Start a scheduled ride to begin tracking.
        </Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {ride.rideStatus === 'in_progress' ? 'Ride In Progress' : 'Start Ride'}
        </Text>
        <View style={[styles.statusBadge, ride.rideStatus === 'in_progress' ? styles.statusActive : styles.statusScheduled]}>
          <Text style={styles.statusText}>
            {ride.rideStatus === 'in_progress' ? 'LIVE' : 'SCHEDULED'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <StaticMap
          driverLocation={currentLocation || ride.currentLocation}
          fromCoords={ride.from?.coordinates}
          toCoords={ride.to?.coordinates}
          passengers={passengers}
        />

        {/* Ride Info Card */}
        <View style={styles.rideInfoCard}>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeCity}>{ride.from?.city}</Text>
                <Text style={styles.routeAddress}>{ride.from?.address}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeCity}>{ride.to?.city}</Text>
                <Text style={styles.routeAddress}>{ride.to?.address}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{passengers.length}</Text>
              <Text style={styles.statLabel}>Passengers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="car" size={20} color={Colors.success} />
              <Text style={styles.statValue}>{ride.bookedSeats}/{ride.totalSeats}</Text>
              <Text style={styles.statLabel}>Seats</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash" size={20} color={Colors.warning} />
              <Text style={styles.statValue}>₹{ride.price * ride.bookedSeats}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </View>

        {/* Passengers List */}
        <View style={styles.passengersSection}>
          <Text style={styles.sectionTitle}>Passengers ({passengers.length})</Text>
          
          {passengers.length === 0 ? (
            <View style={styles.noPassengers}>
              <Text style={styles.noPassengersText}>No confirmed passengers yet</Text>
            </View>
          ) : (
            passengers.map((booking: any) => (
              <View key={booking._id} style={styles.passengerCard}>
                <Image
                  source={{ uri: booking.passenger?.profilePicture || 'https://picsum.photos/100' }}
                  style={styles.passengerAvatar}
                />
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerName}>{booking.passenger?.name}</Text>
                  <Text style={styles.passengerSeats}>{booking.seats} seat(s)</Text>
                  <View style={styles.passengerPoints}>
                    <Text style={styles.pointLabel}>Pickup: </Text>
                    <Text style={styles.pointValue}>{booking.pickupPoint}</Text>
                  </View>
                  <View style={styles.passengerPoints}>
                    <Text style={styles.pointLabel}>Drop: </Text>
                    <Text style={styles.pointValue}>{booking.dropoffPoint}</Text>
                  </View>
                  {booking.distanceToPickup && (
                    <View style={styles.distanceInfo}>
                      <Ionicons name="navigate" size={14} color={Colors.primary} />
                      <Text style={styles.distanceText}>
                        {trackingService.formatDistance(booking.distanceToPickup)} away
                        {booking.etaToPickup && ` • ${trackingService.formatETA(booking.etaToPickup)}`}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallPassenger(booking.passenger?.phone)}
                >
                  <Ionicons name="call" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomActions}>
        {ride.rideStatus === 'scheduled' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartRide}
            disabled={isStarting || passengers.length === 0}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isStarting ? 'Starting...' : 'Start Ride'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteRide}
            disabled={isCompleting}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isCompleting ? 'Completing...' : 'Complete Ride'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
  },
  noRideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  noRideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  noRideSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  goBackButton: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: Colors.success,
  },
  statusScheduled: {
    backgroundColor: Colors.warning,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.lightGray,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: Colors.text,
  },
  rideInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeInfo: {
    marginBottom: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.lightGray,
    marginLeft: 5,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.lightGray,
  },
  passengersSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  noPassengers: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  noPassengersText: {
    color: Colors.gray,
    fontSize: 14,
  },
  passengerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  passengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  passengerSeats: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 2,
  },
  passengerPoints: {
    flexDirection: 'row',
    marginTop: 4,
  },
  pointLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  pointValue: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  completeButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

