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
  // Active ride = ride that hasn't departed yet or is currently in progress
  const hasActiveRide = !!(data?.ride || data?.currentRide);
  const activeRide = data?.ride || data?.currentRide || null;
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
 * - 'driver': Driver has active ride, show driver features
 * - 'passenger': Driver has no active ride, show passenger features + offer ride button
 * - 'user': Not a driver, show only passenger features
 */
export const useUserMode = () => {
  const { user } = useAuth();
  const { hasActiveRide, activeRide, bookingRequests, isLoading, refetch } = useDriverActiveRide();

  const isDriver = !!user?.isDriver;

  let mode: 'driver' | 'passenger' | 'user';
  
  if (!isDriver) {
    mode = 'user'; // Regular user, not a driver
  } else if (hasActiveRide) {
    mode = 'driver'; // Driver with active ride
  } else {
    mode = 'passenger'; // Driver without active ride (can use passenger features)
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
    canOfferRide: isDriver && !hasActiveRide,
    showDriverFeatures: isDriver && hasActiveRide,
    showPassengerFeatures: !isDriver || !hasActiveRide,
  };
};

