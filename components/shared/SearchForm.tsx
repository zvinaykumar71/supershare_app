// components/shared/SearchForm.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Colors } from '../../Constants/Colors';
import { formatDate } from '../../utils/formatters';
import { LocationPickerModal } from '../ui/LocationPickerModal';

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
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isFromPickerVisible, setFromPickerVisible] = useState(false);
  const [isToPickerVisible, setToPickerVisible] = useState(false);

  const swapLocations = () => {
    onChange({
      ...values,
      from: values.to,
      to: values.from,
    });
  };

  const handleFromSelect = (location: { name: string; address: string }) => {
    onChange({ ...values, from: location.name });
  };

  const handleToSelect = (location: { name: string; address: string }) => {
    onChange({ ...values, to: location.name });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {/* From Location */}
        <TouchableOpacity 
          style={styles.inputRow}
          onPress={() => setFromPickerVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <View style={styles.inputTextContainer}>
            <Text style={[styles.inputText, !values.from && styles.placeholderText]}>
              {values.from || 'From'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
          <Ionicons name="swap-vertical" size={20} color={Colors.gray} />
        </TouchableOpacity>
        
        {/* To Location */}
        <TouchableOpacity 
          style={styles.inputRow}
          onPress={() => setToPickerVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={20} color={Colors.danger} />
          </View>
          <View style={styles.inputTextContainer}>
            <Text style={[styles.inputText, !values.to && styles.placeholderText]}>
              {values.to || 'To'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.optionsContainer}>
        {/* Date selector */}
        {Platform.OS === 'web' ? (
          <View style={[styles.option, { paddingRight: 12 }]}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <input
              type="date"
              value={(() => {
                const d = values.date instanceof Date ? values.date : new Date(values.date as any);
                if (!isFinite(d.getTime())) return '';
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              })()}
              onChange={(e) => {
                const v = e.target.value; // YYYY-MM-DD
                const parts = v.split('-');
                const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                onChange({ ...values, date });
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 16,
                color: Colors.primary,
                marginLeft: 6,
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.option}
            onPress={() => setDatePickerVisible(true)}
          >
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.optionText}>{formatDate(values.date)}</Text>
          </TouchableOpacity>
        )}

        {/* Passenger stepper */}
        <View style={styles.passengerOption}>
          <Ionicons name="people" size={20} color={Colors.primary} />
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepButton, values.passengers <= 1 && styles.stepButtonDisabled]}
              disabled={values.passengers <= 1}
              onPress={() => onChange({ ...values, passengers: Math.max(1, values.passengers - 1) })}
            >
              <Ionicons name="remove" size={18} color={values.passengers <= 1 ? Colors.gray : Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.passengerCount}>{values.passengers}</Text>
            <TouchableOpacity
              style={[styles.stepButton, values.passengers >= 8 && styles.stepButtonDisabled]}
              disabled={values.passengers >= 8}
              onPress={() => onChange({ ...values, passengers: Math.min(8, values.passengers + 1) })}
            >
              <Ionicons name="add" size={18} color={values.passengers >= 8 ? Colors.gray : Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Native date picker modal */}
      {Platform.OS !== 'web' && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={values.date instanceof Date ? values.date : new Date(values.date as any)}
          minimumDate={new Date()}
          onConfirm={(d) => {
            onChange({ ...values, date: d });
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
          is24Hour={true}
        />
      )}

      {/* Location Picker Modals */}
      <LocationPickerModal
        visible={isFromPickerVisible}
        onClose={() => setFromPickerVisible(false)}
        onSelect={handleFromSelect}
        placeholder="Search departure city..."
        title="Where from?"
      />

      <LocationPickerModal
        visible={isToPickerVisible}
        onClose={() => setToPickerVisible(false)}
        onSelect={handleToSelect}
        placeholder="Search destination city..."
        title="Where to?"
      />
      
      <TouchableOpacity 
        style={[styles.searchButton, (!values.from || !values.to) && styles.searchButtonDisabled]}
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
    paddingVertical: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: Colors.gray,
    fontWeight: '400',
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
  passengerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 6,
    gap: 8,
  },
  optionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  stepButtonDisabled: {
    borderColor: Colors.lightGray,
    backgroundColor: Colors.lightGray,
  },
  passengerCount: {
    minWidth: 20,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: '600',
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
  searchButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
