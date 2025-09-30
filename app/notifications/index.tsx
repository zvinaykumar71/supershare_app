import { Colors } from '@/Constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

const notifications = [
  {
    id: '1',
    type: 'booking_request',
    user: 'Sarah Johnson',
    avatar: 'https://picsum.photos/201',
    text: 'requested to book your ride from NYC to Boston',
    rideDetails: 'NYC → Boston, Tomorrow 9:00 AM',
    time: '5 minutes ago',
    bookingId: 'booking_123',
  },
  {
    id: '2',
    type: 'booking_accepted',
    user: 'Mike Chen',
    avatar: 'https://picsum.photos/202',
    text: 'accepted your booking request',
    rideDetails: 'San Francisco → LA, Today 2:00 PM',
    time: '1 hour ago',
    bookingId: 'booking_124',
  },
  {
    id: '3',
    type: 'booking_rejected',
    user: 'Alex Rodriguez',
    avatar: 'https://picsum.photos/203',
    text: 'unfortunately had to reject your booking',
    rideDetails: 'Chicago → Detroit, Tomorrow 7:00 AM',
    time: '3 hours ago',
    bookingId: 'booking_125',
  },
  {
    id: '4',
    type: 'ride_reminder',
    user: 'System',
    avatar: 'https://picsum.photos/204',
    text: 'Your ride starts in 30 minutes',
    rideDetails: 'Miami → Orlando, Today 10:00 AM',
    time: '30 minutes ago',
    bookingId: 'booking_126',
  },
];

const getNotificationStyle = (type: string) => {
  switch (type) {
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
  switch (type) {
    case 'booking_request':
      return <Ionicons name="car-outline" size={24} color={Colors.primary} />;
    case 'booking_accepted':
      return <Ionicons name="checkmark-circle" size={24} color={Colors.success} />;
    case 'booking_rejected':
      return <Ionicons name="close-circle" size={24} color={Colors.danger} />;
    case 'ride_reminder':
      return <Ionicons name="time-outline" size={24} color={Colors.warning} />;
    default:
      return null;
  }
};

export default function NotificationsScreen() {
  const renderNotification = ({ item }: { item: typeof notifications[0] }) => (
    <View style={[styles.notification, getNotificationStyle(item.type)]}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.username}>{item.user}</Text>
          {' '}{item.text}
        </Text>
        {item.rideDetails && (
          <Text style={styles.rideDetails}>{item.rideDetails}</Text>
        )}
        <Text style={styles.time}>{item.time}</Text>
      </View>
      
      {getNotificationIcon(item.type)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
  },
  comment: {
    color: 'gray',
  },
  time: {
    color: 'gray',
    fontSize: 14,
  },
  preview: {
    width: 45,
    height: 45,
    borderRadius: 5,
  },
  rideDetails: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
});