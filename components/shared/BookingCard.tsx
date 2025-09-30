import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../Constants/Colors';

interface BookingCardProps {
  booking: any;
  onPress?: () => void;
  style?: any;
}

export function BookingCard({ booking, onPress, style }: BookingCardProps) {
  const ride = booking.ride || {};
  const status = booking.status || 'pending';
  const seats = booking.seats || 1;
  const totalPrice = booking.totalPrice || ride.price || 0;

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <Ionicons name="time" size={12} color={status === 'pending' ? Colors.warning : Colors.success} />
          <Text style={[styles.statusText, status === 'pending' ? styles.statusPending : styles.statusConfirmed]}>
            {status}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(ride.departureTime)}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineDot} />
        </View>

        <View style={styles.locations}>
          <View style={styles.location}>
            <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.from?.city}</Text>
          </View>
          <View style={styles.location}>
            <Text style={styles.time}>{formatTime(ride.arrivalTime)}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.to?.city}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.detailPill}>
          <Ionicons name="person" size={14} color={Colors.gray} />
          <Text style={styles.pillText}>{seats} seat{seats !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.detailPill}>
          <Ionicons name="pricetag" size={14} color={Colors.gray} />
          <Text style={styles.pillText}>{formatCurrency(totalPrice)}</Text>
        </View>
        {booking.pickupPoint && (
          <View style={styles.detailPill}>
            <Ionicons name="arrow-up" size={14} color={Colors.gray} />
            <Text style={styles.pillText} numberOfLines={1}>{booking.pickupPoint}</Text>
          </View>
        )}
        {booking.dropoffPoint && (
          <View style={styles.detailPill}>
            <Ionicons name="arrow-down" size={14} color={Colors.gray} />
            <Text style={styles.pillText} numberOfLines={1}>{booking.dropoffPoint}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statusPending: { color: Colors.warning },
  statusConfirmed: { color: Colors.success },
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
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  detailPill: {
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
});

