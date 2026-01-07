import { Colors } from '@/Constants/Colors';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type BookingRequest = {
  id: string;
  _id?: string;
  status: string;
  seats: number;
  totalPrice?: number;
  pickupPoint?: string;
  dropoffPoint?: string;
  notes?: string;
  specialRequests?: {
    luggage?: number;
    pets?: boolean;
    smoking?: boolean;
    music?: boolean;
    ac?: boolean;
  };
  passenger?: { _id?: string; name?: string };
  ride?: {
    _id?: string;
    from?: { city?: string; address?: string };
    to?: { city?: string; address?: string };
    departureTime?: string;
    arrivalTime?: string;
    price?: number;
    availableSeats?: number;
    bookedSeats?: number;
    rideStatus?: string;
    driver?: {
      _id: string;
      name: string;
      rating: number;
      reviewsCount: number;
      profilePicture: string;
      vehicle?: {
        make: string;
        model: string;
        year: number;
        color: string;
        licensePlate: string;
      };
    };
    stops?: Array<{
      city: string;
      address: string;
      _id: string;
    }>;
    details?: string;
  };
  paymentStatus?: string;
  createdAt?: string;
  expiresAt?: string;
  canCancel?: boolean;
  canRate?: boolean;
};

interface PassengerBookingCardProps {
  booking: BookingRequest;
  onCancel?: (id: string) => void;
  onRate?: (id: string) => void;
  style?: any;
  showStatus?: boolean;
}

export function PassengerBookingCard({
  booking,
  onCancel,
  onRate,
  style,
  showStatus = true,
}: PassengerBookingCardProps) {
  const ride = booking.ride || {};
  const driver = ride.driver;
  const seats = booking.seats || 1;
  const totalPrice = booking.totalPrice ?? ride.price ?? 0;

  const getStatusColor = () => {
    switch (booking.status) {
      case 'accepted':
      case 'confirmed':
        return Colors.success;
      case 'rejected':
        return Colors.danger;
      case 'pending':
        return Colors.warning;
      case 'completed':
        return Colors.primary;
      case 'cancelled':
        return Colors.gray;
      default:
        return Colors.gray;
    }
  };

  const getStatusIcon = () => {
    switch (booking.status) {
      case 'accepted':
      case 'confirmed':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done';
      case 'cancelled':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const getPaymentStatusColor = () => {
    switch (booking.paymentStatus) {
      case 'paid':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.danger;
      default:
        return Colors.gray;
    }
  };

  const getRideStatusColor = () => {
    switch (ride.rideStatus) {
      case 'in_progress':
        return Colors.success;
      case 'scheduled':
        return Colors.warning;
      case 'completed':
        return Colors.primary;
      case 'cancelled':
        return Colors.danger;
      default:
        return Colors.gray;
    }
  };

  const getRideStatusText = () => {
    switch (ride.rideStatus) {
      case 'in_progress':
        return 'Ride In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return ride.rideStatus || 'Unknown';
    }
  };

  const isRideInProgress = ride.rideStatus === 'in_progress';
  const canTrackRide = (booking.status === 'confirmed' || booking.status === 'accepted') && isRideInProgress;

  const handleTrackRide = () => {
    const rideId = ride._id || booking.id || booking._id;
    if (rideId) {
      router.push({ pathname: '/ride/tracking', params: { id: rideId } });
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Ride Status Banner - Show when ride is in progress */}
      {isRideInProgress && (booking.status === 'confirmed' || booking.status === 'accepted') && (
        <View style={styles.rideStatusBanner}>
          <View style={styles.rideStatusLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.rideStatusText}>RIDE IN PROGRESS</Text>
          </View>
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackRide}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Ionicons name={getStatusIcon() as any} size={20} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
          </Text>
        </View>
        <Text style={styles.date}>
          {ride.departureTime ? formatDate(ride.departureTime) : ''}
        </Text>
      </View>

      {/* Driver Information */}
      {driver && (
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            <Ionicons name="person-circle" size={24} color={Colors.primary} />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.rating}>
                  {driver.rating || 'No ratings'} • {driver.reviewsCount || 0} reviews
                </Text>
              </View>
            </View>
          </View>
          {driver.vehicle && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.year})
              </Text>
              <Text style={styles.licensePlate}>{driver.vehicle.licensePlate}</Text>
            </View>
          )}
        </View>
      )}

      {/* Route Information */}
      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineDot} />
        </View>
        <View style={styles.locations}>
          <View style={styles.location}>
            <Text style={styles.time}>
              {ride.departureTime ? formatTime(ride.departureTime) : ''}
            </Text>
            <View style={styles.locationDetails}>
              <Text style={styles.city} numberOfLines={1}>
                {ride.from?.city}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {ride.from?.address}
              </Text>
            </View>
          </View>
          <View style={styles.location}>
            <Text style={styles.time}>
              {ride.arrivalTime ? formatTime(ride.arrivalTime) : ''}
            </Text>
            <View style={styles.locationDetails}>
              <Text style={styles.city} numberOfLines={1}>
                {ride.to?.city}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {ride.to?.address}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stops */}
      {ride.stops && ride.stops.length > 0 && (
        <View style={styles.stopsSection}>
          <Text style={styles.stopsTitle}>Stops:</Text>
          {ride.stops.map((stop, index) => (
            <View key={stop._id} style={styles.stopItem}>
              <Text style={styles.stopDot}>•</Text>
              <Text style={styles.stopText}>
                {stop.city} - {stop.address}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Booking Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Seats booked:</Text>
          <Text style={styles.detailValue}>{seats}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total price:</Text>
          <Text style={styles.detailValue}>{formatCurrency(totalPrice)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment status:</Text>
          <Text style={[styles.detailValue, { color: getPaymentStatusColor() }]}>
            {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
          </Text>
        </View>
      </View>

      {/* Special Requests */}
      {booking.specialRequests && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Special Requests</Text>
          <View style={styles.requestsGrid}>
            {booking.specialRequests.luggage !== undefined && booking.specialRequests.luggage > 0 && (
              <View style={styles.requestItem}>
                <Ionicons name="briefcase" size={16} color={Colors.primary} />
                <Text style={styles.requestText}>{booking.specialRequests.luggage} luggage</Text>
              </View>
            )}
            {booking.specialRequests.pets && (
              <View style={styles.requestItem}>
                <Ionicons name="paw" size={16} color={Colors.primary} />
                <Text style={styles.requestText}>Pets allowed</Text>
              </View>
            )}
            {booking.specialRequests.music && (
              <View style={styles.requestItem}>
                <Ionicons name="musical-notes" size={16} color={Colors.primary} />
                <Text style={styles.requestText}>Music</Text>
              </View>
            )}
            {booking.specialRequests.ac && (
              <View style={styles.requestItem}>
                <Ionicons name="snow" size={16} color={Colors.primary} />
                <Text style={styles.requestText}>AC</Text>
              </View>
            )}
            {booking.specialRequests.smoking && (
              <View style={styles.requestItem}>
                <Ionicons name="flame" size={16} color={Colors.primary} />
                <Text style={styles.requestText}>Smoking</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Ride Details */}
      {ride.details && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Ride Details</Text>
          <Text style={styles.notesText}>{ride.details}</Text>
        </View>
      )}

      {/* Pickup/Dropoff Points */}
      {(booking.pickupPoint || booking.dropoffPoint) && (
        <View style={styles.pointsSection}>
          {booking.pickupPoint && (
            <View style={styles.pointItem}>
              <Ionicons name="location" size={16} color={Colors.success} />
              <Text style={styles.pointText}>
                <Text style={styles.pointLabel}>Pickup: </Text>
                {booking.pickupPoint}
              </Text>
            </View>
          )}
          {booking.dropoffPoint && (
            <View style={styles.pointItem}>
              <Ionicons name="flag" size={16} color={Colors.danger} />
              <Text style={styles.pointText}>
                <Text style={styles.pointLabel}>Dropoff: </Text>
                {booking.dropoffPoint}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Booking Metadata */}
      <View style={styles.metaSection}>
        <Text style={styles.metaText}>
          Requested on: {booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}
        </Text>
        {booking.expiresAt && booking.status === 'pending' && (
          <Text style={styles.expiryText}>
            Expires: {formatTime(booking.expiresAt)}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {booking.canCancel && booking.status === 'pending' && (
          <TouchableOpacity
            onPress={() => onCancel?.(booking.id)}
            style={[styles.button, styles.cancelButton]}
          >
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.buttonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
        {booking.canRate && booking.status === 'completed' && (
          <TouchableOpacity
            onPress={() => onRate?.(booking.id)}
            style={[styles.button, styles.rateButton]}
          >
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.buttonText}>Rate Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 4,
    overflow: 'hidden',
  },
  rideStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.success,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rideStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  rideStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: Colors.gray,
  },
  driverSection: {
    backgroundColor: Colors.lightGray + '40',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: Colors.gray,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: Colors.gray,
  },
  licensePlate: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '600',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  route: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.lightGray,
    marginVertical: 4,
  },
  locations: {
    flex: 1,
    justifyContent: 'space-between',
  },
  location: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
    color: Colors.primary,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  city: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: Colors.gray,
  },
  stopsSection: {
    marginBottom: 16,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.gray,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopDot: {
    color: Colors.primary,
    marginRight: 8,
  },
  stopText: {
    fontSize: 12,
    color: Colors.gray,
  },
  detailsSection: {
    backgroundColor: Colors.lightGray + '40',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.gray,
  },
  requestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  pointsSection: {
    marginBottom: 16,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pointText: {
    fontSize: 14,
    color: Colors.gray,
    flex: 1,
  },
  pointLabel: {
    fontWeight: '600',
    color: Colors.darkGray,
  },
  metaSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 12,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.danger,
  },
  rateButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});