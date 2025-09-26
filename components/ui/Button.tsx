// components/ui/Button.tsx
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../Constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  icon,
  style 
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.lightGray;
    if (variant === 'primary') return Colors.primary;
    if (variant === 'secondary') return Colors.secondary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return Colors.gray;
    if (variant === 'outline') return Colors.primary;
    return '#FFFFFF';
  };

  const getBorderColor = () => {
    if (disabled) return Colors.lightGray;
    if (variant === 'outline') return Colors.primary;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={20} 
              color={getTextColor()} 
              style={styles.icon} 
            />
          )}
          <Text style={[styles.text, { color: getTextColor() }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});