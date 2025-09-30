import { api } from './api';

export const bookingService = {
  createBooking: async ({ rideId, seats = 1, pickupPoint, dropoffPoint, notes, specialRequests }) => {
    // New unified bookings endpoint
    const payload = { rideId, seats, pickupPoint, dropoffPoint, notes, specialRequests };
    const response = await api.post(`/bookings`, payload);
    return response.data;
  },
  getUserBookings: async () => {
    const response = await api.get('/bookings');

    console.log("vinay look at this ")
    return response.data;
  },

  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id) => {
    await api.post(`/bookings/${id}/cancel`);
  },
  acceptBooking: async (id) => {
    // Driver accepts a pending booking
    const response = await api.post(`/bookings/${id}/accept`);
    return response.data;
  },
  rejectBooking: async (id) => {
    // Driver rejects a pending booking
    const response = await api.post(`/bookings/${id}/reject`);
    return response.data;
  },
};