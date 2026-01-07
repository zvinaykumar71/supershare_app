

import { api } from './api';

export const bookingService = {
  // ==================== PASSENGER FUNCTIONS ====================
  
  /**
   * Create a new booking as a passenger
   * API: POST /bookings
   * Body: { rideId, seats, pickupPoint, dropoffPoint, notes, specialRequests }
   */
  createBooking: async ({ rideId, seats = 1, pickupPoint, dropoffPoint, notes, specialRequests }) => {
    const payload = { rideId, seats, pickupPoint, dropoffPoint, notes, specialRequests };
    const response = await api.post('/bookings', payload);
    return response.data;
  },

  /**
   * Get current user's bookings (passenger perspective)
   * API: GET /bookings/
   * Returns: List of user's bookings with ride details
   */
  getUserBookings: async () => {
    const response = await api.get('/bookings/passenger/requests');
    return response.data;
  },

  /**
   * Get passenger's pending booking requests
   * API: GET /bookings/passenger/requests
   * Returns: List of pending booking requests
   */
  getPassengerRequestsBookings: async (params = {}) => {
    const response = await api.get('/bookings/passenger/requests', { params });
    return response.data;
  },

  /**
   * Get specific booking details
   * API: GET /bookings/:id
   * Returns: Complete booking information
   */
  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Cancel a booking as passenger
   * API: PUT /bookings/:id/cancel
   */
  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  /**
   * Update booking details (seats, pickup/dropoff points, etc.)
   * API: PUT /bookings/:id
   * Body: { seats, pickupPoint, dropoffPoint, notes, specialRequests }
   */
  updateBooking: async (id, updateData) => {
    const response = await api.put(`/bookings/${id}`, updateData);
    return response.data;
  },

  // ==================== DRIVER FUNCTIONS ====================

  /**
   * Get all bookings for driver's rides
   * API: GET /bookings/driver
   * Returns: List of bookings for driver's rides
   */
  getDriverBookings: async (params = {}) => {
    const response = await api.get('/bookings/driver', { params });
    return response.data;
  },

  /**
   * Get pending booking requests for driver's rides
   * API: GET /bookings/driver/requests
   * Returns: List of pending booking requests for driver's rides
   */
  getDriverPendingRequests: async (params = {}) => {
    const response = await api.get('/bookings/driver/requests', { params });
    return response.data;
  },

  /**
   * Accept a booking request as driver
   * API: PUT /bookings/:id/respond
   * Body: { action: 'accept' }
   * Returns: Updated booking
   */
  acceptBooking: async (id) => {
    
    try {
      const response = await api.put(`/bookings/${id}/respond`, { action: 'accept' });
      return response.data;
    } catch (error) {
      console.error('=== ACCEPT BOOKING ERROR ===');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
      throw error;
    }
  },

  /**
   * Reject a booking request as driver
   * API: PUT /bookings/:id/respond
   * Body: { action: 'reject' }
   * Returns: Updated booking
   */
  rejectBooking: async (id) => {
    try {
      const response = await api.put(`/bookings/${id}/respond`, { action: 'reject' });
      return response.data;
    } catch (error) {
      console.error('=== REJECT BOOKING ERROR ===');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
      throw error;
    }
  },

  /**
   * Cancel a booking as driver (for driver's own rides)
   * API: POST /bookings/:id/driver-cancel
   */
  cancelBookingAsDriver: async (id, reason = '') => {
    const response = await api.post(`/bookings/${id}/driver-cancel`, { reason });
    return response.data;
  },

  /**
   * Get booking statistics for driver dashboard
   * API: GET /bookings/driver/stats
   * Returns: { totalBookings, pendingRequests, completedRides, revenue }
   */
  getDriverBookingStats: async () => {
    const response = await api.get('/bookings/driver/stats');
    return response.data;
  },

  // ==================== ADMIN/GENERAL FUNCTIONS ====================

  /**
   * Get all bookings with filtering (admin/driver use)
   * API: GET /bookings
   * Params: { status, rideId, passengerId, driverId, date, etc. }
   */
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  /**
   * Update booking status (admin/driver use)
   * API: PATCH /bookings/:id/status
   * Body: { status, reason }
   */
  updateBookingStatus: async (id, status, reason = '') => {
    const response = await api.patch(`/bookings/${id}/status`, { status, reason });
    return response.data;
  },

  /**
   * Add review/rating for a completed booking
   * API: POST /bookings/:id/review
   * Body: { rating, comment, type } // type: 'driver' or 'passenger'
   */
  addBookingReview: async (id, reviewData) => {
    const response = await api.post(`/bookings/${id}/review`, reviewData);
    return response.data;
  },

  /**
   * Get booking reviews/ratings
   * API: GET /bookings/:id/reviews
   */
  getBookingReviews: async (id) => {
    const response = await api.get(`/bookings/${id}/reviews`);
    return response.data;
  },

  /**
   * Send message to driver/passenger about booking
   * API: POST /bookings/:id/message
   * Body: { message, type } // type: 'driver_to_passenger' or 'passenger_to_driver'
   */
  sendBookingMessage: async (id, messageData) => {
    const response = await api.post(`/bookings/${id}/message`, messageData);
    return response.data;
  },


  usePassengerBookingRequests: async (params = {}) => {
    const response = await api.get('/bookings/passenger/requests', { params });
    return response.data;
  },  
};