// components/shared/SearchForm.tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../Constants/Colors';
import { formatDate } from '../../utils/formatters';

interface SearchFormProps {
  values: {
    from: string;
    to: string;
    date: Date;
    passengers: number;
  };
  onChange: (values: any) => void;
  onSubmit: () => void;
}

export function SearchForm({ values, onChange, onSubmit }: SearchFormProps) {
  const swapLocations = () => {
    onChange({
      ...values,
      from: values.to,
      to: values.from,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <View style={styles.inputRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="From"
            value={values.from}
            onChangeText={(text) => onChange({ ...values, from: text })}
            placeholderTextColor={Colors.gray}
          />
        </View>
        
        <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
          <Ionicons name="swap-vertical" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        <View style={styles.inputRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={20} color={Colors.danger} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="To"
            value={values.to}
            onChangeText={(text) => onChange({ ...values, to: text })}
            placeholderTextColor={Colors.gray}
          />
        </View>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={styles.optionText}>{formatDate(values.date)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option}>
          <Ionicons name="people" size={20} color={Colors.primary} />
          <Text style={styles.optionText}>
            {values.passengers} passenger{values.passengers !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.searchButton}
        onPress={onSubmit}
        disabled={!values.from || !values.to}
      >
        <Text style={styles.searchButtonText}>Search rides</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputsContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.text,
  },
  swapButton: {
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginVertical: 4,
    padding: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 6,
    gap: 6,
  },
  optionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});