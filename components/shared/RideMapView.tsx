import { Colors } from '@/Constants/Colors';
import { getCityCoordinates, MAPBOX_ACCESS_TOKEN } from '@/Constants/Mapbox';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Ride {
  id: string;
  from: { city: string; address?: string };
  to: { city: string; address?: string };
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  driver: {
    name: string;
    avatar: string;
    rating: number;
  };
  duration?: string;
}

interface RideMapViewProps {
  rides: Ride[];
  fromCity?: string;
  toCity?: string;
  onRideSelect?: (ride: Ride) => void;
}

export function RideMapView({ rides, fromCity, toCity, onRideSelect }: RideMapViewProps) {
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Calculate map bounds
  const mapData = useMemo(() => {
    const coordinates: { lat: number; lng: number }[] = [];
    
    rides.forEach(ride => {
      const fromCoords = getCityCoordinates(ride.from.city);
      const toCoords = getCityCoordinates(ride.to.city);
      if (fromCoords) coordinates.push({ lat: fromCoords.latitude, lng: fromCoords.longitude });
      if (toCoords) coordinates.push({ lat: toCoords.latitude, lng: toCoords.longitude });
    });

    if (coordinates.length === 0) {
      return { center: { lat: 28.6139, lng: 77.2090 }, zoom: 8 };
    }

    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return { center: { lat: centerLat, lng: centerLng }, zoom: 7 };
  }, [rides]);

  // Generate static map URL with markers
  const mapImageUrl = useMemo(() => {
    const markers: string[] = [];
    const paths: string[] = [];
    
    rides.forEach((ride, index) => {
      const fromCoords = getCityCoordinates(ride.from.city);
      const toCoords = getCityCoordinates(ride.to.city);
      
      if (fromCoords) {
        // Origin marker (green)
        markers.push(`pin-s-a+22c55e(${fromCoords.longitude},${fromCoords.latitude})`);
      }
      if (toCoords) {
        // Destination marker (red)
        markers.push(`pin-s-b+ef4444(${toCoords.longitude},${toCoords.latitude})`);
      }
      
      // Draw path between origin and destination
      if (fromCoords && toCoords) {
        paths.push(`path-2+3b82f6-0.5(${encodeURIComponent(`${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}`)})`);
      }
    });

    const overlays = [...paths, ...markers].join(',');
    const width = Math.round(SCREEN_WIDTH);
    const height = 300;
    
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/${width}x${height}@2x?access_token=${MAPBOX_ACCESS_TOKEN}&padding=50`;
  }, [rides]);

  // Handle ride selection
  const handleRidePress = (ride: Ride) => {
    setSelectedRide(selectedRide?.id === ride.id ? null : ride);
  };

  // Open in maps app
  const openInMaps = (ride: Ride) => {
    const fromCoords = getCityCoordinates(ride.from.city);
    const toCoords = getCityCoordinates(ride.to.city);
    
    if (fromCoords && toCoords) {
      const url = `https://www.google.com/maps/dir/${fromCoords.latitude},${fromCoords.longitude}/${toCoords.latitude},${toCoords.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Static Map Image */}
      <View style={styles.mapContainer}>
        <ExpoImage
          source={{ uri: mapImageUrl }}
          style={styles.mapImage}
          contentFit="cover"
          transition={300}
        />
        
        {/* Map Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Origin</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Destination</Text>
          </View>
        </View>

        {/* Rides count badge */}
        <View style={styles.ridesBadge}>
          <Ionicons name="car" size={14} color={Colors.primary} />
          <Text style={styles.ridesBadgeText}>{rides.length} rides</Text>
        </View>
      </View>

      {/* Rides List */}
      <ScrollView style={styles.ridesList} showsVerticalScrollIndicator={false}>
        <Text style={styles.ridesListTitle}>Available Rides</Text>
        
        {rides.map((ride) => (
          <TouchableOpacity
            key={ride.id}
            style={[
              styles.rideItem,
              selectedRide?.id === ride.id && styles.rideItemSelected
            ]}
            onPress={() => handleRidePress(ride)}
            activeOpacity={0.7}
          >
            <View style={styles.rideHeader}>
              <Image 
                source={{ uri: ride.driver.avatar }} 
                style={styles.driverAvatar}
              />
              <View style={styles.rideInfo}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.price}>{formatCurrency(ride.price)}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.routeCity} numberOfLines={1}>{ride.from.city}</Text>
                <Text style={styles.routeTime}>{formatTime(ride.departureTime)}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.routeCity} numberOfLines={1}>{ride.to.city}</Text>
                <Text style={styles.routeTime}>{formatTime(ride.arrivalTime)}</Text>
              </View>
            </View>

            <View style={styles.rideFooter}>
              <View style={styles.seatsContainer}>
                <Ionicons name="people" size={14} color={Colors.gray} />
                <Text style={styles.seatsText}>{ride.availableSeats} seats</Text>
              </View>
              
              <View style={styles.rideActions}>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => openInMaps(ride)}
                >
                  <Ionicons name="navigate" size={14} color={Colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => router.push(`/ride/${ride.id}`)}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: Colors.lightGray,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  ridesBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ridesBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  ridesList: {
    flex: 1,
    padding: 16,
  },
  ridesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  rideItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rideItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightPrimary,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  rideInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.gray,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  routeContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  routeCity: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  routeTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: Colors.gray,
    marginLeft: 3,
    marginVertical: 3,
  },
  rideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsText: {
    fontSize: 13,
    color: Colors.gray,
  },
  rideActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightPrimary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
