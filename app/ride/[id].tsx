import { BookingRequestCard } from '@/components/shared/BookingRequestCard';
import { QRCodeGenerator } from '@/components/wallet/QRCodeGenerator';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/Constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useAcceptBooking, useCancelBookingAsDriver, useRejectBooking, useUserBookings } from '@/hooks/useBookings';
import { useRide, useRideBookingRequests, useCancelRide } from '@/hooks/useRides';
import { useStartRide } from '@/hooks/useTracking';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



export default function RideDetailScreen() {
  const { id } = useLocalSearchParams();
  const rideId = Array.isArray(id) ? id[0] : id?.toString();

  const { data: ride, isLoading } = useRide(rideId || '');
  const { user } = useAuth();

  // Use the actual booking requests API for this specific ride
  const { data: bookingRequestsData, isLoading: isLoadingRequests } = useRideBookingRequests(rideId || '');

  // console.log("vinay here is booking request data==>",bookingRequestsData)

  // Get user's own bookings (for passenger view)
  const { data: bookingsData } = useUserBookings();

  // Check if current user is the driver of this ride
  const isDriver = user?.isDriver && ride?.driver?.id === user?.id;

  // Get user's booking for this ride (if passenger has booked)
  const userBooking = useMemo(() => {
    if (!bookingsData?.asPassenger || !rideId) return null;
    return (bookingsData.asPassenger || []).find((booking: any) =>
      booking.ride?._id === rideId
    );
  }, [bookingsData, rideId]);

  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const { mutate: rejectBooking, isPending: isRejecting } = useRejectBooking();
  const { mutate: cancelBookingAsDriver, isPending: isCancellingAsDriver } = useCancelBookingAsDriver();
  const { mutate: startRide, isPending: isStarting } = useStartRide();
  const [showQRModal, setShowQRModal] = useState(false);

  // Check if ride can be started (has confirmed bookings and is scheduled)
  const confirmedBookings = bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'confirmed') || [];
  const canStartRide = isDriver && confirmedBookings.length > 0 && ride?.rideStatus === 'scheduled';
  const isRideInProgress = ride?.rideStatus === 'in_progress';
  const isRideCompleted = ride?.rideStatus === 'completed' || ride?.rideStatus === 'COMPLETED';

  // Get completed bookings for payment info
  const completedBookings = useMemo(() => {
    if (!bookingRequestsData?.bookingRequests) return [];
    return bookingRequestsData.bookingRequests.filter((b: any) =>
      b.status === 'completed' || b.status === 'confirmed'
    );
  }, [bookingRequestsData]);

  // Calculate payment totals
  const paymentInfo = useMemo(() => {
    const paid = completedBookings.filter((b: any) =>
      b.paymentStatus === 'paid' || b.paymentStatus === 'PAID'
    );
    const pending = completedBookings.filter((b: any) =>
      b.paymentStatus === 'pending' || b.paymentStatus === 'PENDING' || !b.paymentStatus
    );

    const totalExpected = completedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
    const totalReceived = paid.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
    const totalPending = pending.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

    return {
      totalPassengers: completedBookings.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      totalExpected,
      totalReceived,
      totalPending,
      allPaymentsCompleted: ride?.allPaymentsCompleted || (paid.length === completedBookings.length && completedBookings.length > 0),
      paymentStatus: ride?.paymentStatus || 'pending'
    };
  }, [completedBookings, ride]);

  // Calculate ride duration
  const rideDuration = useMemo(() => {
    const rideData = ride as any;
    if (!rideData?.startedAt || !rideData?.completedAt) return null;
    const start = new Date(rideData.startedAt);
    const end = new Date(rideData.completedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [ride]);

  const handleStartRide = () => {
    if (!rideId) return;

    Alert.alert(
      'Start Ride',
      `Are you sure you want to start this ride? ${confirmedBookings.length} passenger(s) will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Ride',
          onPress: () => {
            startRide(
              { rideId: rideId },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Ride started! You can now track your ride.', [
                    { text: 'Go to Active Ride', onPress: () => router.push({ pathname: '/ride/active', params: { rideId } }) }
                  ]);
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

  const handleGoToActiveRide = () => {
    router.push({ pathname: '/ride/active', params: { rideId } });
  };

  const { mutate: cancelRide, isPending: isCancellingRide } = useCancelRide();

  const handleCancelRide = () => {
    if (!rideId) return;

    const confirmedCount = bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'confirmed')?.length || 0;
    const penaltyMsg = confirmedCount > 0
      ? `\n\nNote: Since you have ${confirmedCount} confirmed booking(s), a penalty of ₹${confirmedCount} (₹1 per passenger) will be deducted from your wallet.`
      : '';

    Alert.alert(
      'Cancel Ride',
      `Are you sure you want to cancel this ride? This action cannot be undone.${penaltyMsg}`,
      [
        { text: 'No, Keep Ride', style: 'cancel' },
        {
          text: 'Yes, Cancel Ride',
          style: 'destructive',
          onPress: () => {
            cancelRide(rideId, {
              onSuccess: (data: any) => {
                const message = data.penaltyApplied
                  ? `Ride cancelled successfully. ${data.message}`
                  : 'Ride cancelled successfully.';
                Alert.alert('Success', message, [
                  { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') }
                ]);
              },
              onError: (error: any) => {
                Alert.alert('Error', error.response?.data?.message || 'Failed to cancel ride. Please check your wallet balance.');
              }
            });
          }
        }
      ]
    );
  };

  const handleEditRide = () => {
    if (ride?.bookedSeats > 0) {
      Alert.alert('Cannot Edit', 'This ride has existing bookings and cannot be edited. Please contact passengers or cancel the ride if necessary.');
      return;
    }
    // Navigate to edit screen
    router.push({ pathname: '/ride/create' as any, params: { editId: rideId } });
  };

  // const handleAccept = (bookingId: string) => {
  //   acceptBooking(bookingId as any);
  // };

  const handleAccept = (bookingId: string) => {

    // Find the booking to get the requested seats
    const booking = bookingRequestsData?.bookingRequests?.find((b: any) => b._id === bookingId || b.id === bookingId);
    const requestedSeats = booking?.seats || 1;
    const availableSeats = bookingRequestsData?.rideDetails?.availableSeats ?? ride?.availableSeats ?? 0;

    // Check if there are enough available seats
    if (availableSeats < requestedSeats) {
      Alert.alert(
        "Cannot Accept Booking",
        `Not enough seats available. Requested: ${requestedSeats}, Available: ${availableSeats}`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Accept Booking Request",
      `Accept booking for ${requestedSeats} seat(s)?\n\nAvailable after: ${availableSeats - requestedSeats} seats`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Accept",
          onPress: () => {
            (acceptBooking as any)(bookingId, {
              onSuccess: (data: any) => {
                // The query invalidation in the hook will automatically refresh the data
                Alert.alert("Success", "Booking request accepted successfully!");
              },
              onError: (error: any) => {
                console.error('Error accepting booking:', error);
                console.error('Error details:', error.response?.data);

                let errorMessage = 'Failed to accept booking request';

                if (error.response?.status === 500) {
                  errorMessage = 'Server error. This may be due to insufficient seats or a backend issue. Please check available seats and try again.';
                } else if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                }

                Alert.alert("Error", errorMessage);
              }
            });
          }
        }
      ]
    );
  };



  // const handleReject = (bookingId: string) => {
  //   rejectBooking(bookingId as any);
  // };


  const handleReject = (bookingId: string) => {
    Alert.alert(
      "Reject Booking Request",
      "Are you sure you want to reject this booking request?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            (rejectBooking as any)(bookingId, {
              onSuccess: (data: any) => {
                // The query invalidation in the hook will automatically refresh the data
                Alert.alert("Success", "Booking request rejected successfully!");
              },
              onError: (error: any) => {
                console.error('Error rejecting booking:', error);
                const errorMessage = error.response?.data?.message || 'Failed to reject booking request';
                Alert.alert("Error", errorMessage);
              }
            });
          }
        }
      ]
    );
  };

  const handleCancelCustomer = (bookingId: string) => {
    Alert.alert(
      "Cancel Customer Booking",
      "Are you sure you want to cancel this customer's booking? This action cannot be undone.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            (cancelBookingAsDriver as any)({ bookingId, reason: 'Driver cancelled' }, {
              onSuccess: (data: any) => {
                Alert.alert("Success", "Customer booking cancelled successfully!");
              },
              onError: (error: any) => {
                console.error('Error cancelling booking:', error);
                const errorMessage = error.response?.data?.message || 'Failed to cancel customer booking';
                Alert.alert("Error", errorMessage);
              }
            });
          }
        }
      ]
    );
  };



  const handleBookRide = () => {
    router.push({ pathname: '/ride/book', params: { id: ride?.id } });

  };

  const handleContactDriver = () => {
    if (ride?.driver?.phone) {
      Linking.openURL(`tel:${ride.driver.phone}`);
    }
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
        <Text style={{ color: 'white' }}>Ride not found</Text>
      </View>
    );
  }

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
            <Ionicons name="calendar" size={20} color={Colors.gray} />
            <Text style={styles.infoText}>{formatDate(ride.date)}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="pricetag" size={20} color={Colors.gray} />
            <Text style={styles.infoText}>{formatCurrency(ride.price)} per seat</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color={Colors.gray} />
            <Text style={styles.infoText}>{ride.availableSeats} of {ride.totalSeats} seats available</Text>
          </View>
        </View>
      </View>

      {/* Driver Card - Only show for passengers (not for the driver viewing their own ride) */}
      {!isDriver && (
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <Image source={{ uri: ride.driver.avatar }} style={styles.driverAvatar} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.name}</Text>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color={Colors.warning} />
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
            <Ionicons name="car" size={20} color={Colors.gray} />
            <Text style={styles.carText}>{ride.car.model} • {ride.car.color} • {ride.car.plate}</Text>
          </View>

          <TouchableOpacity style={styles.contactButton} onPress={handleContactDriver}>
            <Ionicons name="call" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Contact driver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Status Section - Show for passengers who have booked this ride */}
      {!isDriver && userBooking && (
        <View style={styles.bookingStatusSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Booking</Text>
            <View style={[
              styles.statusBadge,
              userBooking.status === 'confirmed' && styles.statusConfirmed,
              userBooking.status === 'pending' && styles.statusPending,
              userBooking.status === 'rejected' && styles.statusRejected,
              userBooking.status === 'cancelled' && styles.statusCancelled,
            ]}>
              <Text style={styles.statusText}>
                {userBooking.status?.charAt(0).toUpperCase() + userBooking.status?.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailLabel}>Seats booked:</Text>
              <Text style={styles.bookingDetailValue}>{userBooking.seats}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailLabel}>Total price:</Text>
              <Text style={styles.bookingDetailValue}>{formatCurrency(userBooking.totalPrice)}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailLabel}>Pickup:</Text>
              <Text style={styles.bookingDetailValue}>{userBooking.pickupPoint}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailLabel}>Dropoff:</Text>
              <Text style={styles.bookingDetailValue}>{userBooking.dropoffPoint}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Seat Stats Section - Only show for drivers */}
      {isDriver && (
        <View style={styles.seatStatsCard}>
          <Text style={styles.seatStatsTitle}>Seat Status</Text>
          <View style={styles.seatStatsContainer}>
            <View style={styles.seatStatItem}>
              <View style={[styles.seatStatCircle, styles.availableCircle]}>
                <Text style={styles.seatStatNumber}>
                  {bookingRequestsData?.rideDetails?.availableSeats ?? ride?.availableSeats ?? 0}
                </Text>
              </View>
              <Text style={styles.seatStatLabel}>Available</Text>
            </View>

            <View style={styles.seatStatDivider} />

            <View style={styles.seatStatItem}>
              <View style={[styles.seatStatCircle, styles.bookedCircle]}>
                <Text style={styles.seatStatNumber}>
                  {bookingRequestsData?.rideDetails?.bookedSeats ?? 0}
                </Text>
              </View>
              <Text style={styles.seatStatLabel}>Booked</Text>
            </View>

            <View style={styles.seatStatDivider} />

            <View style={styles.seatStatItem}>
              <View style={[styles.seatStatCircle, styles.pendingCircle]}>
                <Text style={styles.seatStatNumber}>
                  {bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.reduce((sum: number, b: any) => sum + (b.seats || 1), 0) ?? 0}
                </Text>
              </View>
              <Text style={styles.seatStatLabel}>Pending</Text>
            </View>

            <View style={styles.seatStatDivider} />

            <View style={styles.seatStatItem}>
              <View style={[styles.seatStatCircle, styles.totalCircle]}>
                <Text style={styles.seatStatNumber}>
                  {ride?.totalSeats ?? 0}
                </Text>
              </View>
              <Text style={styles.seatStatLabel}>Total</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.seatProgressContainer}>
            <View style={styles.seatProgressBar}>
              <View
                style={[
                  styles.seatProgressBooked,
                  {
                    width: `${((bookingRequestsData?.rideDetails?.bookedSeats ?? 0) / (ride?.totalSeats || 1)) * 100}%`
                  }
                ]}
              />
              <View
                style={[
                  styles.seatProgressPending,
                  {
                    width: `${((bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.reduce((sum: number, b: any) => sum + (b.seats || 1), 0) ?? 0) / (ride?.totalSeats || 1)) * 100}%`
                  }
                ]}
              />
            </View>
            <View style={styles.seatProgressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Booked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.lightGray }]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Ride Actions Section - Only show for drivers before ride starts */}
      {isDriver && (ride?.rideStatus === 'scheduled' || ride?.rideStatus === 'CREATED') && (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Ride Actions</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditRide}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelRide}
              disabled={isCancellingRide}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>
                {isCancellingRide ? 'Cancelling...' : 'Cancel Ride'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.actionHint}>
            {ride?.bookedSeats > 0
              ? 'Cancellation fee applies as you have confirmed bookings.'
              : 'You can cancel this ride without any penalty as there are no bookings.'}
          </Text>
        </View>
      )}

      {/* Booking Requests Section - Only show for drivers */}
      {
        isDriver && (
          <View style={styles.bookingRequestsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Booking Requests</Text>
              <View style={styles.requestCount}>
                <Text style={styles.requestCountText}>
                  {isLoadingRequests ? '...' : bookingRequestsData?.bookingRequests?.filter((b: any) => b.status === 'pending')?.length || 0}
                </Text>
              </View>
            </View>

            {isLoadingRequests ? (
              <View style={styles.loadingRequests}>
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : bookingRequestsData?.bookingRequests?.length === 0 ? (
              <View style={styles.emptyRequests}>
                <Ionicons name="people-outline" size={48} color={Colors.gray} />
                <Text style={styles.emptyRequestsText}>No pending requests</Text>
                <Text style={styles.emptyRequestsSubtext}>When passengers request to book your ride, you'll see them here</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {bookingRequestsData?.bookingRequests?.map((booking: any) => (
                  <View key={booking._id || booking.id}>
                    <BookingRequestCard
                      booking={booking}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isAccepting={isAccepting}
                      isRejecting={isRejecting}
                      style={styles.requestCard}
                    />
                    {/* Show cancel button for confirmed bookings */}
                    {(booking.status === 'confirmed' || booking.status === 'accepted') && (
                      <TouchableOpacity
                        style={styles.cancelCustomerButton}
                        onPress={() => handleCancelCustomer(booking._id || booking.id)}
                        disabled={isCancellingAsDriver}
                      >
                        <Ionicons name="close-circle" size={18} color="#fff" />
                        <Text style={styles.cancelCustomerButtonText}>
                          {isCancellingAsDriver ? 'Cancelling...' : 'Cancel Customer'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )
      }

      {/* Start Ride Button - Only show for drivers with confirmed bookings */}
      {
        canStartRide && (
          <View style={styles.startRideSection}>
            <TouchableOpacity
              style={styles.startRideButton}
              onPress={handleStartRide}
              disabled={isStarting}
            >
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.startRideButtonText}>
                {isStarting ? 'Starting...' : `Start Ride (${confirmedBookings.length} passengers)`}
              </Text>
            </TouchableOpacity>
            <Text style={styles.startRideHint}>
              Start the ride when you're ready to pick up passengers
            </Text>
          </View>
        )
      }

      {/* Go to Active Ride Button - Only show when ride is in progress */}
      {
        isDriver && isRideInProgress && (
          <View style={styles.startRideSection}>
            <TouchableOpacity
              style={[styles.startRideButton, { backgroundColor: Colors.success }]}
              onPress={handleGoToActiveRide}
            >
              <Ionicons name="navigate" size={24} color="white" />
              <Text style={styles.startRideButtonText}>Go to Active Ride</Text>
            </TouchableOpacity>
            <Text style={styles.startRideHint}>
              Your ride is in progress. Track and manage it.
            </Text>
          </View>
        )
      }

      {/* Track Ride Button - For passengers with confirmed booking on in-progress ride */}
      {
        !isDriver && userBooking?.status === 'confirmed' && ride?.rideStatus === 'in_progress' && (
          <View style={styles.startRideSection}>
            <TouchableOpacity
              style={[styles.startRideButton, { backgroundColor: Colors.success }]}
              onPress={() => router.push({ pathname: '/ride/tracking', params: { id: rideId } })}
            >
              <Ionicons name="location" size={24} color="white" />
              <Text style={styles.startRideButtonText}>Track Your Ride</Text>
            </TouchableOpacity>
            <Text style={styles.startRideHint}>
              Your ride is in progress! Track the driver's location.
            </Text>
          </View>
        )
      }

      {/* Book Button - Only show for passengers who haven't booked this ride */}
      {
        !isDriver && !userBooking && ride.rideStatus !== 'in_progress' && ride.rideStatus !== 'completed' && (
          <View style={styles.actions}>
            <Button
              title={`Book seat • ${formatCurrency(ride.price)}`}
              onPress={handleBookRide}
              style={styles.bookButton}
            />
          </View>
        )
      }

      {/* Completed Ride Details Section */}
      {
        isRideCompleted && (
          <View style={styles.completedRideSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.sectionTitle}>Ride Completed</Text>
            </View>

            {/* Ride Completion Info */}
            <View style={styles.completionInfo}>
              {ride?.completedAt && (
                <View style={styles.completionItem}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.gray} />
                  <Text style={styles.completionText}>
                    Completed on {formatDate(ride.completedAt)} at {formatTime(ride.completedAt)}
                  </Text>
                </View>
              )}
              {rideDuration && (
                <View style={styles.completionItem}>
                  <Ionicons name="time-outline" size={20} color={Colors.gray} />
                  <Text style={styles.completionText}>Duration: {rideDuration}</Text>
                </View>
              )}
            </View>

            {/* Payment Status Section - For Drivers */}
            {isDriver && completedBookings.length > 0 && (
              <View style={styles.paymentStatusCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentTitle}>Payment Status</Text>
                  <View style={[
                    styles.paymentStatusBadge,
                    paymentInfo.allPaymentsCompleted ? styles.paymentCompleted : styles.paymentPending
                  ]}>
                    <Text style={styles.paymentStatusText}>
                      {paymentInfo.allPaymentsCompleted ? 'All Paid' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentStats}>
                  <View style={styles.paymentStatItem}>
                    <Text style={styles.paymentStatLabel}>Total Expected</Text>
                    <Text style={styles.paymentStatValue}>{formatCurrency(paymentInfo.totalExpected)}</Text>
                  </View>
                  <View style={styles.paymentStatItem}>
                    <Text style={styles.paymentStatLabel}>Received</Text>
                    <Text style={[styles.paymentStatValue, { color: Colors.success }]}>
                      {formatCurrency(paymentInfo.totalReceived)}
                    </Text>
                  </View>
                  <View style={styles.paymentStatItem}>
                    <Text style={styles.paymentStatLabel}>Pending</Text>
                    <Text style={[styles.paymentStatValue, { color: Colors.warning }]}>
                      {formatCurrency(paymentInfo.totalPending)}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentProgress}>
                  <View style={styles.paymentProgressBar}>
                    <View
                      style={[
                        styles.paymentProgressFill,
                        { width: `${paymentInfo.totalExpected > 0 ? (paymentInfo.totalReceived / paymentInfo.totalExpected) * 100 : 0}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.paymentProgressText}>
                    {paymentInfo.paidCount} of {paymentInfo.totalPassengers} passengers paid
                  </Text>
                </View>

                {/* Generate QR Button for Pending Payments */}
                {!paymentInfo.allPaymentsCompleted && (
                  <TouchableOpacity
                    style={styles.generateQRButton}
                    onPress={() => setShowQRModal(true)}
                  >
                    <Ionicons name="qr-code" size={20} color="white" />
                    <Text style={styles.generateQRButtonText}>Generate Payment QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Passenger List for Completed Rides */}
            {completedBookings.length > 0 && (
              <View style={styles.passengersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Passengers ({completedBookings.length})</Text>
                </View>

                {completedBookings.map((booking: any) => (
                  <View key={booking._id || booking.id} style={styles.passengerCard}>
                    <Image
                      source={{ uri: booking.passenger?.profilePicture || 'https://picsum.photos/100' }}
                      style={styles.passengerAvatar}
                    />
                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>{booking.passenger?.name || 'Passenger'}</Text>
                      <Text style={styles.passengerDetails}>
                        {booking.seats || 1} seat(s) • {formatCurrency(booking.totalPrice || 0)}
                      </Text>
                      {booking.pickupPoint && (
                        <Text style={styles.passengerLocation}>
                          <Ionicons name="location" size={12} color={Colors.gray} /> {booking.pickupPoint}
                        </Text>
                      )}
                    </View>
                    <View style={styles.passengerStatus}>
                      {booking.paymentStatus === 'paid' || booking.paymentStatus === 'PAID' ? (
                        <View style={[styles.paymentBadge, styles.paidBadge]}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                          <Text style={styles.paymentBadgeText}>Paid</Text>
                        </View>
                      ) : (
                        <View style={[styles.paymentBadge, styles.pendingBadge]}>
                          <Ionicons name="time-outline" size={16} color={Colors.warning} />
                          <Text style={styles.paymentBadgeText}>Pending</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Payment Info for Passengers */}
            {!isDriver && userBooking && (
              <View style={styles.passengerPaymentCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Payment</Text>
                  {userBooking.paymentStatus === 'paid' || userBooking.paymentStatus === 'PAID' ? (
                    <View style={[styles.paymentBadge, styles.paidBadge]}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={styles.paymentBadgeText}>Paid</Text>
                    </View>
                  ) : (
                    <View style={[styles.paymentBadge, styles.pendingBadge]}>
                      <Ionicons name="time-outline" size={16} color={Colors.warning} />
                      <Text style={styles.paymentBadgeText}>Pending</Text>
                    </View>
                  )}
                </View>
                <View style={styles.passengerPaymentDetails}>
                  <Text style={styles.passengerPaymentAmount}>
                    {formatCurrency(userBooking.totalPrice || 0)}
                  </Text>
                  <Text style={styles.passengerPaymentNote}>
                    {userBooking.paymentStatus === 'paid' || userBooking.paymentStatus === 'PAID'
                      ? 'Payment completed successfully'
                      : 'Payment pending - please pay the driver'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )
      }

      {/* QR Code Generator Modal */}
      {
        showQRModal && ride && ((ride as any)._id || (ride as any).id) && (
          <QRCodeGenerator
            visible={showQRModal}
            rideId={String((ride as any)._id || (ride as any).id)}
            rideDetails={{
              from: ride.from?.city || ride.from?.address,
              to: ride.to?.city || ride.to?.address,
              totalAmount: paymentInfo.totalPending || paymentInfo.totalExpected,
              passengerCount: completedBookings.length,
              _id: (ride as any)?._id || (ride as any)?.id,
            }}
            onClose={() => setShowQRModal(false)}
          />
        )
      }
    </ScrollView >
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
  completedRideSection: {
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
  completionInfo: {
    marginTop: 15,
    marginBottom: 20,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 14,
    color: Colors.gray,
  },
  paymentStatusCard: {
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  paymentCompleted: {
    backgroundColor: Colors.success,
  },
  paymentPending: {
    backgroundColor: Colors.warning,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  paymentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
  paymentStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  paymentProgress: {
    marginTop: 10,
  },
  paymentProgressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  paymentProgressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  paymentProgressText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  generateQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
  },
  generateQRButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  passengersSection: {
    marginTop: 20,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray + '40',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  passengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  passengerDetails: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  passengerLocation: {
    fontSize: 12,
    color: Colors.gray,
  },
  passengerStatus: {
    marginLeft: 10,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  paidBadge: {
    backgroundColor: Colors.success + '20',
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '20',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  passengerPaymentCard: {
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
  },
  passengerPaymentDetails: {
    marginTop: 10,
  },
  passengerPaymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  passengerPaymentNote: {
    fontSize: 14,
    color: Colors.gray,
  },
  bookingStatusSection: {
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
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusConfirmed: {
    backgroundColor: Colors.success,
  },
  statusPending: {
    backgroundColor: Colors.warning,
  },
  statusRejected: {
    backgroundColor: Colors.danger,
  },
  statusCancelled: {
    backgroundColor: Colors.gray,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDetailLabel: {
    color: Colors.gray,
    fontSize: 14,
  },
  bookingDetailValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
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
  loadingRequests: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: Colors.gray,
    fontSize: 14,
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
  cancelCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  cancelCustomerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Seat Stats Styles
  seatStatsCard: {
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
  seatStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  seatStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  seatStatItem: {
    alignItems: 'center',
  },
  seatStatCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  availableCircle: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bookedCircle: {
    backgroundColor: Colors.success + '20',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  pendingCircle: {
    backgroundColor: Colors.warning + '20',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  totalCircle: {
    backgroundColor: Colors.gray + '20',
    borderWidth: 2,
    borderColor: Colors.gray,
  },
  seatStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seatStatLabel: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  seatStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.lightGray,
  },
  seatProgressContainer: {
    marginTop: 8,
  },
  seatProgressBar: {
    height: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  seatProgressBooked: {
    backgroundColor: Colors.success,
    height: '100%',
  },
  seatProgressPending: {
    backgroundColor: Colors.warning,
    height: '100%',
  },
  seatProgressLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.gray,
  },
  // Ride Actions Styles
  actionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  editButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  cancelButton: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3008',
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 14,
    lineHeight: 18,
    opacity: 0.8,
  },
  // Start Ride Styles
  startRideSection: {
    margin: 20,
    marginTop: 0,
    alignItems: 'center',
  },
  startRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startRideButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startRideHint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 10,
    textAlign: 'center',
  },
});