import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiKeyManager = {
  // Store API key
  setApiKey: async (apiKey) => {
    try {
      await AsyncStorage.setItem('api_key', apiKey);
    } catch (error) {
      console.error('Error storing API key:', error);
      throw error;
    }
  },

  // Get API key
  getApiKey: async () => {
    try {
      return await AsyncStorage.getItem('api_key');
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  },

  // Remove API key
  removeApiKey: async () => {
    try {
      await AsyncStorage.removeItem('api_key');
    } catch (error) {
      console.error('Error removing API key:', error);
      throw error;
    }
  },

  // Check if API key exists
  hasApiKey: async () => {
    try {
      const apiKey = await AsyncStorage.getItem('api_key');
      return apiKey !== null;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }
};
