// services/notificationService.js
import { api } from './api';

/**
 * Get all notifications with optional filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.type - Filter by notification type
 * @param {boolean} params.isRead - Filter by read status
 * @param {string} params.priority - Filter by priority (low/medium/high/urgent)
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 * @returns {Promise<Object>} Object with unreadCount
 */
export const getUnreadCount = async () => {
  try {
    // Try the standard endpoint first
    const response = await api.get('/notifications/unread/count');
    return response.data;
  } catch (error) {
    // Handle network errors (server unreachable, no internet, etc.)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('Network error fetching unread count - server may be unreachable');
      return { unreadCount: 0 };
    }
    
    // If 404, try alternative endpoints
    if (error.response?.status === 404) {
      try {
        // Try alternative endpoint paths
        const alternatives = [
          '/notifications/count/unread',
          '/notifications/unread-count',
          '/notifications?isRead=false&limit=1', // Fallback: get notifications and count
        ];
        
        for (const endpoint of alternatives) {
          try {
            if (endpoint.includes('?')) {
              // For query-based endpoint, count from response
              const response = await api.get(endpoint);
              const count = response.data?.notifications?.filter((n) => !n.isRead).length || 
                           response.data?.total || 0;
              return { unreadCount: count };
            } else {
              const response = await api.get(endpoint);
              return response.data;
            }
          } catch (altError) {
            continue; // Try next alternative
          }
        }
        
        // If all alternatives fail, return 0 as fallback
        console.warn('Unread count endpoint not found, returning 0');
        return { unreadCount: 0 };
      } catch (fallbackError) {
        console.warn('Error fetching unread count from alternatives:', fallbackError);
        return { unreadCount: 0 };
      }
    }
    
    // For other errors, log and return 0
    console.warn('Error fetching unread count:', error.response?.status || error.message || error);
    return { unreadCount: 0 };
  }
};

/**
 * Get notifications by type
 * @param {string} type - Notification type
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Notifications of specified type
 */
export const getNotificationsByType = async (type, params = {}) => {
  try {
    const response = await api.get(`/notifications/type/${type}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Result with modifiedCount
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read/all');
    return response.data;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Success message
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all read notifications
 * @returns {Promise<Object>} Result with deletedCount
 */
export const deleteAllRead = async () => {
  try {
    const response = await api.delete('/notifications/read/all');
    return response.data;
  } catch (error) {
    console.error('Error deleting all read notifications:', error);
    throw error;
  }
};
