import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../Constants/Colors';
// import { Ride } from '../../types';
import { Ride } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
// import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface MatchInfo {
  pickupMatch: 'start' | 'stop' | 'none';
  pickupIndex: number;
  dropoffMatch: 'end' | 'stop' | 'none';
  dropoffIndex: number;
  isPartialRoute: boolean;
  routeCoverage: number;
}

interface RideCardProps {
  ride: Ride & { matchInfo?: MatchInfo };
  onPress?: () => void;
  style?: any;
}

export function RideCard({ ride, onPress, style }: RideCardProps) {
  const isPartialRoute = ride.matchInfo?.isPartialRoute || false;
  const hasStops = (ride.stops?.length || 0) > 0;
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Partial Route Badge */}
      {isPartialRoute && (
        <View style={styles.partialRouteBadge}>
          <Ionicons name="git-branch-outline" size={14} color="#FF9500" />
          <Text style={styles.partialRouteText}>Partial Route Available</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Image source={{ uri: ride.driver.avatar }} style={styles.avatar} />
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{ride.driver.name}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.ratingText}>{ride.driver.rating}</Text>
            <Text style={styles.tripsText}>• {ride.driver.trips} trips</Text>
          </View>
        </View>
        {ride.driver.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={10} color="white" />
          </View>
        )}
      </View>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          {hasStops && (
            <>
              <View style={styles.timelineLineShort} />
              <View style={styles.timelineStopDot} />
              {ride.stops!.length > 1 && (
                <>
                  <View style={styles.timelineLineShort} />
                  <Text style={styles.moreStopsText}>+{ride.stops!.length - 1}</Text>
                </>
              )}
            </>
          )}
          <View style={[styles.timelineLine, hasStops && styles.timelineLineShort]} />
          <View style={styles.timelineDot} />
        </View>
        
        <View style={styles.locations}>
          <View style={styles.location}>
            <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.from.city}</Text>
          </View>
          
          {/* Show first stop if exists */}
          {hasStops && (
            <View style={styles.stopLocation}>
              <Ionicons name="ellipse" size={6} color={Colors.gray} />
              <Text style={styles.stopCity} numberOfLines={1}>
                via {ride.stops![0].city}
                {ride.stops!.length > 1 && ` +${ride.stops!.length - 1} more`}
              </Text>
            </View>
          )}
          
          <View style={styles.duration}>
            <Text style={styles.durationText}>{ride.duration}</Text>
          </View>
          
          <View style={styles.location}>
            <Text style={styles.time}>{formatTime(ride.arrivalTime)}</Text>
            <Text style={styles.city} numberOfLines={1}>{ride.to.city}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(ride.date)}</Text>
        <View style={styles.priceContainer}>
          {isPartialRoute && ride.matchInfo?.routeCoverage && ride.matchInfo.routeCoverage < 100 && (
            <Text style={styles.partialPriceHint}>from </Text>
          )}
          <Text style={styles.price}>{formatCurrency(ride.price)}</Text>
        </View>
      </View>

      <View style={styles.features}>
        {ride.instantBooking && (
          <View style={styles.feature}>
            <Ionicons name="flash" size={14} color={Colors.success} />
            <Text style={styles.featureText}>Instant</Text>
          </View>
        )}
        {ride.womenOnly && (
          <View style={styles.feature}>
            <Ionicons name="female" size={14} color={Colors.primary} />
            <Text style={styles.featureText}>Women only</Text>
          </View>
        )}
        {hasStops && (
          <View style={styles.feature}>
            <Ionicons name="git-branch" size={14} color={Colors.primary} />
            <Text style={styles.featureText}>{ride.stops!.length} stop{ride.stops!.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        <Text style={styles.seats}>
          {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} left
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partialRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  partialRouteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.gray,
  },
  tripsText: {
    fontSize: 12,
    color: Colors.gray,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  route: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeline: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  timelineStopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.lightGray,
    marginVertical: 2,
  },
  timelineLineShort: {
    width: 2,
    height: 12,
    backgroundColor: Colors.lightGray,
    marginVertical: 2,
  },
  moreStopsText: {
    fontSize: 10,
    color: Colors.gray,
    marginVertical: 2,
  },
  locations: {
    flex: 1,
    justifyContent: 'space-between',
  },
  location: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 50,
    marginVertical: 4,
    gap: 6,
  },
  stopCity: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
  },
  city: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 10,
  },
  duration: {
    alignItems: 'center',
    marginLeft: -20,
  },
  durationText: {
    fontSize: 12,
    color: Colors.gray,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: Colors.gray,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  partialPriceHint: {
    fontSize: 12,
    color: Colors.gray,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  features: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: Colors.gray,
  },
  seats: {
    marginLeft: 'auto',
    fontSize: 12,
    color: Colors.gray,
  },
});