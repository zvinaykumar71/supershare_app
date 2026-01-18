// hooks/useNotificationsQuery.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationsByType,
} from '../services/notificationService';

/**
 * Hook to get all notifications with filters
 */
export const useNotifications = (filters = {}) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => getNotifications(filters),
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Hook to get unread notifications count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        return await getUnreadCount();
      } catch (error) {
        // Gracefully handle errors - return 0 instead of throwing
        console.warn('Failed to fetch unread count, using fallback:', error);
        return { unreadCount: 0 };
      }
    },
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false, // Don't retry on error to avoid spam
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to get notifications by type
 */
export const useNotificationsByType = (type, filters = {}) => {
  return useQuery({
    queryKey: ['notifications', 'type', type, filters],
    queryFn: () => getNotificationsByType(type, filters),
    enabled: !!type,
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId) => markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};
