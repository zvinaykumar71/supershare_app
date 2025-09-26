import { api } from './api';

export const bookingService = {
  createBooking: async ({ rideId, seats = 1 }) => {
    const response = await api.post(`/rides/${rideId}/bookings`, { seats });
    return response.data;
  },
  getUserBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id) => {
    await api.post(`/bookings/${id}/cancel`);
  },
};