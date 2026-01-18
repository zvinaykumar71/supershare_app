import { Colors } from '@/Constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteNotification, useMarkAllAsRead, useMarkAsRead, useNotifications, useUnreadCount } from '@/hooks/useNotificationsQuery';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Map backend notification types to display types
const mapNotificationType = (type: string) => {
  const typeMap: Record<string, string> = {
    'ride_created': 'booking_request',
    'booking_requested': 'booking_request',
    'booking_confirmed': 'booking_accepted',
    'booking_rejected': 'booking_rejected',
    'booking_cancelled': 'booking_rejected',
    'ride_started': 'ride_reminder',
    'ride_completed': 'booking_accepted',
    'ride_cancelled': 'booking_rejected',
    'ride_reminder': 'ride_reminder',
  };
  return typeMap[type] || 'booking_request';
};

const getNotificationStyle = (type: string) => {
  const displayType = mapNotificationType(type);
  switch (displayType) {
    case 'booking_request':
      return { borderLeftWidth: 4, borderLeftColor: Colors.primary };
    case 'booking_accepted':
      return { borderLeftWidth: 4, borderLeftColor: Colors.success };
    case 'booking_rejected':
      return { borderLeftWidth: 4, borderLeftColor: Colors.danger };
    case 'ride_reminder':
      return { borderLeftWidth: 4, borderLeftColor: Colors.warning };
    default:
      return {};
  }
};

const getNotificationIcon = (type: string) => {
  const displayType = mapNotificationType(type);
  switch (displayType) {
    case 'booking_request':
      return <Ionicons name="car-outline" size={24} color={Colors.primary} />;
    case 'booking_accepted':
      return <Ionicons name="checkmark-circle" size={24} color={Colors.success} />;
    case 'booking_rejected':
      return <Ionicons name="close-circle" size={24} color={Colors.danger} />;
    case 'ride_reminder':
      return <Ionicons name="time-outline" size={24} color={Colors.warning} />;
    default:
      return <Ionicons name="notifications-outline" size={24} color={Colors.gray} />;
  }
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const getRideDetails = (notification: any) => {
  if (notification.data?.from && notification.data?.to) {
    return `${notification.data.from.city || notification.data.from} → ${notification.data.to.city || notification.data.to}`;
  }
  return null;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'ride'>('all');
  const { data: notificationsData, isLoading, error, refetch, isRefetching } = useNotifications({ page: 1, limit: 50 });
  const { data: unreadData, error: unreadError } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const allNotifications = notificationsData?.notifications || [];
  // Calculate unread count from notifications if API endpoint fails
  const unreadCountFromList = allNotifications.filter((n: any) => !n.isRead).length;
  const unreadCount = unreadData?.unreadCount ?? unreadCountFromList;
  
  // Log notification updates for testing
  useEffect(() => {
    if (notificationsData) {
      console.log('📬 [NOTIFICATIONS] Received update:', {
        total: notificationsData?.notifications?.length || 0,
        unreadCount: unreadCount,
        timestamp: new Date().toISOString(),
      });
    }
  }, [notificationsData, unreadCount]);

  // Filter notifications based on selected filter
  const notifications = useMemo(() => {
    if (filter === 'all') return allNotifications;
    if (filter === 'unread') return allNotifications.filter((n: any) => !n.isRead);
    if (filter === 'booking') {
      return allNotifications.filter((n: any) => 
        n.type?.includes('booking') || n.type === 'booking_requested' || 
        n.type === 'booking_confirmed' || n.type === 'booking_rejected'
      );
    }
    if (filter === 'ride') {
      return allNotifications.filter((n: any) => 
        n.type?.includes('ride') || n.type === 'ride_started' || 
        n.type === 'ride_completed' || n.type === 'ride_cancelled'
      );
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  }, [markAsReadMutation]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, [markAllAsReadMutation]);

  const handleDelete = useCallback(async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(notificationId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  }, [deleteMutation]);

  // Handle notification tap - navigate to relevant screen
  const handleNotificationPress = useCallback(async (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification._id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type and data
    const rideId = notification.data?.rideId || notification.data?.ride?._id || notification.data?.ride?.id;
    const bookingId = notification.data?.bookingId || notification.data?.booking?._id || notification.data?.booking?.id;

    switch (notification.type) {
      case 'booking_requested':
      case 'ride_created':
        // Navigate to ride details or booking requests
        if (rideId) {
          router.push(`/ride/${rideId}`);
        } else if (user?.isDriver) {
          router.push('/(tabs)/my-rides');
        }
        break;
      
      case 'booking_confirmed':
      case 'booking_accepted':
        // Navigate to ride details or active rides
        if (rideId) {
          router.push(`/ride/${rideId}`);
        } else {
          router.push('/(tabs)/my-rides');
        }
        break;
      
      case 'ride_started':
        // Navigate to active ride or tracking
        if (rideId) {
          if (user?.isDriver) {
            router.push({ pathname: '/ride/active', params: { rideId } });
          } else {
            router.push({ pathname: '/ride/tracking', params: { id: rideId } });
          }
        }
        break;
      
      case 'ride_completed':
        // Navigate to ride history
        router.push('/(tabs)/my-rides');
        break;
      
      default:
        // For other types, try to navigate to ride if available
        if (rideId) {
          router.push(`/ride/${rideId}`);
        }
        break;
    }
  }, [markAsReadMutation, user]);

  const renderNotification = ({ item }: { item: any }) => {
    const rideDetails = getRideDetails(item);
    const isUnread = !item.isRead;
    const showActions = (item.type === 'booking_requested' || item.type === 'ride_created') && user?.isDriver;
    
    return (
      <TouchableOpacity
        style={[styles.notification, getNotificationStyle(item.type), isUnread && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]}>{item.title}</Text>
            {isUnread && <View style={styles.unreadBadge} />}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {rideDetails && (
            <View style={styles.rideDetailsContainer}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.rideDetails}>{rideDetails}</Text>
            </View>
          )}
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          
          {/* Quick action buttons for booking requests */}
          {showActions && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  const rideId = item.data?.rideId || item.data?.ride?._id;
                  if (rideId) {
                    router.push(`/ride/${rideId}`);
                  }
                }}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item._id);
          }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>Failed to load notifications</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={styles.markAllText}>
              {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All', icon: 'notifications-outline' },
            { key: 'unread', label: 'Unread', icon: 'mail-unread-outline', badge: unreadCount > 0 ? unreadCount : undefined },
            { key: 'booking', label: 'Bookings', icon: 'calendar-outline' },
            { key: 'ride', label: 'Rides', icon: 'car-outline' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[styles.filterButton, filter === filterOption.key && styles.filterButtonActive]}
              onPress={() => setFilter(filterOption.key as any)}
            >
              <Ionicons
                name={filterOption.icon as any}
                size={18}
                color={filter === filterOption.key ? 'white' : Colors.gray}
              />
              <Text style={[styles.filterText, filter === filterOption.key && styles.filterTextActive]}>
                {filterOption.label}
              </Text>
              {filterOption.badge !== undefined && filterOption.badge > 0 ? (
                <View style={[
                  styles.filterBadge,
                  filter === filterOption.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    filter === filterOption.key && styles.filterBadgeTextActive
                  ]}>
                    {filterOption.badge}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.gray} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You'll see notifications here when you have ride updates</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  badgeContainer: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  unreadNotification: {
    backgroundColor: Colors.lightPrimary,
  },
  iconContainer: {
    marginRight: 15,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  rideDetails: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  time: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    color: Colors.danger,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
  },
  rideDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 15,
    color: Colors.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'white',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterBadgeTextActive: {
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
