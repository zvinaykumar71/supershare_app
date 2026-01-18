import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trackingService } from '../services/trackingService';

// ==================== DRIVER HOOKS ====================

/**
 * Hook to get driver's active ride
 */
export const useDriverActiveRide = () => {
  return useQuery({
    queryKey: ['driver-active-ride'],
    queryFn: () => trackingService.getDriverActiveRide(),
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: false,
  });
};

/**
 * Hook to start a ride
 */
export const useStartRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, location }: { rideId: string; location?: { lat: number; lng: number } }) =>
      trackingService.startRide(rideId, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      // Invalidate passenger queries so they see the ride status update
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-active-rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride-tracking'] });
    },
  });
};

/**
 * Hook to update driver location
 */
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, location }: { rideId: string; location: { lat: number; lng: number; heading?: number; speed?: number } }) =>
      trackingService.updateLocation(rideId, location),
    onSuccess: () => {
      // Silently update - don't invalidate to avoid re-renders
    },
  });
};

/**
 * Hook to complete a ride
 */
export const useCompleteRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => trackingService.completeRide(rideId),
    onSuccess: () => {
      // Invalidate all ride-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['all-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-rides'] });
      // Invalidate passenger queries so they see the completed status
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['passenger-active-rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
    },
  });
};

/**
 * Hook to get passengers for a ride
 */
export const useRidePassengers = (rideId: string) => {
  return useQuery({
    queryKey: ['ride-passengers', rideId],
    queryFn: () => trackingService.getRidePassengers(rideId),
    enabled: !!rideId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// ==================== PASSENGER HOOKS ====================

/**
 * Hook to get ride tracking info
 */
export const useRideTracking = (rideId: string) => {
  return useQuery({
    queryKey: ['ride-tracking', rideId],
    queryFn: () => trackingService.getRideTracking(rideId),
    enabled: !!rideId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};

/**
 * Hook to get passenger's active rides
 */
export const usePassengerActiveRides = () => {
  return useQuery({
    queryKey: ['passenger-active-rides'],
    queryFn: () => trackingService.getPassengerActiveRides(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

