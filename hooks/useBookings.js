import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';

export const useUserBookings = () => {
  return useQuery({
    queryKey: ['user-bookings'],
    queryFn: () => bookingService.getUserBookings(),
  });
};

export const useBooking = (id) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBooking(id),
    enabled: !!id,
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => bookingService.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};
