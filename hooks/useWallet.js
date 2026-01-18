// hooks/useWallet.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMoney,
  confirmQRPayment,
  generateQRCode,
  getTransactions,
  getWalletBalance,
  withdrawMoney,
} from '../services/walletService';

/**
 * Hook to get wallet balance
 */
export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => getWalletBalance(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to get wallet transactions
 */
export const useTransactions = (params = {}) => {
  return useQuery({
    queryKey: ['wallet', 'transactions', params],
    queryFn: () => getTransactions(params),
  });
};

/**
 * Hook to add money to wallet
 */
export const useAddMoney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, paymentMethod }) => addMoney(amount, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
};

/**
 * Hook to withdraw money from wallet
 */
export const useWithdrawMoney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, accountNumber, ifscCode }) =>
      withdrawMoney(amount, accountNumber, ifscCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
};

/**
 * Hook to generate QR code for ride payment (Driver)
 */
export const useGenerateQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, amount, bookingId }) => generateQRCode(rideId, amount, bookingId),
    onSuccess: () => {
      // Invalidate ride queries to refresh payment status
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
    },
  });
};

/**
 * Hook to confirm payment via QR code (User/Passenger)
 */
export const useConfirmQRPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qrData) => confirmQRPayment(qrData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['passengerBookingRequests'] });
      
      // Invalidate driver active ride to check if all payments are completed
      // If all payments completed, ride will be marked as COMPLETED and driver mode will become inactive
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      // Invalidate booking requests to refresh pending payments list
      queryClient.invalidateQueries({ queryKey: ['ride-booking-requests'] });
      
      // Check if ride is now fully completed (all payments received)
      if (data?.ride?.allPaymentsCompleted || data?.allPaymentsCompleted || data?.rideCompleted) {
        // Ride is now fully completed, driver mode will become inactive
        queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      }
    },
  });
};
