// Test Helper Component - Add this to your app for easy testing
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { testTracking, testNotifications, runAllTests } from './testTracking';
import { Colors } from '@/Constants/Colors';
import { Ionicons } from '@expo/vector-icons';

/**
 * Test Helper Component
 * Add this to any screen for testing real-time tracking and notifications
 * 
 * Usage: Import and add <TestHelper /> to any screen
 */
export const TestHelper = () => {
  const [rideId, setRideId] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitorCleanup, setMonitorCleanup] = useState<(() => void) | null>(null);

  const handleTestTracking = async () => {
    if (!rideId) {
      Alert.alert('Error', 'Please enter a Ride ID');
      return;
    }

    const testLocation = {
      lat: 28.6139 + (Math.random() * 0.01), // Random location near Delhi
      lng: 77.2090 + (Math.random() * 0.01),
      heading: Math.random() * 360,
      speed: Math.random() * 60,
    };

    await testTracking.testRideTracking(rideId);
    await testTracking.testLocationUpdate(rideId, testLocation);
  };

  const handleTestNotifications = async () => {
    await testNotifications.testGetNotifications();
    await testNotifications.testUnreadCount();
  };

  const handleStartMonitoring = () => {
    if (!rideId) {
      Alert.alert('Error', 'Please enter a Ride ID for tracking monitor');
      return;
    }

    setIsMonitoring(true);
    const cleanup = testTracking.monitorTracking(rideId, 5000, 60000);
    setMonitorCleanup(() => cleanup);

    // Also start notification monitoring
    const notifCleanup = testNotifications.monitorNotifications(10000, 60000);
    
    setTimeout(() => {
      setIsMonitoring(false);
      cleanup();
      notifCleanup();
    }, 60000);
  };

  const handleStopMonitoring = () => {
    if (monitorCleanup) {
      monitorCleanup();
      monitorCleanup();
    }
    setIsMonitoring(false);
    Alert.alert('Stopped', 'Monitoring stopped');
  };

  const handleRunAllTests = async () => {
    if (!rideId) {
      Alert.alert('Error', 'Please enter a Ride ID');
      return;
    }

    const testLocation = {
      lat: 28.6139,
      lng: 77.2090,
    };

    await runAllTests(rideId, testLocation);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask" size={20} color={Colors.primary} />
        <Text style={styles.title}>Test Helper</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter Ride ID"
        value={rideId}
        onChangeText={setRideId}
        placeholderTextColor={Colors.gray}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestTracking}
        >
          <Ionicons name="location" size={16} color="white" />
          <Text style={styles.buttonText}>Test Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestNotifications}
        >
          <Ionicons name="notifications" size={16} color="white" />
          <Text style={styles.buttonText}>Test Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        {!isMonitoring ? (
          <TouchableOpacity
            style={[styles.button, styles.monitorButton]}
            onPress={handleStartMonitoring}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.buttonText}>Start Monitor</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopMonitoring}
          >
            <Ionicons name="stop" size={16} color="white" />
            <Text style={styles.buttonText}>Stop Monitor</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.runAllButton]}
          onPress={handleRunAllTests}
        >
          <Ionicons name="checkmark-circle" size={16} color="white" />
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        💡 Check console logs for detailed test results
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lightPrimary,
    padding: 15,
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  testButton: {
    backgroundColor: Colors.primary,
  },
  monitorButton: {
    backgroundColor: Colors.success,
  },
  stopButton: {
    backgroundColor: Colors.danger,
  },
  runAllButton: {
    backgroundColor: Colors.warning,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  note: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
