import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Base API URL - prefer environment variable if available
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9000/api';

console.log("VINAY KUMAR BASE URL ==>",BASE_URL)

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and API key
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    const apiKey = await AsyncStorage.getItem('api_key');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('auth_token');
      AsyncStorage.removeItem('user');
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);