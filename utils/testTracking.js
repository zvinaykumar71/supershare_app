// Test utility for real-time tracking and notifications
import { trackingService } from '../services/trackingService';
import { notificationService } from '../services/notificationService';

/**
 * Test real-time tracking functionality
 */
export const testTracking = {
  /**
   * Test location update
   */
  testLocationUpdate: async (rideId, location) => {
    console.log('🧪 TEST: Sending location update...');
    console.log('📍 Location:', location);
    console.log('🚗 Ride ID:', rideId);
    
    try {
      const result = await trackingService.updateLocation(rideId, location);
      console.log('✅ Location update successful:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Location update failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test ride tracking fetch
   */
  testRideTracking: async (rideId) => {
    console.log('🧪 TEST: Fetching ride tracking...');
    console.log('🚗 Ride ID:', rideId);
    
    try {
      const result = await trackingService.getRideTracking(rideId);
      console.log('✅ Tracking data received:', {
        rideStatus: result?.ride?.rideStatus,
        driverLocation: result?.tracking?.driverLocation,
        isTracking: result?.tracking?.isTracking,
        distanceToPickup: result?.tracking?.distanceToPickup,
        etaToPickup: result?.tracking?.etaToPickup,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Tracking fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test driver active ride
   */
  testDriverActiveRide: async () => {
    console.log('🧪 TEST: Fetching driver active ride...');
    
    try {
      const result = await trackingService.getDriverActiveRide();
      console.log('✅ Active ride data:', {
        hasRide: !!result?.ride,
        rideStatus: result?.ride?.rideStatus,
        passengers: result?.passengers?.length || 0,
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Active ride fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test start ride
   */
  testStartRide: async (rideId, location) => {
    console.log('🧪 TEST: Starting ride...');
    console.log('🚗 Ride ID:', rideId);
    console.log('📍 Initial Location:', location);
    
    try {
      const result = await trackingService.startRide(rideId, location);
      console.log('✅ Ride started successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Start ride failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Monitor tracking updates (for testing real-time behavior)
   */
  monitorTracking: (rideId, interval = 5000, duration = 60000) => {
    console.log('🧪 TEST: Starting tracking monitor...');
    console.log('⏱️  Interval:', interval, 'ms');
    console.log('⏱️  Duration:', duration, 'ms');
    
    let count = 0;
    const maxCount = duration / interval;
    const startTime = Date.now();
    
    const monitor = setInterval(async () => {
      count++;
      const elapsed = Date.now() - startTime;
      
      console.log(`\n📊 Update #${count} (${elapsed}ms elapsed)`);
      
      try {
        const result = await trackingService.getRideTracking(rideId);
        const driverLoc = result?.tracking?.driverLocation || result?.ride?.currentLocation;
        
        console.log('📍 Driver Location:', driverLoc);
        console.log('🚦 Status:', result?.ride?.rideStatus);
        console.log('📏 Distance to Pickup:', result?.tracking?.distanceToPickup, 'm');
        console.log('⏰ ETA to Pickup:', result?.tracking?.etaToPickup, 's');
        
        if (count >= maxCount) {
          clearInterval(monitor);
          console.log('\n✅ Monitoring complete');
        }
      } catch (error) {
        console.error('❌ Monitor update failed:', error.message);
      }
    }, interval);
    
    return () => clearInterval(monitor);
  },
};

/**
 * Test notification functionality
 */
export const testNotifications = {
  /**
   * Test fetching notifications
   */
  testGetNotifications: async (params = {}) => {
    console.log('🧪 TEST: Fetching notifications...');
    console.log('📋 Params:', params);
    
    try {
      const result = await notificationService.getNotifications(params);
      console.log('✅ Notifications received:', {
        count: result?.notifications?.length || 0,
        total: result?.total || 0,
        unreadCount: result?.unreadCount || 0,
      });
      
      if (result?.notifications?.length > 0) {
        console.log('📬 Sample notification:', {
          type: result.notifications[0].type,
          title: result.notifications[0].title,
          isRead: result.notifications[0].isRead,
        });
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Fetch notifications failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test unread count
   */
  testUnreadCount: async () => {
    console.log('🧪 TEST: Fetching unread count...');
    
    try {
      const result = await notificationService.getUnreadCount();
      console.log('✅ Unread count:', result?.unreadCount || 0);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Unread count fetch failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Monitor notifications (for testing real-time behavior)
   */
  monitorNotifications: (interval = 10000, duration = 60000) => {
    console.log('🧪 TEST: Starting notification monitor...');
    console.log('⏱️  Interval:', interval, 'ms');
    console.log('⏱️  Duration:', duration, 'ms');
    
    let count = 0;
    const maxCount = duration / interval;
    const startTime = Date.now();
    let lastUnreadCount = 0;
    
    const monitor = setInterval(async () => {
      count++;
      const elapsed = Date.now() - startTime;
      
      console.log(`\n📊 Notification Check #${count} (${elapsed}ms elapsed)`);
      
      try {
        const result = await notificationService.getNotifications({ limit: 10 });
        const unreadCount = result?.unreadCount || 0;
        const notificationCount = result?.notifications?.length || 0;
        
        console.log('📬 Total notifications:', notificationCount);
        console.log('🔔 Unread count:', unreadCount);
        
        if (unreadCount !== lastUnreadCount) {
          console.log('🆕 Unread count changed!', lastUnreadCount, '→', unreadCount);
          lastUnreadCount = unreadCount;
        }
        
        if (count >= maxCount) {
          clearInterval(monitor);
          console.log('\n✅ Notification monitoring complete');
        }
      } catch (error) {
        console.error('❌ Notification check failed:', error.message);
      }
    }, interval);
    
    return () => clearInterval(monitor);
  },
};

/**
 * Comprehensive test suite
 */
export const runAllTests = async (rideId, testLocation) => {
  console.log('\n🧪 ========== STARTING COMPREHENSIVE TESTS ==========\n');
  
  // Test tracking
  console.log('\n📍 === TRACKING TESTS ===\n');
  await testTracking.testDriverActiveRide();
  await testTracking.testRideTracking(rideId);
  
  if (testLocation) {
    await testTracking.testLocationUpdate(rideId, testLocation);
  }
  
  // Test notifications
  console.log('\n📬 === NOTIFICATION TESTS ===\n');
  await testNotifications.testUnreadCount();
  await testNotifications.testGetNotifications();
  
  console.log('\n✅ ========== TESTS COMPLETE ==========\n');
};
