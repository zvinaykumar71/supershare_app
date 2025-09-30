import { RideCard } from '@/components/shared/RideCard';
import { SearchForm } from '@/components/shared/SearchForm';
import { Colors } from '@/Constants/Colors';
import { rides } from '@/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date(),
    passengers: 1,
  });

  const handleSearch = () => {
    const d = searchParams.date instanceof Date ? searchParams.date : new Date(searchParams.date as any);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    router.push({
      pathname: '/search/results',
      params: {
        from: searchParams.from,
        to: searchParams.to,
        date,
        seats: String(searchParams.passengers),
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello{user?.name ? `, ${user.name}` : ''}</Text>
          <Text style={styles.subtitle}>Where are you going today?</Text>
          {user?.isDriver && (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => router.push('/ride/create')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.headerButtonText}>Offer a ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: ((user as any)?.avatar) || 'https://picsum.photos/200' }} 
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchForm
          values={searchParams}
          onChange={setSearchParams}
          onSubmit={handleSearch}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular rides</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {rides.slice(0, 5).map(ride => (
            <RideCard key={ride.id} ride={ride} style={styles.horizontalCard} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently viewed</Text>
        </View>
        
        {rides.slice(5, 8).map(ride => (
          <RideCard key={ride.id} ride={ride} style={styles.verticalCard} />
        ))}
      </View>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchContainer: {
    padding: 20,
    marginTop: -20,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: Colors.primary,
    fontWeight: '500',
  },
  horizontalScroll: {
    marginHorizontal: -20,
  },
  horizontalCard: {
    width: 300,
    marginRight: 15,
  },
  verticalCard: {
    marginBottom: 15,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  headerButtonSecondary: {
    backgroundColor: 'white',
  },
  headerButtonTextSecondary: {
    color: Colors.primary,
    fontWeight: '600',
  },
});