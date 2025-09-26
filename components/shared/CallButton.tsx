import { Colors } from '@/Constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface CallButtonProps {
  type: 'voice' | 'video';
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

export function CallButton({ 
  type, 
  onPress, 
  size = 'medium', 
  style, 
  disabled = false 
}: CallButtonProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { button: 36, icon: 20 };
      case 'large':
        return { button: 56, icon: 28 };
      case 'medium':
      default:
        return { button: 44, icon: 24 };
    }
  };

  const { button: buttonSize, icon: iconSize } = getSize();
  const iconName = type === 'voice' ? 'call' : 'videocam';
  const backgroundColor = type === 'voice' ? Colors.primary : Colors.success;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: disabled ? Colors.gray : backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={iconName} 
        size={iconSize} 
        color="#FFFFFF" 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

// Optional: You can also create a separate component for call actions with labels
interface CallActionButtonProps extends CallButtonProps {
  label?: string;
}

export function CallActionButton({ 
  type, 
  onPress, 
  size = 'medium', 
  style, 
  disabled = false,
  label 
}: CallActionButtonProps) {
  return (
    <TouchableOpacity
    //   style={[styles.actionContainer, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <CallButton
        type={type}
        onPress={onPress}
        size={size}
        disabled={disabled}
      />
      {label && (
        <Ionicons 
          name={type === 'voice' ? 'call-outline' : 'videocam-outline'} 
          size={16} 
          color={disabled ? Colors.gray : Colors.text}
        //   style={styles.labelIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelIcon: {
    marginTop: 4,
  },
});