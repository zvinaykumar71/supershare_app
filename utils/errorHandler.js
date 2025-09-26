import { Alert } from 'react-native';

export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  console.error('API Error:', error);
  
  const message = error.response?.data?.message || 
                 error.message || 
                 defaultMessage;
  
  Alert.alert('Error', message);
  
  return message;
};