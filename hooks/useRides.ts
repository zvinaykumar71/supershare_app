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
