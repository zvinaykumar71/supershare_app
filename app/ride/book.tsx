import { Button } from '@/components/ui/Button';
import { Colors } from '@/Constants/Colors';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRide } from '@/hooks/useRides';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function BookRideScreen() {
  const params = useLocalSearchParams();
  const rideId = (params.id as string) || '';

  const { data: ride } = useRide(rideId);
  const createBooking = useCreateBooking();

  const [seats, setSeats] = useState(1);
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [notes, setNotes] = useState('');
  const [luggage, setLuggage] = useState('0');
  const [pets, setPets] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [music, setMusic] = useState(true);
  const [ac, setAc] = useState(true);

  useEffect(() => {
    if (ride) {
      setPickupPoint(ride.from?.address || '');
      setDropoffPoint(ride.to?.address || '');
    }
  }, [ride]);

  const totalPrice = useMemo(() => {
    return (ride?.price || 0) * seats;
  }, [ride, seats]);

  const handleSubmit = async () => {
    if (!rideId) return;
    try {
      await createBooking.mutateAsync({
        rideId,
        seats,
        pickupPoint,
        dropoffPoint,
        notes,
        specialRequests: {
          luggage: Number(luggage) || 0,
          pets,
          smoking,
          music,
          ac,
        },
      });
      Alert.alert('Success', 'Booking request sent successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to send booking request');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request booking</Text>
        {ride && (
          <Text style={styles.price}>{formatCurrency(ride.price)} per seat</Text>
        )}
      </View>

      <View style={styles.formGroup}> 
        <Text style={styles.label}>Seats</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(seats)}
          onChangeText={(t) => setSeats(Math.max(1, Math.min(10, Number(t) || 1)))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pickup point</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pickup location"
          value={pickupPoint}
          onChangeText={setPickupPoint}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dropoff point</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter dropoff location"
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
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>{formatCurrency(totalPrice)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Send booking request" onPress={handleSubmit} loading={createBooking.isPending} />
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
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  actions: {
    padding: 20,
  },
});


