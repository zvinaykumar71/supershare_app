// components/ui/DateTimeInput.tsx
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Colors } from '../../Constants/Colors';

interface DateTimeInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
}

export function DateTimeInput({ 
  placeholder, 
  value, 
  onChangeText, 
  error,
  mode = 'datetime',
  minimumDate,
}: DateTimeInputProps) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const formatDisplay = (dateString: string, displayMode: 'date' | 'time' | 'datetime'): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (displayMode === 'date') {
      return `${year}-${month}-${day}`;
    } else if (displayMode === 'time') {
      return `${hours}:${minutes}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleConfirm = (selectedDate: Date) => {
    // For 'date' or 'time', merge with existing value parts so we keep the other part intact
    if (mode !== 'datetime') {
      // If no existing value, create a base date (today at noon for better UX)
      let baseDate: Date;
      if (value) {
        const parsed = new Date(value);
        baseDate = isNaN(parsed.getTime()) ? new Date() : parsed;
      } else {
        baseDate = new Date();
        // Set to noon by default to avoid timezone issues
        baseDate.setHours(12, 0, 0, 0);
      }
      
      const merged = new Date(baseDate);
      if (mode === 'date') {
        merged.setFullYear(selectedDate.getFullYear());
        merged.setMonth(selectedDate.getMonth());
        merged.setDate(selectedDate.getDate());
      } else if (mode === 'time') {
        merged.setHours(selectedDate.getHours());
        merged.setMinutes(selectedDate.getMinutes());
        merged.setSeconds(0);
        merged.setMilliseconds(0);
      }
      onChangeText(merged.toISOString());
      setDatePickerVisibility(false);
      return;
    }

    onChangeText(selectedDate.toISOString());
    setDatePickerVisibility(false);
  };
  
  // Get the initial date for the picker
  const getInitialDate = (): Date => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    // Default to current time or minimum date if provided
    if (minimumDate && minimumDate > new Date()) {
      return minimumDate;
    }
    return new Date();
  };

  // Helper to format date for HTML input
  const formatForInput = (dateString: string, inputType: 'date' | 'time' | 'datetime-local'): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format in local timezone for HTML inputs
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (inputType === 'date') {
      return `${year}-${month}-${day}`;
    } else if (inputType === 'time') {
      return `${hours}:${minutes}`;
    }
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMinDateString = (): string => {
    if (!minimumDate) return '';
    const year = minimumDate.getFullYear();
    const month = String(minimumDate.getMonth() + 1).padStart(2, '0');
    const day = String(minimumDate.getDate()).padStart(2, '0');
    const hours = String(minimumDate.getHours()).padStart(2, '0');
    const minutes = String(minimumDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // WEB VERSION
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {mode === 'date' && (
          <input
            type="date"
            value={formatForInput(value, 'date')}
            min={minimumDate ? formatForInput(minimumDate.toISOString(), 'date') : undefined}
            onChange={(e) => {
              if (e.target.value) {
                const [yyyy, mm, dd] = e.target.value.split('-').map(Number);
                const base = value ? new Date(value) : new Date();
                base.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                const merged = new Date(base);
                merged.setFullYear(yyyy);
                merged.setMonth(mm - 1);
                merged.setDate(dd);
                onChangeText(merged.toISOString());
              }
            }}
            placeholder={placeholder}
            style={webInputStyle(error)}
          />
        )}
        {mode === 'time' && (
          <input
            type="time"
            value={formatForInput(value, 'time')}
            onChange={(e) => {
              if (e.target.value) {
                const [hh, mi] = e.target.value.split(':').map(Number);
                const base = value ? new Date(value) : new Date();
                const merged = new Date(base);
                merged.setHours(hh);
                merged.setMinutes(mi);
                merged.setSeconds(0);
                merged.setMilliseconds(0);
                onChangeText(merged.toISOString());
              }
            }}
            placeholder={placeholder}
            style={webInputStyle(error)}
          />
        )}
        {mode === 'datetime' && (
          <input
            type="datetime-local"
            value={formatForInput(value, 'datetime-local')}
            min={getMinDateString()}
            onChange={(e) => {
              if (e.target.value) {
                // Parse the local datetime string properly
                const localDate = new Date(e.target.value);
                onChangeText(localDate.toISOString());
              }
            }}
            placeholder={placeholder}
            style={webInputStyle(error)}
          />
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // MOBILE VERSION
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setDatePickerVisibility(true)}
        style={[styles.inputContainer, error && styles.inputContainerError]}
      >
        <Text style={[styles.valueText, !value && styles.placeholderText]}>
          {value ? formatDisplay(value, mode) : placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        date={getInitialDate()}
        minimumDate={minimumDate}
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisibility(false)}
        is24Hour={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  inputContainerError: {
    borderColor: Colors.danger,
  },
  valueText: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    textAlignVertical: 'center',
    textAlign: 'left',
    fontSize: 16,
    color: Colors.text,
    lineHeight: 50,
  },
  placeholderText: {
    color: Colors.gray,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});

const webInputStyle = (error?: string) => ({
  width: '100%',
  height: 50,
  padding: '0 16px',
  border: `1px solid ${error ? Colors.danger : Colors.border}`,
  borderRadius: 8,
  fontSize: 16,
  backgroundColor: Colors.card,
  fontFamily: 'inherit',
  outline: 'none',
} as React.CSSProperties);