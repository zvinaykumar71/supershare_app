import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { SearchForm } from '../../components/shared';
import { SearchForm } from '@/components/shared/SearchForm';
import { Colors } from '../../Constants/Colors';

export default function SearchScreen() {
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date(),
    passengers: 1,
  });

  const popularRoutes = [
    { from: 'Mumbai', to: 'Pune', frequent: true },
    { from: 'Delhi', to: 'Jaipur', frequent: true },
    { from: 'Bangalore', to: 'Chennai', frequent: true },
    { from: 'Hyderabad', to: 'Goa', frequent: false },
  ];

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
        <Text style={styles.title}>Search rides</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchForm
          values={searchParams}
          onChange={setSearchParams}
          onSubmit={handleSearch}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular routes</Text>
        {popularRoutes.map((route, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.routeItem}
            onPress={() => {
              setSearchParams({
                ...searchParams,
                from: route.from,
                to: route.to,
              });
            }}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={route.frequent ? Colors.primary : Colors.gray} 
            />
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>{route.from} → {route.to}</Text>
              {route.frequent && (
                <Text style={styles.frequentText}>Frequent route</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20}
            color={Colors.gray} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent searches</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No recent searches</Text>
        </View>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    padding: 20,
    marginTop: -20,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  routeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  routeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  frequentText: {
    fontSize: 12,
    color: Colors.primary,
  },
  placeholder: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  placeholderText: {
    color: Colors.gray,
  },
});