// services/walletService.js
import { api } from './api';

/**
 * Wallet Service - Handles all wallet and payment operations
 * Backend APIs:
 * - GET /api/wallet - Get wallet balance and details
 * - POST /api/wallet/qr/generate - Generate QR code for ride payment
 * - POST /api/wallet/qr/confirm - Confirm payment via QR code
 * - POST /api/wallet/withdraw - Request withdrawal
 */

/**
 * Get wallet balance and details
 * API: GET /api/wallet
 * @returns {Promise<Object>} Wallet balance, transactions, and details
 */
export const getWalletBalance = async () => {
  try {
    const response = await api.get('/wallet');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    // Return default balance if endpoint doesn't exist
    if (error.response?.status === 404) {
      return { balance: 0, currency: 'INR', transactions: [] };
    }
    throw error;
  }
};

/**
 * Get wallet transaction history
 * Transactions are included in GET /api/wallet response
 * @param {Object} params - Query parameters (page, limit, type)
 * @returns {Promise<Object>} Transaction history with pagination
 */
export const getTransactions = async (params = {}) => {
  try {
    // Backend returns transactions with wallet, but we can also fetch separately if needed
    const response = await api.get('/wallet', { params });
    return {
      transactions: response.data.transactions || [],
      pagination: response.data.pagination || { page: 1, limit: 20, total: 0 }
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Return empty transactions if endpoint doesn't exist
    if (error.response?.status === 404) {
      return { transactions: [], pagination: { page: 1, limit: 20, total: 0 } };
    }
    throw error;
  }
};

/**
 * Add money to wallet
 * @param {number} amount - Amount to add
 * @param {string} paymentMethod - Payment method (upi, card, netbanking)
 * @returns {Promise<Object>} Payment response
 */
export const addMoney = async (amount, paymentMethod = 'upi') => {
  try {
    const response = await api.post('/wallet/add-money', {
      amount,
      paymentMethod,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    throw error;
  }
};

/**
 * Withdraw money from wallet
 * @param {number} amount - Amount to withdraw
 * @param {string} accountNumber - Bank account number
 * @param {string} ifscCode - IFSC code
 * @returns {Promise<Object>} Withdrawal response
 */
export const withdrawMoney = async (amount, accountNumber, ifscCode) => {
  try {
    const response = await api.post('/wallet/withdraw', {
      amount,
      accountNumber,
      ifscCode,
    });
    return response.data;
  } catch (error) {
    console.error('Error withdrawing money:', error);
    throw error;
  }
};

/**
 * Generate QR code for ride payment (Driver)
 * API: POST /api/wallet/qr/generate
 * @param {string} rideId - Ride ID
 * @param {number} amount - Total payment amount
 * @param {string} bookingId - Optional booking ID for per-passenger QR codes
 * @returns {Promise<Object>} QR code data and payment details
 */
export const generateQRCode = async (rideId, amount, bookingId = null) => {
  try {
    // Validate rideId
    if (!rideId) {
      throw new Error('Ride ID is required');
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    const requestBody = {
      rideId: String(rideId), // Ensure it's a string
      amount: Number(amount), // Ensure it's a number
    };
    
    // Add bookingId if provided (for per-passenger QR codes)
    if (bookingId) {
      requestBody.bookingId = String(bookingId);
    }

    const response = await api.post('/wallet/qr/generate', requestBody);
    return response.data;
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    // Provide more detailed error information
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Extract error message from different formats
      let message = 'Unknown error';
      if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.error) {
        message = errorData.error;
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors array format
        const errorMessages = errorData.errors.map(err => err.msg || err.message).filter(Boolean);
        message = errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation error';
      }
      
      console.error(`QR Generation Error [${status}]:`, message);
      console.error('Request data:', { rideId, amount });
      console.error('Response data:', errorData);
      
      // Create a more informative error
      const enhancedError = new Error(message);
      enhancedError.status = status;
      enhancedError.response = error.response;
      throw enhancedError;
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Error setting up the request
      console.error('Request setup error:', error.message);
      throw error;
    }
  }
};

/**
 * Confirm payment via QR code (User/Passenger)
 * API: POST /api/wallet/qr/confirm
 * @param {string} qrData - QR code data (rideId, amount, etc.)
 * @returns {Promise<Object>} Payment confirmation response
 */
export const confirmQRPayment = async (qrData) => {
  try {
    // Handle both string (JSON) and object formats
    let requestBody;
    if (typeof qrData === 'string') {
      try {
        requestBody = JSON.parse(qrData);
      } catch {
        // If parsing fails, assume it's the qrCode string itself
        requestBody = { qrCode: qrData };
      }
    } else {
      requestBody = qrData;
    }
    
    // Ensure qrCode is in the request
    if (!requestBody.qrCode && qrData.qrCode) {
      requestBody.qrCode = qrData.qrCode;
    }
    
    if (!requestBody.qrCode) {
      throw new Error('QR code is required');
    }
    
    const response = await api.post('/wallet/qr/confirm', { qrCode: requestBody.qrCode });
    return response.data;
  } catch (error) {
    console.error('Error confirming QR payment:', error);
    throw error;
  }
};

export const walletService = {
  getWalletBalance,
  getTransactions,
  addMoney,
  withdrawMoney,
  generateQRCode,
  confirmQRPayment,
};
