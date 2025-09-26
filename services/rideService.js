import { CreateRideData, Ride } from '../types/api';
import { api } from './api';

export const rideService = {
  searchRides: async (params: any): Promise<Ride[]> => {
    const response = await api.get('/rides/search', { params });
    return response.data;
  },

  getRide: async (id: string): Promise<Ride> => {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },

  createRide: async (rideData: CreateRideData): Promise<Ride> => {
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  getUserRides: async (): Promise<Ride[]> => {
    const response = await api.get('/rides/my-rides');
    return response.data;
  },

  bookRide: async (rideId: string, seats: number): Promise<any> => {
    const response = await api.post(`/rides/${rideId}/book`, { seats });
    return response.data;
  },
};