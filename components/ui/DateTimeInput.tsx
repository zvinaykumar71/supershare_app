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
}

export function DateTimeInput({ 
  placeholder, 
  value, 
  onChangeText, 
  error,
  mode = 'datetime',
}: DateTimeInputProps) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const formatDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleConfirm = (selectedDate: Date) => {
    // For 'date' or 'time', merge with existing value parts so we keep the other part intact
    if (mode !== 'datetime' && value) {
      const current = new Date(value);
      const merged = new Date(current);
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

  // WEB VERSION
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {mode === 'date' && (
          <input
            type="date"
            value={value ? new Date(value).toISOString().slice(0, 10) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const [yyyy, mm, dd] = e.target.value.split('-').map(Number);
                const base = value ? new Date(value) : new Date();
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
            value={value ? new Date(value).toISOString().slice(11, 16) : ''}
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
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              if (e.target.value) {
                onChangeText(new Date(e.target.value).toISOString());
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
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        date={value ? new Date(value) : new Date()}
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