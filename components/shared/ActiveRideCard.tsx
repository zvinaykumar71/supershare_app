import { Colors } from '@/Constants/Colors';
import { trackingService } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActiveRideCardProps {
  ride: {
    _id: string;
    from: { city: string; address: string };
    to: { city: string; address: string };
    departureTime: string;
    rideStatus: string;
    currentLocation?: { lat: number; lng: number } | null;
    driver?: {
      name: string;
      profilePicture?: string;
      phone?: string;
    };
    price?: number;
    bookedSeats?: number;
    totalSeats?: number;
  };
  booking?: {
    _id: string;
    seats: number;
    totalPrice: number;
    pickupPoint: string;
    dropoffPoint: string;
  };
  tracking?: {
    isTracking: boolean;
    distanceToPickup?: number | null;
    etaToPickup?: number | null;
  };
  isDriver?: boolean;
  onPress?: () => void;
}

export const ActiveRideCard: React.FC<ActiveRideCardProps> = ({
  ride,
  booking,
  tracking,
  isDriver = false,
  onPress
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isDriver) {
      router.push({ pathname: '/ride/active', params: { rideId: ride._id } });
    } else {
      router.push({ pathname: '/ride/tracking', params: { id: ride._id } });
    }
  };

  const getStatusColor = () => {
    switch (ride.rideStatus) {
      case 'in_progress': return Colors.success;
      case 'scheduled': return Colors.warning;
      default: return Colors.gray;
    }
  };

  const getStatusText = () => {
    switch (ride.rideStatus) {
      case 'in_progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      default: return ride.rideStatus;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        {ride.rideStatus === 'in_progress' && (
          <View style={styles.liveDot} />
        )}
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <Text style={styles.cityText} numberOfLines={1}>{ride.from.city}</Text>
        </View>
        <View style={styles.routeLine}>
          <Ionicons name="arrow-forward" size={16} color={Colors.gray} />
        </View>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.cityText} numberOfLines={1}>{ride.to.city}</Text>
        </View>
      </View>

      {/* Driver/Passenger Info */}
      {!isDriver && ride.driver && (
        <View style={styles.driverRow}>
          <Image
            source={{ uri: ride.driver.profilePicture || 'https://picsum.photos/100' }}
            style={styles.avatar}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.driver.name}</Text>
            {booking && (
              <Text style={styles.seatsText}>{booking.seats} seat(s) • ₹{booking.totalPrice}</Text>
            )}
          </View>
          {tracking?.isTracking && (
            <View style={styles.etaContainer}>
              <Ionicons name="navigate" size={16} color={Colors.primary} />
              <Text style={styles.etaText}>
                {trackingService.formatETA(tracking.etaToPickup)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Driver View - Stats */}
      {isDriver && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={18} color={Colors.primary} />
            <Text style={styles.statText}>{ride.bookedSeats}/{ride.totalSeats} seats</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={18} color={Colors.success} />
            <Text style={styles.statText}>₹{(ride.price || 0) * (ride.bookedSeats || 0)}</Text>
          </View>
        </View>
      )}

      {/* Tracking Info for Passengers */}
      {!isDriver && tracking?.isTracking && tracking.distanceToPickup && (
        <View style={styles.trackingInfo}>
          <Ionicons name="car" size={16} color={Colors.primary} />
          <Text style={styles.trackingText}>
            Driver is {trackingService.formatDistance(tracking.distanceToPickup)} away
          </Text>
        </View>
      )}

      {/* Action Hint */}
      <View style={styles.actionHint}>
        <Text style={styles.actionHintText}>
          {isDriver ? 'Tap to manage ride' : 'Tap to track'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  routeLine: {
    paddingHorizontal: 10,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  seatsText: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  trackingText: {
    fontSize: 13,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionHintText: {
    fontSize: 12,
    color: Colors.gray,
  },
});

