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
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
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

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookingId) => bookingService.acceptBooking(bookingId),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      // Also invalidate passenger booking requests so passenger sees the accepted ride
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookingId) => bookingService.rejectBooking(bookingId),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
    },
  });
};

export const useCancelBookingAsDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, reason }) => bookingService.cancelBookingAsDriver(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-ride-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
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

/**
 * Hook to get passenger's active bookings with polling
 * This is used to get real-time updates when a ride is in progress
 */
export const usePassengerActiveBookings = (enablePolling = false) => {
  return useQuery({
    queryKey: ['passengerBookingRequests'],
    queryFn: () => bookingService.getPassengerRequestsBookings(),
    // Poll every 10 seconds when enabled (when user has active rides)
    refetchInterval: enablePolling ? 10000 : false,
    refetchIntervalInBackground: false,
  });
};
