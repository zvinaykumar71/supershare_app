import { Colors } from '@/Constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useUserMode } from '@/hooks/useDriverActiveRide';
import { useWalletBalance } from '@/hooks/useWallet';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { mode, hasActiveRide, activeRide, showDriverFeatures, canOfferRide, isDriver } = useUserMode();
  const { data: walletData } = useWalletBalance();
  const walletBalance = walletData?.balance || 0;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Format rating display
  const displayRating = user?.rating ? user.rating.toFixed(1) : '0.0';
  const reviewCount = user?.reviewsCount || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user?.profilePicture || user?.avatar || 'https://picsum.photos/200' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
        
        {/* User type badge */}
        <View style={styles.userTypeBadge}>
          <Ionicons 
            name={isDriver ? 'car' : 'person'} 
            size={14} 
            color={isDriver ? Colors.primary : Colors.success} 
          />
          <Text style={[styles.userTypeText, { color: isDriver ? Colors.primary : Colors.success }]}>
            {isDriver ? 'Driver' : 'Passenger'}
          </Text>
        </View>
        
        {/* Rating display */}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Text style={styles.ratingText}>{displayRating}</Text>
          <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
        </View>
        
        {/* Wallet Balance */}
        <TouchableOpacity 
          style={styles.walletBalance}
          onPress={() => router.push('/wallet')}
        >
          <Ionicons name="wallet" size={20} color={Colors.primary} />
          <Text style={styles.walletBalanceText}>{formatCurrency(walletBalance)}</Text>
        </TouchableOpacity>
        
        <View style={styles.stats}>
          {isDriver ? (
            // Driver stats
            <>
              <View style={styles.stat}>
                <Ionicons name="car" size={20} color={Colors.primary} style={styles.statIcon} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Rides Given</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="people" size={20} color={Colors.success} style={styles.statIcon} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Passengers</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="location" size={20} color={Colors.secondary} style={styles.statIcon} />
                <Text style={styles.statNumber}>0 km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </>
          ) : (
            // Passenger stats
            <>
              <View style={styles.stat}>
                <Ionicons name="navigate" size={20} color={Colors.primary} style={styles.statIcon} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Rides Taken</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="location" size={20} color={Colors.success} style={styles.statIcon} />
                <Text style={styles.statNumber}>0 km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="leaf" size={20} color="#4CAF50" style={styles.statIcon} />
                <Text style={styles.statNumber}>0 kg</Text>
                <Text style={styles.statLabel}>CO₂ Saved</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/wallet')}
        >
          <Ionicons name="wallet-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Wallet</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="person-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        {/* Show "Become a Driver" option for non-drivers */}
        {!isDriver && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(auth)/become-driver')}
          >
            <Ionicons name="car-outline" size={24} color={Colors.text} />
            <Text style={styles.menuText}>Become a Driver</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
          </TouchableOpacity>
        )}
        
        {/* DRIVER WITH ACTIVE RIDE: Show driver mode status */}
        {showDriverFeatures && (
          <>
            <View style={styles.modeStatusItem}>
              <Ionicons name="car" size={24} color={Colors.primary} />
              <View style={styles.modeStatusContent}>
                <Text style={[styles.menuText, { color: Colors.primary }]}>Driver Mode Active</Text>
                <Text style={styles.modeStatusSubtext}>You have an active ride</Text>
              </View>
              <View style={styles.modeStatusBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
            </View>
            
            {activeRide && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push(`/ride/${activeRide.id || activeRide._id}`)}
              >
                <Ionicons name="navigate" size={24} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>View Active Ride</Text>
                  <Text style={styles.menuSubtext}>
                    {activeRide.from?.city || 'Origin'} → {activeRide.to?.city || 'Destination'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
              </TouchableOpacity>
            )}
          </>
        )}
        
        {/* DRIVER WITHOUT ACTIVE RIDE: Show passenger mode with option to offer ride */}
        {isDriver && !showDriverFeatures && (
          <>
            <View style={styles.modeStatusItem}>
              <Ionicons name="person" size={24} color={Colors.success} />
              <View style={styles.modeStatusContent}>
                <Text style={[styles.menuText, { color: Colors.success }]}>Passenger Mode</Text>
                <Text style={styles.modeStatusSubtext}>You can search and book rides</Text>
              </View>
              <View style={styles.modeStatusBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.offerRideItem]}
              onPress={() => router.push('/ride/create')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={[styles.menuText, { color: '#fff' }]}>Offer a New Ride</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.modeHint}>
              💡 When you create a ride, you'll switch to Driver Mode
            </Text>
          </>
        )}
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.text} />
          <Text style={styles.menuText}>About SuperShare</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.gray,
  },
  walletBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  walletBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: Colors.text,
  },
  statLabel: {
    color: Colors.gray,
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuSubtext: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  modeStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    backgroundColor: Colors.lightPrimary,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  modeStatusContent: {
    flex: 1,
  },
  modeStatusSubtext: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  modeStatusBadge: {
    padding: 4,
  },
  offerRideItem: {
    backgroundColor: Colors.success,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  modeHint: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});