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
import { useAuth } from '../../hooks/useAuth';
import { useCreateRide } from '../../hooks/useRides';
import { CreateRideData, Stop } from '../../types/api';

export default function CreateRideScreen() {
  const [formData, setFormData] = useState({
    from: {
      city: '',
      address: '',
    },
    to: {
      city: '',
      address: '',
    },
    departureTime: '',
    arrivalTime: '',
    price: '',
    availableSeats: '',
    details: '',
  });
  const [stops, setStops] = useState<Stop[]>([]);
  const [newStop, setNewStop] = useState({ city: '', address: '' });
  const [isLoading, setIsLoading] = useState(false);
  const createRide = useCreateRide();
  const { user } = useAuth();

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
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
        },
        to: {
          city: formData.to.city.trim(),
          address: formData.to.address.trim(),
        },
        departureTime: new Date(formData.departureTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.availableSeats),
        stops: stops.length > 0 ? stops : undefined,
        details: formData.details.trim() || undefined,
      };

      console.log("ride data==>",rideData)

      await createRide.mutateAsync(rideData);
      
      Alert.alert(
        'Success!', 
        'Your ride has been created successfully and is now available for booking.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
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
            
            <Text style={styles.subsectionTitle}>From</Text>
            <Input
              placeholder="Departure City"
              value={formData.from.city}
              onChangeText={(text) => handleChange('from.city', text)}
              autoCapitalize="words"
            />
            <Input
              placeholder="Departure Address"
              value={formData.from.address}
              onChangeText={(text) => handleChange('from.address', text)}
              autoCapitalize="words"
            />

            <Text style={styles.subsectionTitle}>To</Text>
            <Input
              placeholder="Destination City"
              value={formData.to.city}
              onChangeText={(text) => handleChange('to.city', text)}
              autoCapitalize="words"
            />
            <Input
              placeholder="Destination Address"
              value={formData.to.address}
              onChangeText={(text) => handleChange('to.address', text)}
              autoCapitalize="words"
            />

            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <DateTimeInput
              placeholder="Departure Date & Time (YYYY-MM-DD HH:MM)"
              value={formData.departureTime}
              onChangeText={(text) => handleChange('departureTime', text)}
            />
            
            <DateTimeInput
              placeholder="Arrival Date & Time (YYYY-MM-DD HH:MM)"
              value={formData.arrivalTime}
              onChangeText={(text) => handleChange('arrivalTime', text)}
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
});