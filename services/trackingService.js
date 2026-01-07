import { api } from './api';

export const trackingService = {
  // ==================== DRIVER FUNCTIONS ====================

  /**
   * Start a ride
   * POST /tracking/rides/:id/start
   */
  startRide: async (rideId, location = null) => {
    const body = location ? { lat: location.lat, lng: location.lng } : {};
    const response = await api.post(`/tracking/rides/${rideId}/start`, body);
    return response.data;
  },

  /**
   * Update driver's current location
   * PUT /tracking/rides/:id/location
   */
  updateLocation: async (rideId, location) => {
    const response = await api.put(`/tracking/rides/${rideId}/location`, {
      lat: location.lat,
      lng: location.lng,
      heading: location.heading || null,
      speed: location.speed || null
    });
    return response.data;
  },

  /**
   * Complete a ride
   * POST /tracking/rides/:id/complete
   */
  completeRide: async (rideId) => {
    const response = await api.post(`/tracking/rides/${rideId}/complete`);
    return response.data;
  },

  /**
   * Get driver's active ride (in-progress)
   * GET /tracking/driver/active-ride
   */
  getDriverActiveRide: async () => {
    const response = await api.get('/tracking/driver/active-ride');
    return response.data;
  },

  /**
   * Get passengers for a ride
   * GET /tracking/rides/:id/passengers
   */
  getRidePassengers: async (rideId) => {
    const response = await api.get(`/tracking/rides/${rideId}/passengers`);
    return response.data;
  },

  // ==================== PASSENGER FUNCTIONS ====================

  /**
   * Get ride tracking info
   * GET /tracking/rides/:id
   */
  getRideTracking: async (rideId) => {
    const response = await api.get(`/tracking/rides/${rideId}`);
    return response.data;
  },

  /**
   * Get passenger's active rides
   * GET /tracking/passenger/active-rides
   */
  getPassengerActiveRides: async () => {
    const response = await api.get('/tracking/passenger/active-rides');
    return response.data;
  },

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Format distance for display
   */
  formatDistance: (meters) => {
    if (!meters) return 'Calculating...';
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  },

  /**
   * Format ETA for display
   */
  formatETA: (seconds) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) {
      return 'Less than 1 min';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
};

