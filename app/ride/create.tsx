import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { DateTimeInput } from '../../components/ui/DateTimeInput';
import { Input } from '../../components/ui/Input';
import { LocationPickerModal } from '../../components/ui/LocationPickerModal';
import { Colors } from '../../Constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { useCreateRide } from '../../hooks/useRides';
import { CreateRideData, Stop } from '../../types/api';

type LocationData = {
  city: string;
  address: string;
  coordinates?: { lat: number; lng: number };
};

type FormState = {
  from: LocationData;
  to: LocationData;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: string;
  details: string;
};

export default function CreateRideScreen() {
  const [formData, setFormData] = useState<FormState>({
    from: {
      city: '',
      address: '',
      coordinates: undefined,
    },
    to: {
      city: '',
      address: '',
      coordinates: undefined,
    },
    departureTime: '',
    arrivalTime: '',
    price: '',
    availableSeats: '',
    details: '',
  });
  const [isFromPickerVisible, setFromPickerVisible] = useState(false);
  const [isToPickerVisible, setToPickerVisible] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const [newStop, setNewStop] = useState({ city: '', address: '' });
  const [isLoading, setIsLoading] = useState(false);
  const createRide = useCreateRide();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleFromLocationSelect = (location: { name: string; address: string; coordinates?: { lat: number; lng: number } }) => {
    setFormData(prev => ({
      ...prev,
      from: {
        city: location.name,
        address: location.address,
        coordinates: location.coordinates,
      },
    }));
  };

  const handleToLocationSelect = (location: { name: string; address: string; coordinates?: { lat: number; lng: number } }) => {
    setFormData(prev => ({
      ...prev,
      to: {
        city: location.name,
        address: location.address,
        coordinates: location.coordinates,
      },
    }));
  };

  // Check if user is a driver
  if (!user?.isDriver) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Driver Required</Text>
          <Text style={styles.errorText}>
            You need to be a registered driver to create rides. Please complete your driver registration first.
          </Text>
          <Button
            title="Become a Driver"
            onPress={() => router.push('/(auth)/become-driver')}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'from' || parent === 'to') {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev as FormState)[parent],
            [child]: value,
          } as FormState['from'],
        }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value } as FormState));
  };

  const addStop = () => {
    if (newStop.city.trim() && newStop.address.trim()) {
      setStops(prev => [...prev, { ...newStop }]);
      setNewStop({ city: '', address: '' });
    }
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.from.city.trim()) {
      Alert.alert('Error', 'Please enter the departure city');
      return false;
    }

    if (!formData.from.address.trim()) {
      Alert.alert('Error', 'Please enter the departure address');
      return false;
    }

    if (!formData.to.city.trim()) {
      Alert.alert('Error', 'Please enter the destination city');
      return false;
    }

    if (!formData.to.address.trim()) {
      Alert.alert('Error', 'Please enter the destination address');
      return false;
    }

    if (!formData.departureTime) {
      Alert.alert('Error', 'Please enter the departure date and time');
      return false;
    }

    if (!formData.arrivalTime) {
      Alert.alert('Error', 'Please enter the arrival date and time');
      return false;
    }

    // Try to parse the date/time strings
    let departure: Date;
    let arrival: Date;

    try {
      departure = new Date(formData.departureTime);
      arrival = new Date(formData.arrivalTime);

      if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
        Alert.alert('Error', 'Please enter valid date and time');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Please enter valid date and time');
      return false;
    }

    if (arrival <= departure) {
      Alert.alert('Error', 'Arrival time must be after departure time');
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert('Error', 'Please enter the price per seat');
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }

    if (!formData.availableSeats.trim()) {
      Alert.alert('Error', 'Please enter the number of available seats');
      return false;
    }

    const seats = parseInt(formData.availableSeats);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      Alert.alert('Error', 'Please enter a valid number of seats (1-8)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {


    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const rideData: CreateRideData = {
        from: {
          city: formData.from.city.trim(),
          address: formData.from.address.trim(),
          coordinates: formData.from.coordinates,
        },
        to: {
          city: formData.to.city.trim(),
          address: formData.to.address.trim(),
          coordinates: formData.to.coordinates,
        },
        departureTime: new Date(formData.departureTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.availableSeats),
        stops: stops.length > 0 ? stops : undefined,
        details: formData.details.trim() || undefined,
      };


      const result = await createRide.mutateAsync(rideData);

      // Invalidate the driver-active-ride query to switch to driver mode
      queryClient.invalidateQueries({ queryKey: ['driver-active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['user-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });

      setTimeout(() => {
        Alert.alert(
          '🚀 Driver Mode Activated!',
          'Your ride has been created successfully. You are now in Driver Mode and passengers can book your ride.',
          [
            {
              text: 'View Active Ride',
              onPress: () => {
                // Navigate to active ride screen
                router.replace(`/ride/active?rideId=${result.ride._id}`);
              }
            },
            {
              text: 'Go to Home',
              style: 'cancel',
              onPress: () => {
                router.replace('/(tabs)/home');
              }
            }
          ]
        );
      }, 100);
    } catch (error: any) {
      console.error('Create ride error:', error);
      Alert.alert(
        'Creation Failed',
        error.response?.data?.message || 'Failed to create ride. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create a Ride</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Route Information</Text>

            <View style={styles.locationInputWrapper}>
              <Text style={styles.subsectionTitle}>From</Text>
              <TouchableOpacity
                style={styles.locationInputRow}
                onPress={() => setFromPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                </View>
                <View style={styles.locationInputTextContainer}>
                  <Text style={[styles.locationInputText, !formData.from.city && styles.locationPlaceholderText]}>
                    {formData.from.city || formData.from.address || 'Select departure location'}
                  </Text>
                  {formData.from.address && formData.from.city && (
                    <Text style={styles.locationInputSubtext} numberOfLines={1}>
                      {formData.from.address}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputWrapper}>
              <Text style={styles.subsectionTitle}>To</Text>
              <TouchableOpacity
                style={styles.locationInputRow}
                onPress={() => setToPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={20} color={Colors.danger} />
                </View>
                <View style={styles.locationInputTextContainer}>
                  <Text style={[styles.locationInputText, !formData.to.city && styles.locationPlaceholderText]}>
                    {formData.to.city || formData.to.address || 'Select destination location'}
                  </Text>
                  {formData.to.address && formData.to.city && (
                    <Text style={styles.locationInputSubtext} numberOfLines={1}>
                      {formData.to.address}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            </View>

            {/* Location Picker Modals */}
            <LocationPickerModal
              visible={isFromPickerVisible}
              onClose={() => setFromPickerVisible(false)}
              onSelect={handleFromLocationSelect}
              placeholder="Search departure location..."
              title="Where from?"
            />

            <LocationPickerModal
              visible={isToPickerVisible}
              onClose={() => setToPickerVisible(false)}
              onSelect={handleToLocationSelect}
              placeholder="Search destination location..."
              title="Where to?"
            />

            <Text style={styles.sectionTitle}>Schedule</Text>

            <Text style={styles.subsectionTitle}>Departure Date & Time</Text>
            <DateTimeInput
              placeholder="Select Departure Date & Time"
              value={formData.departureTime}
              onChangeText={(text) => handleChange('departureTime', text)}
              mode="datetime"
              minimumDate={new Date()}
            />

            <Text style={styles.subsectionTitle}>Arrival Date & Time</Text>
            <DateTimeInput
              placeholder="Select Arrival Date & Time"
              value={formData.arrivalTime}
              onChangeText={(text) => handleChange('arrivalTime', text)}
              mode="datetime"
              minimumDate={formData.departureTime ? new Date(formData.departureTime) : new Date()}
            />

            <Text style={styles.sectionTitle}>Ride Details</Text>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  placeholder="Price per seat (₹)"
                  value={formData.price}
                  onChangeText={(text) => handleChange('price', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  placeholder="Available Seats"
                  value={formData.availableSeats}
                  onChangeText={(text) => handleChange('availableSeats', text)}
                  keyboardType="numeric"
                  maxLength={1}
                />
              </View>
            </View>

            <Input
              placeholder="Additional details (optional)"
              value={formData.details}
              onChangeText={(text) => handleChange('details', text)}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Stops (Optional)</Text>

            {stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopText}>{stop.city} - {stop.address}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeStop(index)}
                  style={styles.removeStopButton}
                >
                  <Text style={styles.removeStopText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addStopContainer}>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    placeholder="Stop City"
                    value={newStop.city}
                    onChangeText={(text) => setNewStop(prev => ({ ...prev, city: text }))}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input
                    placeholder="Stop Address"
                    value={newStop.address}
                    onChangeText={(text) => setNewStop(prev => ({ ...prev, address: text }))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <Button
                title="Add Stop"
                onPress={addStop}
                variant="outline"
                style={styles.addStopButton}
              />
            </View>

            <Button
              title="Create Ride"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 162, 255, 0.9)',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    marginTop: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stopInfo: {
    flex: 1,
  },
  stopText: {
    fontSize: 14,
    color: '#333',
  },
  removeStopButton: {
    padding: 8,
  },
  removeStopText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  addStopContainer: {
    marginBottom: 20,
  },
  addStopButton: {
    marginTop: 12,
  },
  locationInputWrapper: {
    marginBottom: 16,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  locationIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  locationInputTextContainer: {
    flex: 1,
  },
  locationInputText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationPlaceholderText: {
    color: '#999',
    fontWeight: '400',
  },
  locationInputSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});