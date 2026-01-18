import { Colors } from '@/Constants/Colors';
import { useGenerateQRCode } from '@/hooks/useWallet';
import { useRideBookingRequests } from '@/hooks/useRides';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeGeneratorProps {
  rideId: string;
  rideDetails?: {
    from?: string;
    to?: string;
    totalAmount?: number;
    passengerCount?: number;
  };
  onClose: () => void;
  visible: boolean;
}

export function QRCodeGenerator({ rideId, rideDetails, onClose, visible }: QRCodeGeneratorProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [paidBookings, setPaidBookings] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const generateQRMutation = useGenerateQRCode();

  // Fetch booking requests to get pending payments
  const { data: bookingRequestsData, refetch: refetchBookings } = useRideBookingRequests(rideId || '');

  // Update pending/paid bookings when booking requests data changes
  useEffect(() => {
    if (bookingRequestsData?.bookingRequests) {
      const completed = bookingRequestsData.bookingRequests.filter((b: any) =>
        b.status === 'completed' || b.status === 'confirmed'
      );
      const pending = completed.filter((b: any) =>
        b.paymentStatus === 'pending' || b.paymentStatus === 'PENDING' || !b.paymentStatus
      );
      const paid = completed.filter((b: any) =>
        b.paymentStatus === 'paid' || b.paymentStatus === 'PAID'
      );

      setPendingBookings(pending);
      setPaidBookings(paid);

      // Calculate payment status
      if (completed.length > 0) {
        const totalAmount = completed.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        const receivedAmount = paid.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        setPaymentStatus({
          totalPassengers: completed.length,
          paidCount: paid.length,
          pendingCount: pending.length,
          totalAmount,
          receivedAmount,
          remainingAmount: totalAmount - receivedAmount,
          allPaymentsCompleted: paid.length === completed.length && receivedAmount >= totalAmount
        });
      }
    }
  }, [bookingRequestsData]);

  // Auto-refresh payment status every 5 seconds when modal is open and QR is displayed
  useEffect(() => {
    if (!visible || !qrData) return;

    const refreshInterval = setInterval(() => {
      refetchBookings();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [visible, qrData, refetchBookings]);

  // When pending bookings change (payment made), clear current QR to allow generating new one
  useEffect(() => {
    if (qrData && pendingBookings.length === 0 && paymentStatus?.allPaymentsCompleted) {
      // All payments completed, clear QR and show success
      setTimeout(() => {
        setQrData(null);
        setPaymentDetails(null);
        setSelectedBooking(null);
      }, 2000); // Wait 2 seconds to show completion message
    } else if (qrData && selectedBooking) {
      // If a specific booking was paid, check if it's no longer in pending list
      const bookingStillPending = pendingBookings.some((b: any) =>
        b._id === selectedBooking._id
      );
      if (!bookingStillPending && selectedBooking._id) {
        // This booking was paid, clear QR to allow generating for next passenger
        setTimeout(() => {
          setQrData(null);
          setPaymentDetails(null);
          setSelectedBooking(null);
          refetchBookings(); // Refresh to get updated list
        }, 1500);
      }
    }
  }, [pendingBookings, paymentStatus, qrData, selectedBooking, refetchBookings]);

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!visible) {
      // Reset when modal closes
      setQrData(null);
      setPaymentDetails(null);
      setIsGenerating(false);
      setSelectedBooking(null);
    } else {
      // When modal opens, refetch booking requests to get latest payment status
      refetchBookings();
    }
  }, [visible, refetchBookings]);

  // Reset state when modal closes
  const handleClose = () => {
    setQrData(null);
    setPaymentDetails(null);
    setIsGenerating(false);
    onClose();
  };

  const handleGenerateQR = async (booking?: any) => {
    // Prevent multiple simultaneous requests
    if (isGenerating || generateQRMutation.isPending) {
      return;
    }

    // Validate rideId before making request
    if (!rideId) {
      Alert.alert('Error', 'Ride ID is missing. Please try again.');
      return;
    }

    // Use booking amount if provided, otherwise use total amount
    const amount = booking?.amount || rideDetails?.totalAmount || 0;
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Invalid amount. Please ensure the ride has a valid total amount.');
      return;
    }

    console.log('Generating QR for Ride:', rideId, 'Amount:', amount, 'Booking:', booking?._id);
    setIsGenerating(true);
    setSelectedBooking(booking || null);

    try {
      const response: any = await (generateQRMutation.mutateAsync as any)({
        rideId,
        amount,
        bookingId: booking?._id || null,
      });

      console.log('QR Generation Response:', response);
      setIsGenerating(false);

      // Validate response
      if (!response) {
        throw new Error('Invalid response from server');
      }

      // QR data should contain rideId, amount, timestamp, etc.
      const qrPayload = {
        qrCode: response.qrCode,
        rideId: response.rideId || rideId,
        bookingId: booking?._id || response.bookingId || null,
        amount: response.amount || amount,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      // Validate required fields
      if (!qrPayload.rideId || !qrPayload.qrCode) {
        throw new Error('Invalid QR code data from server');
      }

      // Use qrData from response (JSON string) or generate from payload
      const qrDataString = response.qrData || JSON.stringify(qrPayload);
      setQrData(qrDataString);
      setPaymentDetails({
        ...response,
        qrCodeImage: response.qrCodeImage, // Backend-generated QR image
      });

      // Update payment status and bookings from response
      if (response.paymentStatus) {
        setPaymentStatus(response.paymentStatus);
      }
      if (response.pendingBookings) {
        setPendingBookings(response.pendingBookings);
      }
      if (response.paidBookings) {
        setPaidBookings(response.paidBookings);
      }

      setIsGenerating(false);
    } catch (error: any) {
      setIsGenerating(false);
      console.error('QR Generation Error Details:', {
        error,
        rideId,
        message: error?.message,
        status: error?.status,
        responseData: error?.response?.data,
      });

      // Show user-friendly error message
      let errorMessage = 'Failed to generate QR code';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Extract validation errors
        const errorMessages = error.response.data.errors
          .map((err: any) => err.msg || err.message)
          .filter(Boolean);
        errorMessage = errorMessages.length > 0
          ? errorMessages.join('\n')
          : 'Validation error. Please check the ride details.';
      } else if (error?.status === 400) {
        errorMessage = 'Invalid ride data. Please ensure the ride has ended and has a valid amount.';
      } else if (error?.status === 404) {
        errorMessage = 'Ride not found. Please try refreshing.';
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to generate QR code for this ride.';
      }

      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      // Prevent modal from closing on Android back button during generation
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment QR Code</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isGenerating || generateQRMutation.isPending}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {!qrData ? (
              <View style={styles.generateSection}>
                <Ionicons name="qr-code-outline" size={64} color={Colors.primary} />
                <Text style={styles.generateTitle}>Generate Payment QR Code</Text>
                <Text style={styles.generateSubtitle}>
                  {pendingBookings.length > 0
                    ? `Select a passenger to generate QR code for payment`
                    : 'Share this QR code with passengers to receive payment'}
                </Text>

                {rideDetails && (
                  <View style={styles.rideInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Route:</Text>
                      <Text style={styles.infoValue}>
                        {rideDetails.from || 'N/A'} → {rideDetails.to || 'N/A'}
                      </Text>
                    </View>
                    {paymentStatus && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Total Amount:</Text>
                          <Text style={styles.infoValue}>
                            {formatCurrency(paymentStatus.totalAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Received:</Text>
                          <Text style={[styles.infoValue, { color: Colors.success }]}>
                            {formatCurrency(paymentStatus.receivedAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Remaining:</Text>
                          <Text style={[styles.infoValue, { color: Colors.warning }]}>
                            {formatCurrency(paymentStatus.remainingAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Status:</Text>
                          <Text style={[styles.infoValue,
                          paymentStatus.allPaymentsCompleted ? { color: Colors.success } : { color: Colors.warning }
                          ]}>
                            {paymentStatus.paidCount}/{paymentStatus.totalPassengers} paid
                          </Text>
                        </View>
                      </>
                    )}
                    {!paymentStatus && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Amount:</Text>
                          <Text style={styles.infoValue}>
                            {formatCurrency(rideDetails.totalAmount || 0)}
                          </Text>
                        </View>
                        {rideDetails.passengerCount !== undefined && rideDetails.passengerCount !== null && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Passengers:</Text>
                            <Text style={styles.infoValue}>{String(rideDetails.passengerCount)}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* Show pending bookings for individual QR generation */}
                {pendingBookings.length > 0 && (
                  <View style={styles.pendingBookingsSection}>
                    <Text style={styles.pendingBookingsTitle}>Pending Payments</Text>
                    {pendingBookings.map((booking: any) => (
                      <TouchableOpacity
                        key={booking._id}
                        style={styles.bookingCard}
                        onPress={() => handleGenerateQR(booking)}
                        disabled={isGenerating || generateQRMutation.isPending}
                      >
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingPassengerName}>
                            {booking.passenger?.name || 'Passenger'}
                          </Text>
                          <Text style={styles.bookingAmount}>
                            {formatCurrency(booking.amount || 0)} • {booking.seats || 1} seat(s)
                          </Text>
                        </View>
                        <Ionicons name="qr-code" size={20} color={Colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Show paid bookings */}
                {paidBookings.length > 0 && (
                  <View style={styles.paidBookingsSection}>
                    <Text style={styles.paidBookingsTitle}>Paid ({paidBookings.length})</Text>
                    {paidBookings.map((booking: any) => (
                      <View key={booking._id} style={[styles.bookingCard, styles.paidBookingCard]}>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingPassengerName}>
                            {booking.passenger?.name || 'Passenger'}
                          </Text>
                          <Text style={styles.bookingAmount}>
                            {formatCurrency(booking.amount || 0)} • Paid ✓
                          </Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      </View>
                    ))}
                  </View>
                )}

                {/* Generate QR for total amount if no pending bookings shown or as fallback */}
                {pendingBookings.length === 0 && (
                  <TouchableOpacity
                    style={[styles.generateButton, (isGenerating || generateQRMutation.isPending) && styles.generateButtonDisabled]}
                    onPress={() => handleGenerateQR()}
                    disabled={isGenerating || generateQRMutation.isPending}
                  >
                    {(isGenerating || generateQRMutation.isPending) ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="qr-code" size={20} color="#fff" />
                        <Text style={styles.generateButtonText}>Generate QR Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.qrSection}>
                <Text style={styles.qrTitle}>Scan to Pay</Text>
                <Text style={styles.qrSubtitle}>
                  Passengers can scan this QR code to complete payment
                </Text>

                <View style={styles.qrContainer}>
                  {paymentDetails?.qrCodeImage ? (
                    // Use backend-generated QR image if available
                    <Image
                      source={{ uri: paymentDetails.qrCodeImage }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    // Fallback to frontend QR generation
                    <QRCode
                      value={qrData}
                      size={250}
                      color={Colors.text}
                      backgroundColor="white"
                      logo={undefined}
                    />
                  )}
                </View>

                {paymentDetails && (
                  <View style={styles.paymentInfo}>
                    {selectedBooking && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Passenger:</Text>
                        <Text style={styles.paymentValue}>
                          {selectedBooking.passenger?.name || 'Passenger'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>QR Code:</Text>
                      <Text style={[styles.paymentValue, { fontSize: 12 }]} numberOfLines={1}>
                        {paymentDetails.qrCode?.substring(0, 20)}...
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Amount:</Text>
                      <Text style={styles.paymentValue}>
                        {formatCurrency(paymentDetails.amount || 0)}
                      </Text>
                    </View>
                    {paymentDetails.paymentStatus && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Payment Progress:</Text>
                        <Text style={styles.paymentValue}>
                          {paymentDetails.paymentStatus.paidCount}/{paymentDetails.paymentStatus.totalPassengers} paid
                        </Text>
                      </View>
                    )}
                    {paymentDetails.paymentStatus && paymentDetails.paymentStatus.remainingAmount > 0 && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Remaining:</Text>
                        <Text style={[styles.paymentValue, { color: Colors.warning }]}>
                          {formatCurrency(paymentDetails.paymentStatus.remainingAmount)}
                        </Text>
                      </View>
                    )}
                    {paymentDetails.paymentStatus?.allPaymentsCompleted && (
                      <View style={[styles.paymentRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.lightGray }]}>
                        <View style={styles.successMessage}>
                          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                          <Text style={[styles.paymentValue, { color: Colors.success, fontWeight: 'bold', marginLeft: 8 }]}>
                            All payments completed!
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionText}>
                    1. Show this QR code to passengers{'\n'}
                    2. Passengers scan with their app{'\n'}
                    3. Payment will be credited to your wallet{'\n'}
                    4. Driver mode will remain active until all payments are received{'\n'}
                    5. Ride will be marked as completed after all payments
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={() => {
                      setQrData(null);
                      setPaymentDetails(null);
                      setSelectedBooking(null);
                    }}
                  >
                    <Ionicons name="refresh" size={18} color={Colors.primary} />
                    <Text style={styles.regenerateButtonText}>Generate New QR</Text>
                  </TouchableOpacity>

                  {pendingBookings.length > 0 && (
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={async () => {
                        // Refresh payment status by generating QR again (will get updated status)
                        try {
                          const response: any = await (generateQRMutation.mutateAsync as any)({
                            rideId,
                            amount: rideDetails?.totalAmount || 0,
                          });
                          if (response.paymentStatus) {
                            setPaymentStatus(response.paymentStatus);
                            setPendingBookings(response.pendingBookings || []);
                            setPaidBookings(response.paidBookings || []);
                          }
                        } catch (error) {
                          console.error('Error refreshing payment status:', error);
                        }
                      }}
                    >
                      <Ionicons name="reload" size={18} color={Colors.primary} />
                      <Text style={styles.regenerateButtonText}>Refresh Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    minHeight: '60%', // Ensure modal has a reasonable minimum height
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 30,
  },
  generateSection: {
    alignItems: 'center',
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  generateSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  rideInfo: {
    width: '100%',
    backgroundColor: Colors.lightGray + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  paymentInfo: {
    width: '100%',
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  paymentValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  pendingStatus: {
    color: Colors.warning,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  instructions: {
    width: '100%',
    backgroundColor: Colors.lightGray + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 8,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 8,
  },
  regenerateButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBookingsSection: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  pendingBookingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paidBookingsSection: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  paidBookingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 12,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightPrimary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paidBookingCard: {
    backgroundColor: Colors.lightGray + '40',
    opacity: 0.7,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingPassengerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bookingAmount: {
    fontSize: 13,
    color: Colors.gray,
  },
});
