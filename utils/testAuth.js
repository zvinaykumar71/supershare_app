import { authService } from '../services/authService';
import { apiKeyManager } from './apiKeyManager';

export const testAuth = {
  // Test login with sample credentials
  testLogin: async (email = 'vinaykumar@yopmail.com', password = 'password123') => {
    try {
      console.log('Testing login with:', { email, password: '***' });
      const response = await authService.login({ email, password });
      console.log('Login successful:', response);
      return response;
    } catch (error) {
      console.error('Login test failed:', error);
      throw error;
    }
  },

  // Test registration with sample data
  testRegister: async (userData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'password123'
  }) => {
    try {
      console.log('Testing registration with:', { ...userData, password: '***' });
      const response = await authService.register(userData);
      console.log('Registration successful:', response);
      return response;
    } catch (error) {
      console.error('Registration test failed:', error);
      throw error;
    }
  },

  // Set up API key for testing
  setupApiKey: async (apiKey = 'your-api-key-here') => {
    try {
      await apiKeyManager.setApiKey(apiKey);
      console.log('API key set successfully');
      return true;
    } catch (error) {
      console.error('Failed to set API key:', error);
      return false;
    }
  },

  // Check if API key is set
  checkApiKey: async () => {
    try {
      const hasKey = await apiKeyManager.hasApiKey();
      console.log('API key status:', hasKey ? 'Set' : 'Not set');
      return hasKey;
    } catch (error) {
      console.error('Failed to check API key:', error);
      return false;
    }
  }
};
