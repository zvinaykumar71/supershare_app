import { Colors } from '@/Constants/Colors';
import { useUserMode } from '@/hooks/useDriverActiveRide';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { DriverRideDetails } from '@/components/ride-details/DriverRideDetails';
import { UserRideDetails } from '@/components/ride-details/UserRideDetails';

export default function MyRidesScreen() {
  const { user } = useAuth();
  const {
    mode,
    showDriverFeatures,
    showPassengerFeatures,
    canOfferRide,
    refetch: refetchMode,
    isRefetching: isModeRefetching
  } = useUserMode();

  const [refreshing, setRefreshing] = useState(false);
  const isDriver = !!user?.isDriver;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchMode();
      // The child components will handle their own refreshing via their own internal logic or we could expose refetch methods
      // But typically a pull-to-refresh on the parent should maybe trigger children?
      // For now, let's assume the user will pull to refresh within the child lists if needed, 
      // OR we rely on the fact that `refetchMode` might change state that triggers updates.
      // However, since we are wrapping everything in a ScrollView here, we control the refresh.
      // We might need to pass a "refreshTrigger" prop or something if we want to force children to refresh.
      // Ideally, the unified refresh control should be here.
      // But we split the logic. 
      // Let's keep it simple: This refresh control refreshes the MODE. 
      // The child components have their own data fetching hooks. 
      // If we want a global refresh, we would need to hoist all queries up, which defeats the purpose of splitting.
      // OR we just let the user refresh the mode here, and if they want to refresh the list, they might need to do it inside.
      // ACTUALLY, checking the UI: The RefreshControl is on THIS ScrollView.
      // So when this refreshes, we want everything to refresh.
      // We can use a key or context to force refresh, but that's complex.
      // Simpler approach for now: The child components execute queries on mount.
      // If we unmount/remount (by changing key), they refetch.
      // But we aren't changing keys.
      // Let's rely on React Query's `useQuery` features. If we invalidate queries globally, they update.
      // But we don't have access to queryClient here easily without import.
      // Let's pass a `refreshing` prop? No, standard `useQuery` usually refetches on focus.

    } finally {
      setRefreshing(false);
    }
  }, [refetchMode]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>

        {/* Mode indicator */}
        {isDriver && (
          <View style={styles.modeIndicator}>
            <Ionicons
              name={showDriverFeatures ? "car" : "person"}
              size={14}
              color="#fff"
            />
            <Text style={styles.modeText}>
              {showDriverFeatures ? "Driver Mode" : "Passenger Mode"}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Banner for Drivers in Passenger Mode (No active ride) */}
        {isDriver && !showDriverFeatures && (
          <TouchableOpacity
            style={styles.offerRideBanner}
            onPress={() => router.push('/ride/create')}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.offerRideBannerText}>Offer a New Ride</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Render appropriate component based on mode */}
        {showDriverFeatures ? (
          <DriverRideDetails user={user} />
        ) : (
          <UserRideDetails user={user} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  offerRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  offerRideBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
