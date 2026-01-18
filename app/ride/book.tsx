import { Button } from '@/components/ui/Button';
import { Colors } from '@/Constants/Colors';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRide } from '@/hooks/useRides';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BookRideScreen() {
  const params = useLocalSearchParams();
  const rideId = (params.id as string) || '';

  const { data: ride } = useRide(rideId);
  const createBooking = useCreateBooking();

  const [seatsInput, setSeatsInput] = useState('1');
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [selectedPickupIndex, setSelectedPickupIndex] = useState(0);
  const [selectedDropoffIndex, setSelectedDropoffIndex] = useState(-1);
  const [notes, setNotes] = useState('');
  const [luggage, setLuggage] = useState('0');
  
  // Parse seats as number for calculations
  const seats = Math.max(1, Math.min(ride?.availableSeats || 10, parseInt(seatsInput) || 1));
  const [pets, setPets] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [music, setMusic] = useState(true);
  const [ac, setAc] = useState(true);

  // Build route points array (start + stops + end)
  const routePoints = useMemo(() => {
    if (!ride) return [];
    const points = [
      { type: 'start', city: ride.from?.city, address: ride.from?.address, index: 0 }
    ];
    (ride.stops || []).forEach((stop: any, idx: number) => {
      points.push({ type: 'stop', city: stop.city, address: stop.address, index: idx + 1 });
    });
    points.push({ type: 'end', city: ride.to?.city, address: ride.to?.address, index: points.length });
    return points;
  }, [ride]);

  // Determine if this is a partial route booking
  const isPartialRoute = useMemo(() => {
    if (selectedPickupIndex > 0) return true; // Not starting from beginning
    if (selectedDropoffIndex >= 0 && selectedDropoffIndex < routePoints.length - 1) return true; // Not going to end
    return false;
  }, [selectedPickupIndex, selectedDropoffIndex, routePoints]);

  useEffect(() => {
    if (ride) {
      setPickupPoint(ride.from?.address || '');
      setDropoffPoint(ride.to?.address || '');
      setSelectedPickupIndex(0);
      setSelectedDropoffIndex(-1); // -1 means end point
    }
  }, [ride]);

  // Calculate price based on route coverage
  const { totalPrice, pricePerSeat } = useMemo(() => {
    if (!ride) return { totalPrice: 0, pricePerSeat: 0 };
    
    const basePrice = ride.price || 0;
    
    if (!isPartialRoute) {
      return { totalPrice: basePrice * seats, pricePerSeat: basePrice };
    }
    
    // Calculate proportional price for partial route
    const totalSegments = routePoints.length - 1;
    const actualDropoffIndex = selectedDropoffIndex >= 0 ? selectedDropoffIndex : routePoints.length - 1;
    const passengerSegments = Math.max(1, actualDropoffIndex - selectedPickupIndex);
    
    // Minimum 50% of full price
    const priceRatio = Math.max(0.5, passengerSegments / totalSegments);
    const calculatedPrice = Math.round(basePrice * priceRatio * 100) / 100;
    
    return { 
      totalPrice: calculatedPrice * seats, 
      pricePerSeat: calculatedPrice 
    };
  }, [ride, seats, isPartialRoute, selectedPickupIndex, selectedDropoffIndex, routePoints]);

  const handlePickupSelect = (index: number) => {
    const point = routePoints[index];
    setSelectedPickupIndex(index);
    setPickupPoint(point.address || point.city);
    
    // Ensure dropoff is after pickup
    if (selectedDropoffIndex >= 0 && selectedDropoffIndex <= index) {
      setSelectedDropoffIndex(-1);
      setDropoffPoint(ride?.to?.address || '');
    }
  };

  const handleDropoffSelect = (index: number) => {
    const point = routePoints[index];
    setSelectedDropoffIndex(index);
    setDropoffPoint(point.address || point.city);
  };

  const handleSubmit = async () => {
    if (!rideId) return;
    
    // Prevent multiple bookings - check if user already has a booking for this ride
    if (createBooking.isPending) {
      Alert.alert('Please wait', 'Your booking request is being processed...');
      return;
    }
    
    try {
      await createBooking.mutateAsync({
        rideId,
        seats,
        pickupPoint,
        dropoffPoint,
        notes,
        bookingType: isPartialRoute ? 'partial' : 'full',
        pickupIndex: selectedPickupIndex,
        dropoffIndex: selectedDropoffIndex,
        specialRequests: {
          luggage: Number(luggage) || 0,
          pets,
          smoking,
          music,
          ac,
        },
      });
      Alert.alert('Success', isPartialRoute ? 'Partial route booking request sent!' : 'Booking request sent successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') },
      ]);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send booking request';
      if (errorMessage.includes('already') || errorMessage.includes('existing')) {
        Alert.alert('Already Booked', 'You already have a booking for this ride. Please check your active rides.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };
  // mmmmmmmmmm
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Request booking</Text>
        {ride && (
          <Text style={styles.price}>{formatCurrency(ride.price)} per seat</Text>
        )}
      </View>

      <View style={styles.formGroup}> 
        <Text style={styles.label}>Seats (max {ride?.availableSeats || 'N/A'} available)</Text>
        <View style={styles.seatsContainer}>
          <TouchableOpacity 
            style={[styles.seatButton, seats <= 1 && styles.seatButtonDisabled]}
            onPress={() => setSeatsInput(String(Math.max(1, seats - 1)))}
            disabled={seats <= 1}
          >
            <Ionicons name="remove" size={24} color={seats <= 1 ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.seatsInput}
            keyboardType="number-pad"
            value={seatsInput}
            onChangeText={(text) => {
              // Allow empty string or numbers only
              if (text === '' || /^\d+$/.test(text)) {
                setSeatsInput(text);
              }
            }}
            onBlur={() => {
              // Validate on blur
              const num = parseInt(seatsInput) || 1;
              const maxSeats = ride?.availableSeats || 10;
              setSeatsInput(String(Math.max(1, Math.min(maxSeats, num))));
            }}
            maxLength={2}
            selectTextOnFocus
          />
          
          <TouchableOpacity 
            style={[styles.seatButton, seats >= (ride?.availableSeats || 10) && styles.seatButtonDisabled]}
            onPress={() => setSeatsInput(String(Math.min(ride?.availableSeats || 10, seats + 1)))}
            disabled={seats >= (ride?.availableSeats || 10)}
          >
            <Ionicons name="add" size={24} color={seats >= (ride?.availableSeats || 10) ? Colors.gray : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Partial Route Info Banner */}
      {isPartialRoute && (
        <View style={styles.partialRouteBanner}>
          <Ionicons name="git-branch-outline" size={20} color="#FF9500" />
          <View style={styles.partialRouteInfo}>
            <Text style={styles.partialRouteTitle}>Partial Route Booking</Text>
            <Text style={styles.partialRouteDesc}>
              You're booking a portion of this ride. Price adjusted accordingly.
            </Text>
          </View>
        </View>
      )}

      {/* Route Selection */}
      {routePoints.length > 2 && (
        <View style={styles.routeSelectionSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitleBlue}>Select Your Route</Text>
          </View>
          
          {/* Pickup Selection */}
          <Text style={styles.routeLabel}>Pickup from:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeOptions}>
            {routePoints.slice(0, -1).map((point, index) => (
              <TouchableOpacity
                key={`pickup-${index}`}
                style={[
                  styles.routeOption,
                  selectedPickupIndex === index && styles.routeOptionSelected
                ]}
                onPress={() => handlePickupSelect(index)}
              >
                <Ionicons 
                  name={point.type === 'start' ? 'location' : 'ellipse'} 
                  size={14} 
                  color={selectedPickupIndex === index ? 'white' : Colors.primary} 
                />
                <Text style={[
                  styles.routeOptionText,
                  selectedPickupIndex === index && styles.routeOptionTextSelected
                ]}>
                  {point.city}
                </Text>
                {point.type === 'start' && (
                  <Text style={[
                    styles.routeOptionBadge,
                    selectedPickupIndex === index && styles.routeOptionBadgeSelected
                  ]}>Start</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Dropoff Selection */}
          <Text style={styles.routeLabel}>Drop off at:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeOptions}>
            {routePoints.slice(selectedPickupIndex + 1).map((point, idx) => {
              const actualIndex = selectedPickupIndex + 1 + idx;
              const isSelected = selectedDropoffIndex === actualIndex || 
                (selectedDropoffIndex === -1 && actualIndex === routePoints.length - 1);
              return (
                <TouchableOpacity
                  key={`dropoff-${actualIndex}`}
                  style={[
                    styles.routeOption,
                    isSelected && styles.routeOptionSelected
                  ]}
                  onPress={() => handleDropoffSelect(actualIndex === routePoints.length - 1 ? -1 : actualIndex)}
                >
                  <Ionicons 
                    name={point.type === 'end' ? 'flag' : 'ellipse'} 
                    size={14} 
                    color={isSelected ? 'white' : Colors.danger} 
                  />
                  <Text style={[
                    styles.routeOptionText,
                    isSelected && styles.routeOptionTextSelected
                  ]}>
                    {point.city}
                  </Text>
                  {point.type === 'end' && (
                    <Text style={[
                      styles.routeOptionBadge,
                      isSelected && styles.routeOptionBadgeSelected
                    ]}>End</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pickup point (specific address)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter specific pickup location"
          value={pickupPoint}
          onChangeText={setPickupPoint}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dropoff point (specific address)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter specific dropoff location"
          value={dropoffPoint}
          onChangeText={setDropoffPoint}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Anything the driver should know"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="settings" size={16} color={Colors.gray} />
        <Text style={styles.sectionTitle}>Special requests</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Luggage (bags)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(luggage)}
            onChangeText={setLuggage}
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Pets</Text>
          <TextInput
            style={styles.input}
            value={pets ? 'Yes' : 'No'}
            onFocus={() => setPets(!pets)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Smoking</Text>
          <TextInput
            style={styles.input}
            value={smoking ? 'Yes' : 'No'}
            onFocus={() => setSmoking(!smoking)}
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Music</Text>
          <TextInput
            style={styles.input}
            value={music ? 'Yes' : 'No'}
            onFocus={() => setMusic(!music)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>AC</Text>
          <TextInput
            style={styles.input}
            value={ac ? 'Yes' : 'No'}
            onFocus={() => setAc(!ac)}
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Price per seat</Text>
          <View style={styles.priceDisplay}>
            {isPartialRoute && (
              <Text style={styles.originalPrice}>{formatCurrency(ride?.price || 0)}</Text>
            )}
            <Text style={styles.total}>{formatCurrency(pricePerSeat)}</Text>
          </View>
        </View>
      </View>

      {/* Total Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryValue}>
            {routePoints[selectedPickupIndex]?.city} → {
              selectedDropoffIndex === -1 
                ? routePoints[routePoints.length - 1]?.city 
                : routePoints[selectedDropoffIndex]?.city
            }
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Seats</Text>
          <Text style={styles.summaryValue}>{seats}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price per seat</Text>
          <Text style={styles.summaryValue}>{formatCurrency(pricePerSeat)}</Text>
        </View>
        {isPartialRoute && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking type</Text>
            <View style={styles.partialBadge}>
              <Text style={styles.partialBadgeText}>Partial Route</Text>
            </View>
          </View>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatCurrency(totalPrice)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button 
          title={isPartialRoute ? "Request Partial Route Booking" : "Send booking request"} 
          onPress={handleSubmit} 
          loading={createBooking.isPending} 
        />
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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  price: {
    color: 'white',
    marginTop: 6,
    opacity: 0.8,
  },
  formGroup: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  formGroupHalf: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  label: {
    marginBottom: 6,
    color: Colors.gray,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  seatButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  seatButtonDisabled: {
    opacity: 0.5,
  },
  seatsInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 12,
    color: Colors.text,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: Colors.gray,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priceDisplay: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.gray,
    textDecorationLine: 'line-through',
  },
  actions: {
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  partialRouteBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    gap: 12,
    alignItems: 'flex-start',
  },
  partialRouteInfo: {
    flex: 1,
  },
  partialRouteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 2,
  },
  partialRouteDesc: {
    fontSize: 12,
    color: '#CC7700',
  },
  routeSelectionSection: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  sectionTitleBlue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  routeLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 12,
    marginBottom: 8,
  },
  routeOptions: {
    flexDirection: 'row',
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  routeOptionSelected: {
    backgroundColor: Colors.primary,
  },
  routeOptionText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  routeOptionTextSelected: {
    color: 'white',
  },
  routeOptionBadge: {
    fontSize: 10,
    color: Colors.gray,
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  routeOptionBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  partialBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partialBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
});


