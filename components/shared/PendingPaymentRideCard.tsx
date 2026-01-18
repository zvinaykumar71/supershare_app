import { Colors } from '@/Constants/Colors';
import { QRCodeGenerator } from '@/components/wallet/QRCodeGenerator';
import { useRideBookingRequests } from '@/hooks/useRides';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PendingPaymentRideCardProps {
  ride: any;
  style?: any;
}

export function PendingPaymentRideCard({ ride, style }: PendingPaymentRideCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const rideId = ride.id || ride._id;

  // Fetch booking requests to get passenger details and calculate total amount
  const { data: bookingRequestsData } = useRideBookingRequests(rideId || '');

  const passengers = useMemo(() =>
    bookingRequestsData?.bookingRequests?.filter((b: any) =>
      b.status === 'confirmed' || b.status === 'completed'
    ) || [],
    [bookingRequestsData]
  );

  // Calculate total amount for QR code
  const totalAmount = useMemo(() => {
    if (passengers.length > 0) {
      const sumFromBookings = passengers.reduce((sum: number, booking: any) => {
        const bookingAmount = booking.totalPrice || booking.amount || ride.price || 0;
        return sum + (Number(bookingAmount) || 0);
      }, 0);

      if (sumFromBookings > 0) {
        return sumFromBookings;
      }
    }

    // Fallback to price * bookedSeats
    return (ride.price || 0) * (ride.bookedSeats || passengers.length || 1);
  }, [ride, passengers]);

  const pendingCount = passengers.filter((p: any) =>
    p.paymentStatus === 'pending' || p.paymentStatus === 'PENDING'
  ).length;

  const handleGenerateQR = () => {
    if (totalAmount <= 0) {
      Alert.alert('Error', 'Invalid amount. Cannot generate QR code.');
      return;
    }
    setShowQRModal(true);
  };

  return (
    <>
      <View style={[styles.card, style]}>
        <View style={styles.header}>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeCity}>{ride.from?.city || 'Origin'}</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {ride.from?.address || ''}
                </Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeCity}>{ride.to?.city || 'Destination'}</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {ride.to?.address || ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.gray} />
            <Text style={styles.detailText}>{formatTime(ride.departureTime)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={Colors.gray} />
            <Text style={styles.detailText}>{passengers.length} passenger(s)</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.warning} />
            <Text style={[styles.detailText, styles.amountText]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentStatus}>
          <View style={styles.paymentStatusBadge}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
            <Text style={styles.paymentStatusText}>
              {pendingCount} payment(s) pending
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/ride/${rideId}`)}
          >
            <Ionicons name="eye-outline" size={18} color={Colors.primary} />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleGenerateQR}
          >
            <Ionicons name="qr-code" size={18} color="white" />
            <Text style={styles.qrButtonText}>Generate QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QR Code Generator Modal */}
      {showQRModal && rideId && (
        <QRCodeGenerator
          visible={showQRModal}
          rideId={String(rideId)}
          rideDetails={{
            from: ride.from?.city || ride.from?.address,
            to: ride.to?.city || ride.to?.address,
            totalAmount: totalAmount,
            passengerCount: passengers.length,
          }}
          onClose={() => {
            setShowQRModal(false);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  header: {
    marginBottom: 12,
  },
  routeInfo: {
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  routeAddress: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.lightGray,
    marginLeft: 5,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: Colors.gray,
  },
  amountText: {
    color: Colors.text,
    fontWeight: '600',
  },
  paymentStatus: {
    marginBottom: 12,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  paymentStatusText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightPrimary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  qrButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
