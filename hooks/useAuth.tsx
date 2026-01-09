import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { DriverData, LoginCredentials, RegisterData, UpdateProfileData, User } from '../types/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  becomeDriver: (driverData: DriverData) => Promise<any>;
  updateProfile: (profileData: UpdateProfileData) => Promise<User>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('auth_token');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      // Store user data and token
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('auth_token', response.token);
      
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      
      // Store user data and token
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('auth_token', response.token);
      
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API call result
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const becomeDriver = async (driverData: DriverData) => {
    try {
      setIsLoading(true);
      const response = await authService.becomeDriver(driverData);
      
      // Update user data with driver status
      if (user) {
        const updatedUser = { ...user, isDriver: true };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      return response;
    } catch (error) {
      console.error('Become driver error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: UpdateProfileData): Promise<User> => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(profileData);
      
      // Update local user data
      const updatedUser = { ...user, ...response.user };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getProfile();
      // Map backend response to our User type
      const mappedUser: User = {
        id: freshUser.id || (freshUser as any)._id,
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone,
        isDriver: freshUser.isDriver,
        profilePicture: freshUser.profilePicture,
        rating: freshUser.rating,
        reviewsCount: freshUser.reviewsCount,
      };
      await AsyncStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, becomeDriver, updateProfile, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}