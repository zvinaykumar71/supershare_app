import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

const notifications = [
  {
    id: '1',
    type: 'like',
    user: 'jane_doe',
    avatar: 'https://picsum.photos/201',
    postPreview: 'https://picsum.photos/100',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'comment',
    user: 'john_smith',
    avatar: 'https://picsum.photos/202',
    text: 'Great post! 👍',
    time: '5 hours ago',
  },
  {
    id: '3',
    type: 'follow',
    user: 'tech_guru',
    avatar: 'https://picsum.photos/203',
    time: '1 day ago',
  },
];

export default function NotificationsScreen() {
  const renderNotification = ({ item }: { item: typeof notifications[0] }) => (
    <View style={styles.notification}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.username}>{item.user}</Text>
          {item.type === 'like' && ' liked your post'}
          {item.type === 'comment' && ' commented: '}
          {item.type === 'comment' && <Text style={styles.comment}>{item.text}</Text>}
          {item.type === 'follow' && ' started following you'}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      
      {item.type !== 'follow' && (
        <Image source={{ uri: item.postPreview }} style={styles.preview} />
      )}
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
});