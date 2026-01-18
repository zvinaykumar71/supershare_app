import { Colors } from '@/Constants/Colors';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type BookingRequest = {
  id: string;
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
    from?: { city?: string; address?: string };
    to?: { city?: string; address?: string };
    departureTime?: string;
    arrivalTime?: string;
    price?: number;
    availableSeats?: number;
    bookedSeats?: number;
  };
};

interface BookingRequestCardProps {
  booking: BookingRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  style?: any;
}

export function BookingRequestCard({
  booking,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  style,
}: BookingRequestCardProps) {
  const [actionState, setActionState] = useState<'idle' | 'accepting' | 'rejecting' | 'accepted' | 'rejected'>('idle');
  const [scaleValue] = useState(new Animated.Value(1));
  
  const ride = booking.ride || {};
  const passengerName = booking.passenger?.name || 'Passenger';
  const seats = booking.seats || 1;
  const totalPrice = booking.totalPrice ?? ride.price ?? 0;
  
  const handleAccept = () => {
    setActionState('accepting');
    onAccept(booking.id);
    // Simulate success state
    setTimeout(() => {
      setActionState('accepted');
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);
  };
  
  const handleReject = () => {
    setActionState('rejecting');
    onReject(booking.id);
    // Simulate success state
    setTimeout(() => {
      setActionState('rejected');
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);
  };

  const getCardStyle = () => {
    switch (actionState) {
      case 'accepted':
        return [styles.container, styles.acceptedCard, style];
      case 'rejected':
        return [styles.container, styles.rejectedCard, style];
      default:
        return [styles.container, style];
    }
  };

  return (
    <Animated.View style={[getCardStyle(), { transform: [{ scale: scaleValue }] }]}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Ionicons name="person" size={18} color={Colors.primary} />
          <Text style={styles.name} numberOfLines={1}>{passengerName}</Text>
        </View>
        <Text style={styles.date}>{ride.departureTime ? formatDate(ride.departureTime) : ''}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineDot} />
        </View>
        <View style={styles.locations}>
          <View style={styles.location}>
            <Text style={styles.time}>{ride.departureTime ? formatTime(ride.departureTime) : ''}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.from?.city || 'Origin'}</Text>
          </View>
          <View style={styles.location}>
            <Text style={styles.time}>{ride.arrivalTime ? formatTime(ride.arrivalTime) : ''}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.to?.city || 'Destination'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={[styles.pill, styles.seatPill]}>
          <Ionicons name="people" size={14} color={Colors.primary} />
          <Text style={[styles.pillText, styles.seatText]}>Requesting {seats} seat{seats !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="pricetag" size={14} color={Colors.gray} />
          <Text style={styles.pillText}>{formatCurrency(totalPrice)}</Text>
        </View>
        {typeof booking.specialRequests?.luggage === 'number' && (
          <View style={styles.pill}>
            <Ionicons name="briefcase" size={14} color={Colors.gray} />
            <Text style={styles.pillText}>{booking.specialRequests?.luggage} luggage</Text>
          </View>
        )}
      </View>

      {ride.availableSeats !== undefined && (
        <View style={styles.seatInfoContainer}>
          <View style={styles.seatInfoItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.seatInfoLabel}>Available:</Text>
            <Text style={[styles.seatInfoValue, { color: Colors.success }]}>{ride.availableSeats}</Text>
          </View>
          <View style={styles.seatInfoDivider} />
          <View style={styles.seatInfoItem}>
            <Ionicons name="people" size={16} color={Colors.primary} />
            <Text style={styles.seatInfoLabel}>Booked:</Text>
            <Text style={[styles.seatInfoValue, { color: Colors.primary }]}>{ride.bookedSeats || 0}</Text>
          </View>
        </View>
      )}

      {(booking.pickupPoint || booking.dropoffPoint) && (
        <View style={styles.pointsRow}>
          {booking.pickupPoint && (
            <View style={styles.point}>
              <Ionicons name="arrow-up" size={14} color={Colors.gray} />
              <Text style={styles.pointText} numberOfLines={1}>{booking.pickupPoint}</Text>
            </View>
          )}
          {booking.dropoffPoint && (
            <View style={styles.point}>
              <Ionicons name="arrow-down" size={14} color={Colors.gray} />
              <Text style={styles.pointText} numberOfLines={1}>{booking.dropoffPoint}</Text>
            </View>
          )}
        </View>
      )}

      {actionState === 'accepted' ? (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.successText}>Request accepted!</Text>
        </View>
      ) : actionState === 'rejected' ? (
        <View style={styles.rejectedMessage}>
          <Ionicons name="close-circle" size={20} color={Colors.danger} />
          <Text style={styles.rejectedText}>Request rejected</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleReject}
            style={[styles.button, styles.rejectButton]}
            disabled={actionState !== 'idle'}
            activeOpacity={0.8}
          >
            {actionState === 'rejecting' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reject</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            style={[styles.button, styles.acceptButton]}
            disabled={actionState !== 'idle'}
            activeOpacity={0.8}
          >
            {actionState === 'accepting' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: Colors.gray,
  },
  route: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.lightGray,
    marginVertical: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
  },
  city: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    color: Colors.gray,
    maxWidth: 180,
  },
  seatPill: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  seatText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  seatInfoContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatInfoLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  seatInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  seatInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.gray,
    marginHorizontal: 12,
  },
  pointsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointText: {
    fontSize: 12,
    color: Colors.gray,
    maxWidth: 240,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  acceptedCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  rejectedCard: {
    borderWidth: 2,
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + '10',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 8,
  },
  rejectedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.danger + '20',
    borderRadius: 8,
    marginTop: 8,
  },
  rejectedText: {
    color: Colors.danger,
    fontWeight: '600',
    marginLeft: 8,
  },
});


