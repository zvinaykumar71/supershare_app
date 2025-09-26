import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function BecomeDriverScreen() {
  const [formData, setFormData] = useState({
    driverLicense: '',
    vehicle: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      type: '',
      seats: '',
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { becomeDriver } = useAuth();

  const handleChange = (field, value) => {
    if (field.startsWith('vehicle.')) {
      const vehicleField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.driverLicense.trim()) {
      Alert.alert('Error', 'Please enter your driver license number');
      return false;
    }

    if (!formData.vehicle.make.trim()) {
      Alert.alert('Error', 'Please enter the vehicle make');
      return false;
    }

    if (!formData.vehicle.model.trim()) {
      Alert.alert('Error', 'Please enter the vehicle model');
      return false;
    }

    if (!formData.vehicle.year.trim()) {
      Alert.alert('Error', 'Please enter the vehicle year');
      return false;
    }

    const year = parseInt(formData.vehicle.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      Alert.alert('Error', 'Please enter a valid vehicle year');
      return false;
    }

    if (!formData.vehicle.color.trim()) {
      Alert.alert('Error', 'Please enter the vehicle color');
      return false;
    }

    if (!formData.vehicle.licensePlate.trim()) {
      Alert.alert('Error', 'Please enter the license plate number');
      return false;
    }

    if (!formData.vehicle.type.trim()) {
      Alert.alert('Error', 'Please enter the vehicle type');
      return false;
    }

    if (!formData.vehicle.seats.trim()) {
      Alert.alert('Error', 'Please enter the number of seats');
      return false;
    }

    const seats = parseInt(formData.vehicle.seats);
    if (isNaN(seats) || seats < 2 || seats > 8) {
      Alert.alert('Error', 'Please enter a valid number of seats (2-8)');
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
      const driverData = {
        driverLicense: formData.driverLicense.trim(),
        vehicle: {
          make: formData.vehicle.make.trim(),
          model: formData.vehicle.model.trim(),
          year: parseInt(formData.vehicle.year),
          color: formData.vehicle.color.trim(),
          licensePlate: formData.vehicle.licensePlate.trim(),
          type: formData.vehicle.type.trim(),
          seats: parseInt(formData.vehicle.seats),
        }
      };

      await becomeDriver(driverData);
      
      Alert.alert(
        'Success!', 
        'You have successfully become a driver. You can now start accepting rides.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      console.error('Become driver error:', error);
      Alert.alert(
        'Registration Failed', 
        error.response?.data?.message || 'Failed to register as driver. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image 
        source={require('../../assets/images/logo.jpeg')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Become a Driver</Text>
      <Text style={styles.subtitle}>Join our driver community and start earning</Text>
      
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Driver Information</Text>
        
        <Input
          placeholder="Driver License Number"
          value={formData.driverLicense}
          onChangeText={(text) => handleChange('driverLicense', text)}
          autoCapitalize="characters"
        />

        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Make (e.g., Toyota)"
              value={formData.vehicle.make}
              onChangeText={(text) => handleChange('vehicle.make', text)}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Model (e.g., Camry)"
              value={formData.vehicle.model}
              onChangeText={(text) => handleChange('vehicle.model', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Year (e.g., 2022)"
              value={formData.vehicle.year}
              onChangeText={(text) => handleChange('vehicle.year', text)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Color (e.g., Blue)"
              value={formData.vehicle.color}
              onChangeText={(text) => handleChange('vehicle.color', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        <Input
          placeholder="License Plate Number"
          value={formData.vehicle.licensePlate}
          onChangeText={(text) => handleChange('vehicle.licensePlate', text.toUpperCase())}
          autoCapitalize="characters"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Type (e.g., sedan, SUV)"
              value={formData.vehicle.type}
              onChangeText={(text) => handleChange('vehicle.type', text)}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              placeholder="Number of Seats"
              value={formData.vehicle.seats}
              onChangeText={(text) => handleChange('vehicle.seats', text)}
              keyboardType="numeric"
              maxLength={1}
            />
          </View>
        </View>
        
        <Button 
          title="Become a Driver" 
          onPress={handleSubmit} 
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already a driver? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.footerLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 80,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
    color: '#333',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#757575',
  },
  footerLink: {
    color: '#00A2FF',
    fontWeight: 'bold',
  },
});
