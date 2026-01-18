import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve base URL: prefer EXPO_PUBLIC_API_URL, otherwise infer from dev host
function resolveBaseUrl(): string {
  // 1. Check environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Check app.json extra config for apiHost
  const configuredHost = Constants.expoConfig?.extra?.apiHost;
  if (configuredHost) {
    return `http://${configuredHost}:9000/api`;
  }

  // 3. Try to detect from Expo dev server
  let hostUri: string | undefined;
  try {
    hostUri = 
      Constants.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoGo?.developer?.host ||
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest?.hostUri;
  } catch (e) {
    console.log('Error getting hostUri:', e);
  }

  let host = 'localhost';
  
  if (hostUri) {
    // Extract just the IP/hostname, removing any port
    host = hostUri.split(':')[0];
  }

  // For Android emulator, use 10.0.2.2 to reach host machine
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2';
  }

  const baseUrl = `http://${host}:9000/api`;
  return baseUrl;
}

const BASE_URL = resolveBaseUrl();

console.log('API BASE URL =>', BASE_URL);

// Create axios instance with longer timeout for operations that may take time
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased to 30 seconds for slower networks/backends
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