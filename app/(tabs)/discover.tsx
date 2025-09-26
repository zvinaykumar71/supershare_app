import { Input } from '@/components/ui/Input';
import { Colors } from '@/Constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const discoverItems = [
  {
    id: '1',
    name: 'Tech Enthusiasts',
    members: 1245,
    image: 'https://picsum.photos/300/200',
    isJoined: false,
  },
  {
    id: '2',
    name: 'Travel Buddies',
    members: 892,
    image: 'https://picsum.photos/301/200',
    isJoined: true,
  },
  {
    id: '3',
    name: 'Food Lovers',
    members: 1567,
    image: 'https://picsum.photos/302/200',
    isJoined: false,
  },
  {
    id: '4',
    name: 'Fitness Community',
    members: 983,
    image: 'https://picsum.photos/303/200',
    isJoined: false,
  },
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const renderItem = ({ item }: { item: typeof discoverItems[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMembers}>{item.members.toLocaleString()} members</Text>
      </View>
      <TouchableOpacity style={[styles.joinButton, item.isJoined && styles.joinedButton]}>
        <Text style={[styles.joinButtonText, item.isJoined && styles.joinedButtonText]}>
          {item.isJoined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <Input
        placeholder="Search communities..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Ionicons name="search" size={20} color={Colors.gray} />}
        style={styles.searchInput}
      />

      <FlatList
        data={discoverItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardMembers: {
    color: Colors.gray,
    fontSize: 14,
  },
  joinButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinedButton: {
    backgroundColor: '#f0f0f0',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  joinedButtonText: {
    color: Colors.text,
  },
});