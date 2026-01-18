import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { useAuth } from './useAuth';

/**
 * Hook to check if the current driver has an active ride
 * Returns:
 * - hasActiveRide: boolean indicating if driver has an active ride
 * - activeRide: the active ride data if exists
 * - isLoading: loading state
 * - refetch: function to refetch the data
 */
export const useDriverActiveRide = () => {
  const { user } = useAuth();
  const isDriver = !!user?.isDriver;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-active-ride'],
    queryFn: async () => {
      try {
        const response = await rideService.getDriverCurrentRide();
        return response;
      } catch (error) {
        // If no active ride found, return null
        return null;
      }
    },
    enabled: isDriver, // Only fetch if user is a driver
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Check if driver has an active ride
  // Active ride = ride that hasn't departed yet, is currently in progress, OR has pending payments
  // Exclude only completed (with all payments) and cancelled rides
  const ride = data?.ride || data?.currentRide || null;
  const rideStatus = ride?.rideStatus || ride?.status;
  const paymentStatus = ride?.paymentStatus || ride?.allPaymentsCompleted;

  // Ride is considered active if:
  // 1. Not cancelled
  // 2. Not completed (rideStatus !== 'COMPLETED')
  // 3. OR if completed but payment is still pending (paymentStatus === 'PENDING' or allPaymentsCompleted === false)
  const isCancelled = rideStatus === 'cancelled' || rideStatus === 'CANCELLED';
  const isCompleted = rideStatus === 'completed' || rideStatus === 'COMPLETED';
  const hasPendingPayment = paymentStatus === 'PENDING' || paymentStatus === 'pending' ||
    ride?.allPaymentsCompleted === false ||
    (isCompleted && paymentStatus !== 'COMPLETED' && paymentStatus !== 'completed');

  // Ride stays active if it's not cancelled AND (not completed OR has pending payments)
  const hasActiveRide = !!(ride && !isCancelled && (!isCompleted || hasPendingPayment));
  const activeRide = hasActiveRide ? ride : null;
  const bookingRequests = data?.bookingRequests || [];

  return {
    hasActiveRide,
    activeRide,
    bookingRequests,
    isLoading,
    isRefetching,
    refetch,
    isDriver,
  };
};

/**
 * Helper hook to determine what mode the driver should be in
 * - 'driver': Driver has an active ride (scheduled, in_progress, or completed with pending payments)
 * - 'passenger': Driver has no active ride, show passenger features + offer ride button
 * - 'user': Not a driver, show only passenger features
 */
export const useUserMode = () => {
  const { user } = useAuth();
  const { hasActiveRide, activeRide, bookingRequests, isLoading, isRefetching, refetch } = useDriverActiveRide();

  const isDriver = !!user?.isDriver;

  let mode: 'driver' | 'passenger' | 'user';

  if (!isDriver) {
    mode = 'user'; // Regular user, not a driver
  } else if (hasActiveRide) {
    mode = 'driver'; // Driver mode active - has an active ride
  } else {
    mode = 'passenger'; // Driver without active ride - show passenger mode with "Offer Ride" option
  }

  return {
    mode,
    isDriver,
    hasActiveRide,
    activeRide,
    bookingRequests,
    isLoading,
    refetch,
    // Convenience booleans
    canOfferRide: isDriver, // Can always offer ride if driver (even in passenger mode)
    showDriverFeatures: hasActiveRide, // Only show driver features when there's an active ride
    showPassengerFeatures: !hasActiveRide, // Show passenger features when no active ride
    isRefetching,
  };
};

