import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { CreateRideData } from '../types/api';

export const useRides = (searchParams: any) => {
  return useQuery({
    queryKey: ['rides', searchParams],
    queryFn: () => searchParams ? rideService.searchRides(searchParams) : [],
    enabled: !!searchParams,
  });
};

export const useRide = (id: string) => {
  return useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRide(id),
    enabled: !!id,
  });
};

export const useUserRides = () => {
  return useQuery({
    queryKey: ['user-rides'],
    queryFn: () => rideService.getUserRides(),
  });
};

export const useAllRides = () => {
  return useQuery({
    queryKey: ['all-rides'],
    queryFn: () => rideService.getAllRides(),
  });
};

export const useDriverRides = () => {
  // Get driver's own rides including completed ones
  // Try getUserRides first (which calls /rides/my-rides), fallback to getAllRides
  return useQuery({
    queryKey: ['driver-rides'],
    queryFn: async () => {
      try {
        // First try the user-specific endpoint which should return driver's rides
        const userRides = await rideService.getUserRides();
        if (userRides && userRides.length > 0) {
          console.log('✅ [useDriverRides] Got rides from getUserRides:', userRides.length);
          return userRides;
        }
        // Fallback to getAllRides if getUserRides is empty
        console.log('⚠️ [useDriverRides] getUserRides empty, trying getAllRides');
        return await rideService.getAllRides({ includeCompleted: true, status: 'all' });
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        if (error.response?.status === 404) {
          console.log('⚠️ [useDriverRides] /rides/my-rides endpoint not found (404), using getAllRides fallback');
        } else {
          console.error('❌ [useDriverRides] Error:', error.message || error);
        }
        // Fallback to getAllRides on error
        try {
          return await rideService.getAllRides({ includeCompleted: true, status: 'all' });
        } catch (fallbackError: any) {
          console.error('❌ [useDriverRides] Fallback also failed:', fallbackError.message || fallbackError);
          return []; // Return empty array instead of throwing
        }
      }
    },
  });
};

/**
 * Hook to get ride history (completed rides)
 */
export const useRideHistory = () => {
  return useQuery({
    queryKey: ['ride-history'],
    queryFn: () => rideService.getRideHistory(),
  });
};

export const useUserBookings = () => {
  return useQuery({
    queryKey: ['user-bookings'],
    queryFn: () => rideService.getUserBookings(),
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideData: CreateRideData) => rideService.createRide(rideData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-rides'] });
    },
  });
};

export const useBookRide = () => {
  return useMutation({
    mutationFn: ({ rideId, seats }: { rideId: string; seats: number }) => rideService.bookRide(rideId, seats),
  });

};



export const useRideBookingRequests = (rideId: string) => {
  return useQuery({
    queryKey: ['ride-booking-requests', rideId],
    queryFn: () => rideService.getRideBookingRequests(rideId),
    enabled: !!rideId, // Only fetch when rideId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};


export const useCurrentRideRequests = () => {
  return useQuery({
    queryKey: ['current-ride-requests'],
    queryFn: () => rideService.getDriverCurrentRide(),
  });
}

export const useCancelRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => rideService.cancelRide(rideId),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['ride'] });
      queryClient.invalidateQueries({ queryKey: ['user-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-mode'] });
      queryClient.invalidateQueries({ queryKey: ['ride-history'] });
    },
  });
};

