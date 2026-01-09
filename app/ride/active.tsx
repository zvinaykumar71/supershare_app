import { Colors } from '@/Constants/Colors';
import { MAPBOX_ACCESS_TOKEN } from '@/Constants/Env';
import { useAuth } from '@/hooks/useAuth';
import { useDriverActiveRide, useUpdateLocation, useCompleteRide, useStartRide } from '@/hooks/useTracking';
import { trackingService } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

// Map component using Mapbox Static API with route line
const StaticMap = ({ 
  driverLocation, 
  fromCoords, 
  toCoords,
  passengers = [],
  isLoading = false,
}: { 
  driverLocation?: { lat: number; lng: number };
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  passengers?: any[];
  isLoading?: boolean;
}) => {
  // Build markers for Mapbox Static API
  let markers = '';
  
  // Driver marker (blue car icon)
  if (driverLocation?.lat && driverLocation?.lng) {
    markers += `pin-l-car+0066FF(${driverLocation.lng},${driverLocation.lat}),`;
  }
  
  // From marker (green - Start)
  if (fromCoords?.lat && fromCoords?.lng) {
    markers += `pin-l-a+22C55E(${fromCoords.lng},${fromCoords.lat}),`;
  }
  
  // To marker (red - End)
  if (toCoords?.lat && toCoords?.lng) {
    markers += `pin-l-b+EF4444(${toCoords.lng},${toCoords.lat}),`;
  }
  
  // Remove trailing comma
  markers = markers.slice(0, -1);
  
  // Calculate bounds to fit all points
  const allLats = [driverLocation?.lat, fromCoords?.lat, toCoords?.lat].filter(Boolean) as number[];
  const allLngs = [driverLocation?.lng, fromCoords?.lng, toCoords?.lng].filter(Boolean) as number[];
  
  let centerLat = 28.6139;
  let centerLng = 77.2090;
  let zoom = 12;
  
  if (allLats.length > 0 && allLngs.length > 0) {
    centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
    centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;
    
    // Calculate zoom based on distance
    const latDiff = Math.max(...allLats) - Math.min(...allLats);
    const lngDiff = Math.max(...allLngs) - Math.min(...allLngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    else zoom = 12;
  }
  
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers ? markers + '/' : ''}${centerLng},${centerLat},${zoom},0/${Math.round(width - 40)}x280@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

  return (
    <View style={styles.mapContainer}>
      {isLoading ? (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      ) : (
        <Image 
          source={{ uri: mapUrl }} 
          style={styles.mapImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.mapOverlay}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0066FF' }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>End</Text>
          </View>
        </View>
      </View>
      {driverLocation && (
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={14} color="#fff" />
          <Text style={styles.locationBadgeText}>Live</Text>
        </View>
      )}
    </View>
  );
};

// Geocode city name to coordinates using Mapbox Geocoding API
const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  if (!locationName) return null;
  
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?country=IN&access_token=${MAPBOX_ACCESS_TOKEN}`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

export default function ActiveRideScreen() {
  const { rideId } = useLocalSearchParams();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; heading?: number; speed?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const { data: activeRideData, isLoading, refetch } = useDriverActiveRide();
  const { mutate: updateLocation } = useUpdateLocation();
  const { mutate: completeRide, isPending: isCompleting } = useCompleteRide();
  const { mutate: startRide, isPending: isStarting } = useStartRide();

  const ride = activeRideData?.ride;
  const passengers = activeRideData?.passengers || [];

  // Geocode ride locations when ride data is available
  useEffect(() => {
    const geocodeRideLocations = async () => {
      if (!ride) return;
      
      // Use stored coordinates if available, otherwise geocode
      if (ride.from?.coordinates?.lat && ride.from?.coordinates?.lng) {
        setFromCoords(ride.from.coordinates);
      } else if (ride.from?.city || ride.from?.address) {
        const searchQuery = `${ride.from.address || ''} ${ride.from.city || ''}`.trim();
        const coords = await geocodeLocation(searchQuery);
        if (coords) setFromCoords(coords);
      }
      
      if (ride.to?.coordinates?.lat && ride.to?.coordinates?.lng) {
        setToCoords(ride.to.coordinates);
      } else if (ride.to?.city || ride.to?.address) {
        const searchQuery = `${ride.to.address || ''} ${ride.to.city || ''}`.trim();
        const coords = await geocodeLocation(searchQuery);
        if (coords) setToCoords(coords);
      }
    };
    
    geocodeRideLocations();
  }, [ride?.from?.city, ride?.from?.address, ride?.to?.city, ride?.to?.address]);

  // Request location permission and start tracking
  useEffect(() => {
    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to track your ride.');
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setCurrentLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          heading: location.coords.heading || undefined,
          speed: location.coords.speed || undefined,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    setupLocation();
  }, []);

  // Start real-time location tracking when ride is in progress
  useEffect(() => {
    const startTracking = async () => {
      if (ride?.rideStatus === 'in_progress' && ride?._id && locationPermission) {
        setIsTracking(true);
        
        // Subscribe to location updates
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
          },
          (location) => {
            const newLocation = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading || undefined,
              speed: location.coords.speed || undefined,
            };
            
            setCurrentLocation(newLocation);
            
            // Send location to server
            updateLocation({
              rideId: ride._id,
              location: newLocation,
            });
          }
        );
      }
    };

    startTracking();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [ride?.rideStatus, ride?._id, locationPermission]);

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
              onSuccess: (data: any) => {
                const summary = data?.summary;
                const summaryText = summary 
                  ? `\n\n📊 Ride Summary:\n👥 Passengers: ${summary.totalPassengers}\n💰 Earnings: ₹${summary.totalEarnings}\n⏱️ Duration: ${summary.rideDuration || 0} minutes`
                  : '';
                
                Alert.alert(
                  '🎉 Ride Completed!', 
                  `Your ride from ${ride.from?.city} to ${ride.to?.city} has been completed successfully.${summaryText}`,
                  [{ text: 'View My Rides', onPress: () => router.replace('/(tabs)/my-rides') }]
                );
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

  const handleRefreshLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
      };
      
      setCurrentLocation(newLocation);
      
      if (ride?._id && ride?.rideStatus === 'in_progress') {
        updateLocation({
          rideId: ride._id,
          location: newLocation,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const openInMaps = () => {
    const destCoords = toCoords || ride?.to?.coordinates;
    if (destCoords) {
      const url = Platform.select({
        ios: `maps:?daddr=${destCoords.lat},${destCoords.lng}`,
        android: `google.navigation:q=${destCoords.lat},${destCoords.lng}`,
      });
      if (url) Linking.openURL(url);
    } else {
      // Fallback: open maps with address search
      const address = `${ride?.to?.address || ''} ${ride?.to?.city || ''}`.trim();
      if (address) {
        const url = Platform.select({
          ios: `maps:?daddr=${encodeURIComponent(address)}`,
          android: `google.navigation:q=${encodeURIComponent(address)}`,
        });
        if (url) Linking.openURL(url);
      }
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
          fromCoords={fromCoords || ride.from?.coordinates}
          toCoords={toCoords || ride.to?.coordinates}
          passengers={passengers}
          isLoading={!currentLocation && !fromCoords && !toCoords}
        />
        
        {/* Map Action Buttons */}
        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionButton} onPress={handleRefreshLocation}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.mapActionText}>Refresh Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mapActionButton, styles.navigateButton]} onPress={openInMaps}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={[styles.mapActionText, { color: '#fff' }]}>Navigate</Text>
          </TouchableOpacity>
        </View>

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
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.lightGray,
  },
  mapLoading: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 10,
    color: Colors.gray,
    fontSize: 14,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  locationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  locationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 10,
    gap: 10,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navigateButton: {
    backgroundColor: Colors.primary,
  },
  mapActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
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

