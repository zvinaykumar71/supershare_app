import { Colors } from '@/Constants/Colors';
import { MAPBOX_ACCESS_TOKEN } from '@/Constants/Env';
import { useAuth } from '@/hooks/useAuth';
import { useRideTracking } from '@/hooks/useTracking';
import { trackingService } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Static Map component for passenger view
const TrackingMap = ({
  driverLocation,
  pickupCoords,
  destinationCoords,
  isTracking
}: {
  driverLocation?: { lat: number; lng: number } | null;
  pickupCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  isTracking: boolean;
}) => {
  let markers = '';

  // Driver marker (blue car)
  if (isTracking && driverLocation?.lat && driverLocation?.lng) {
    markers += `pin-l-car+0066FF(${driverLocation.lng},${driverLocation.lat}),`;
  }

  // Pickup marker (green)
  if (pickupCoords?.lat && pickupCoords?.lng) {
    markers += `pin-s-a+00FF00(${pickupCoords.lng},${pickupCoords.lat}),`;
  }

  // Destination marker (red)
  if (destinationCoords?.lat && destinationCoords?.lng) {
    markers += `pin-s-b+FF0000(${destinationCoords.lng},${destinationCoords.lat}),`;
  }

  markers = markers.slice(0, -1);

  // Calculate center
  const centerLat = driverLocation?.lat || pickupCoords?.lat || 28.6139;
  const centerLng = driverLocation?.lng || pickupCoords?.lng || 77.2090;

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers ? markers + '/' : ''}${centerLng},${centerLat},12,0/${Math.round(width - 40)}x250@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

  return (
    <View style={styles.mapContainer}>
      <Image
        source={{ uri: mapUrl }}
        style={styles.mapImage}
        resizeMode="cover"
      />
      {isTracking && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      <View style={styles.mapLegend}>
        <View style={styles.legendRow}>
          {isTracking && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0066FF' }]} />
              <Text style={styles.legendText}>Driver</Text>
            </View>
          )}
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

// ETA Card Component
const ETACard = ({
  distance,
  eta,
  label,
  icon,
  color
}: {
  distance: number | null;
  eta: number | null;
  label: string;
  icon: string;
  color: string;
}) => (
  <View style={[styles.etaCard, { borderLeftColor: color }]}>
    <View style={styles.etaIconContainer}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.etaInfo}>
      <Text style={styles.etaLabel}>{label}</Text>
      <Text style={styles.etaValue}>
        {trackingService.formatDistance(distance)}
      </Text>
      <Text style={styles.etaTime}>
        ETA: {trackingService.formatETA(eta)}
      </Text>
    </View>
  </View>
);

export default function RideTrackingScreen() {
  const { id } = useLocalSearchParams();
  const rideId = Array.isArray(id) ? id[0] : id?.toString();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch, error } = useRideTracking(rideId || '');

  // Log tracking updates for testing


  const ride = data?.ride;
  const booking = data?.booking;
  const tracking = data?.tracking;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCallDriver = () => {
    if (ride?.driver?.phone) {
      Linking.openURL(`tel:${ride.driver.phone}`);
    } else {
      Alert.alert('Error', 'Driver phone number not available');
    }
  };

  const handleOpenInMaps = () => {
    if (ride?.from?.coordinates?.lat && ride?.from?.coordinates?.lng) {
      const url = Platform.select({
        ios: `maps:?daddr=${ride.from.coordinates.lat},${ride.from.coordinates.lng}`,
        android: `google.navigation:q=${ride.from.coordinates.lat},${ride.from.coordinates.lng}`
      });
      if (url) Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.danger} />
        <Text style={styles.errorTitle}>Unable to Load Ride</Text>
        <Text style={styles.errorSubtitle}>
          {(error as any)?.response?.data?.message || 'Please try again later'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
          <Text style={styles.backButtonAltText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return Colors.success;
      case 'scheduled': return Colors.warning;
      case 'completed': return Colors.primary;
      default: return Colors.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Ride</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.rideStatus) }]}>
          <Text style={styles.statusText}>{getStatusText(ride.rideStatus)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <TrackingMap
          driverLocation={tracking?.driverLocation || ride.currentLocation}
          pickupCoords={ride.from?.coordinates}
          destinationCoords={ride.to?.coordinates}
          isTracking={tracking?.isTracking || ride.rideStatus === 'in_progress'}
        />

        {/* ETA Cards - Only show when tracking */}
        {tracking?.isTracking && (
          <View style={styles.etaContainer}>
            <ETACard
              distance={tracking.distanceToPickup}
              eta={tracking.etaToPickup}
              label="To Pickup"
              icon="location"
              color={Colors.success}
            />
            <ETACard
              distance={tracking.distanceToDestination}
              eta={tracking.etaToDestination}
              label="To Destination"
              icon="flag"
              color={Colors.primary}
            />
          </View>
        )}

        {/* Waiting Message - When not yet started */}
        {ride.rideStatus === 'scheduled' && (
          <View style={styles.waitingCard}>
            <Ionicons name="time-outline" size={40} color={Colors.warning} />
            <Text style={styles.waitingTitle}>Waiting for Driver</Text>
            <Text style={styles.waitingSubtitle}>
              The driver hasn&apos;t started the ride yet. You&apos;ll see real-time tracking once the ride begins.
            </Text>
          </View>
        )}

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <Text style={styles.sectionTitle}>Your Driver</Text>
          <View style={styles.driverInfo}>
            <Image
              source={{ uri: ride.driver?.profilePicture || 'https://picsum.photos/100' }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride.driver?.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.ratingText}>{ride.driver?.rating || 'N/A'}</Text>
              </View>
              {ride.driver?.vehicle && (
                <Text style={styles.vehicleText}>
                  {ride.driver.vehicle.make} {ride.driver.vehicle.model} • {ride.driver.vehicle.color}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.callDriverButton} onPress={handleCallDriver}>
              <Ionicons name="call" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Route Card */}
        <View style={styles.routeCard}>
          <Text style={styles.sectionTitle}>Route Details</Text>

          <View style={styles.routeTimeline}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeCity}>{ride.from?.city}</Text>
                <Text style={styles.routeAddress}>{booking?.pickupPoint || ride.from?.address}</Text>
              </View>
            </View>

            <View style={styles.routeLineContainer}>
              <View style={styles.routeLineVertical} />
            </View>

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Drop-off</Text>
                <Text style={styles.routeCity}>{ride.to?.city}</Text>
                <Text style={styles.routeAddress}>{booking?.dropoffPoint || ride.to?.address}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.directionsButton} onPress={handleOpenInMaps}>
            <Ionicons name="navigate" size={18} color={Colors.primary} />
            <Text style={styles.directionsText}>Get Directions to Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingCard}>
          <Text style={styles.sectionTitle}>Your Booking</Text>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Seats</Text>
            <Text style={styles.bookingValue}>{booking?.seats}</Text>
          </View>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Total Price</Text>
            <Text style={styles.bookingValueHighlight}>₹{booking?.totalPrice}</Text>
          </View>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Status</Text>
            <View style={[styles.bookingStatusBadge, { backgroundColor: Colors.lightSuccess }]}>
              <Text style={[styles.bookingStatusText, { color: Colors.success }]}>
                {booking?.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Last Updated */}
        {tracking?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(tracking.lastUpdated).toLocaleTimeString()}
          </Text>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonAlt: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backButtonAltText: {
    color: Colors.primary,
    fontSize: 16,
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
    height: 250,
    backgroundColor: Colors.lightGray,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 8,
  },
  legendRow: {
    flexDirection: 'row',
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
  etaContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
  },
  etaCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  etaIconContainer: {
    marginRight: 12,
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  etaTime: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  waitingCard: {
    backgroundColor: Colors.lightWarning,
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  waitingSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  driverCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 4,
  },
  vehicleText: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
  },
  callDriverButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeCard: {
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
  routeTimeline: {
    marginBottom: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
    marginRight: 12,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.gray,
    textTransform: 'uppercase',
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  routeLineContainer: {
    paddingLeft: 6,
    paddingVertical: 5,
  },
  routeLineVertical: {
    width: 2,
    height: 30,
    backgroundColor: Colors.lightGray,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginTop: 10,
  },
  directionsText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bookingCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  bookingLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  bookingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  bookingValueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookingStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.gray,
    marginTop: 10,
  },
});

