// components/NotificationBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnreadCount } from '@/hooks/useNotificationsQuery';
import { Colors } from '@/Constants/Colors';

interface NotificationBadgeProps {
  size?: number;
  fontSize?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  size = 18, 
  fontSize = 10 
}) => {
  const { data, error } = useUnreadCount();
  // Gracefully handle errors - don't show badge if there's an error and no data
  const unreadCount = (error && !data) ? 0 : (data?.unreadCount || 0);

  if (unreadCount === 0) {
    return null;
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.badgeText, { fontSize }]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
