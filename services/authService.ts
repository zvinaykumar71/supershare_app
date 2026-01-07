import { AuthResponse, DriverData, LoginCredentials, RegisterData } from '../types/api';
import { api } from './api';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      // Ignore 404 errors - backend might not have logout endpoint
      // Local logout will still happen in the auth hook
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },

  becomeDriver: async (driverData: DriverData): Promise<AuthResponse> => {
    const response = await api.post('/auth/become-driver', driverData);
    return response.data;
  },
};