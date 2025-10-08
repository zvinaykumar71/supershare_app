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

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => bookingService.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};

// export const useAcceptBooking = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id) => bookingService.acceptBooking(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
//     },
//   });
// };


export const useAcceptBooking = () => {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/bookings/${bookingId}/respond`, {
        action: 'accept'
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};

// export const useRejectBooking = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id) => bookingService.rejectBooking(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
//     },
//   });
// };

export const useRejectBooking = () => {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/bookings/${bookingId}/respond`, {
        action: 'reject'
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};

export const useUpcomingBookings = () => {
  return useQuery({
    queryKey: ['bookings', 'upcoming'],
    queryFn: () => bookingService.getPassengerRequestsBookings({ type: 'upcoming' }),
  });
};


export const usePassengerBookingRequests = () => {
  return useQuery({
    queryKey: ['passengerBookingRequests'],
    queryFn: () => bookingService.getPassengerRequestsBookings(),
  });
};
