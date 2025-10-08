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
  // Backend returns rides offered by the authenticated driver at GET /rides
  return useQuery({
    queryKey: ['driver-rides'],
    queryFn: () => rideService.getAllRides(),
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
