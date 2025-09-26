// import { ChatListItem } from '@/components/shared/ChatListItem';
import { Input } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const chats = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastMessage: 'Hey! How are you doing?',
    timestamp: '2:30 PM',
    unreadCount: 3,
    avatar: 'https://picsum.photos/200',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    lastMessage: 'Let\'s meet tomorrow',
    timestamp: 'Yesterday',
    unreadCount: 0,
    avatar: 'https://picsum.photos/201',
    isOnline: false,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    lastMessage: 'Did you see the new movie?',
    timestamp: '12/15/2023',
    unreadCount: 1,
    avatar: 'https://picsum.photos/202',
    isOnline: true,
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <Input
        placeholder="Search messages..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        // leftIcon={<Ionicons name="search" size={20} color={Colors.gray} />}
        style={styles.searchInput}
      />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/chat/${item.id}`} asChild>
            <TouchableOpacity>
              {/* <ChatListItem chat={item} /> */}
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInput: {
    margin: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 8,
  },
});