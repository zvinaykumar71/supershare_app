import { api } from './api';

const mapRide = (r) => {
  const departure = new Date(r.departureTime);
  const arrival = new Date(r.arrivalTime);
  const durationMs = Math.max(0, arrival.getTime() - departure.getTime());
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${hours}h ${minutes}m`;

  return {
    id: r._id,
    from: r.from,
    to: r.to,
    departureTime: r.departureTime,
    arrivalTime: r.arrivalTime,
    price: r.price,
    availableSeats: r.availableSeats,
    bookedSeats: r.bookedSeats || 0,
    totalSeats: r.totalSeats || r.availableSeats + (r.bookedSeats || 0),
    rideStatus: r.rideStatus || 'scheduled',
    currentLocation: r.currentLocation,
    stops: r.stops || [],
    details: r.details || '',
    driver: {
      id: r.driver?._id || '',
      name: r.driver?.name || 'Driver',
      avatar: r.driver?.profilePicture || 'https://picsum.photos/100',
      rating: r.driver?.rating ?? 0,
      trips: r.driver?.reviewsCount ?? 0,
      isVerified: true,
      bio: '',
      phone: r.driver?.phone || '',
      vehicle: r.driver?.vehicle || null,
    },
    car: r.driver?.vehicle ? {
      make: r.driver.vehicle.make || '',
      model: r.driver.vehicle.model || '',
      color: r.driver.vehicle.color || '',
      plate: r.driver.vehicle.licensePlate || ''
    } : { make: '', model: '', color: '', plate: '' },
    duration,
    date: r.departureTime,
    // Match info for intermediate stops support
    matchInfo: r.matchInfo || {
      pickupMatch: 'start',
      pickupIndex: 0,
      dropoffMatch: 'end',
      dropoffIndex: -1,
      isPartialRoute: false,
      routeCoverage: 100
    },
  };
};

export const rideService = {
  getAllRides: async (params = {}) => {
    // Include status parameter to get all rides (including completed)
    // Backend should return all rides if no status filter, or include completed if status=all
    const queryParams = {
      ...params,
      // Request all rides including completed ones
      includeCompleted: true,
      status: 'all', // Try to get all statuses
    };

    const response = await api.get('/rides', { params: queryParams });
    console.log(' getAllRides response:', response.data);
    const rides = response.data?.rides || response.data || [];

    // Log what we received for debugging
    console.log('📊 [RIDE SERVICE] getAllRides response:', {
      totalRides: rides.length,
      statuses: rides.map((r: any) => r.rideStatus || r.status),
      completedCount: rides.filter((r: any) =>
        (r.rideStatus === 'completed' || r.rideStatus === 'COMPLETED' || r.status === 'completed' || r.status === 'COMPLETED')
      ).length,
    });

    return rides.map(mapRide);
  },

  searchRides: async (params) => {
    // Backend: GET /rides/search?from=..&to=..&date=YYYY-MM-DD&seats=1

    // Build search params - trim and handle case
    const searchParams = {
      ...(params.from && { from: params.from.trim() }),
      ...(params.to && { to: params.to.trim() }),
      ...(params.date && { date: params.date }),
      ...(params.seats && { seats: params.seats }),
    };


    try {
      // Try dedicated search endpoint first
      const response = await api.get('/rides/search', { params: searchParams });
      const rides = response.data?.rides || response.data || [];
      return rides.map(mapRide);
    } catch (error) {
      console.log('Search endpoint failed, trying /rides/available:', error.message);

      try {
        // Try /rides/available endpoint
        const response = await api.get('/rides/available', { params: searchParams });
        const rides = response.data?.rides || response.data || [];
        return rides.map(mapRide);
      } catch (error2) {

        // Fallback to /rides with query params
        const response = await api.get('/rides', { params: searchParams });
        const rides = response.data?.rides || response.data || [];
        return rides.map(mapRide);
      }
    }
  },

  getRide: async (id) => {
    const response = await api.get(`/rides/${id}`);
    const r = response.data?.ride || response.data;
    return mapRide(r);
  },

  createRide: async (rideData) => {
    // Use longer timeout for create ride operation as it may involve complex processing
    const response = await api.post('/rides', rideData, {
      timeout: 60000, // 60 seconds for create ride
    });
    return response.data;
  },

  getUserRides: async () => {
    // Get all user rides including completed ones
    try {
      const response = await api.get('/rides/my-rides', {
        params: {
          includeCompleted: true,
          status: 'all'
        }
      });
      const rides = response.data?.rides || response.data || [];

      console.log('📊 [RIDE SERVICE] getUserRides response:', {
        totalRides: rides.length,
        statuses: rides.map((r: any) => r.rideStatus || r.status),
      });

      return rides.map(mapRide);
    } catch (error) {
      // If endpoint doesn't exist (404), return empty array instead of throwing
      if (error.response?.status === 404) {
        console.log('⚠️ [RIDE SERVICE] /rides/my-rides endpoint not found (404)');
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Get ride history (completed rides)
   * API: GET /rides/history or GET /rides?status=completed
   */
  getRideHistory: async () => {
    try {
      // Try dedicated history endpoint first
      const response = await api.get('/rides/history');
      const rides = response.data?.rides || response.data || [];
      console.log('📊 [RIDE SERVICE] getRideHistory from /rides/history:', rides.length);
      return rides.map(mapRide);
    } catch (error) {
      console.log('⚠️ History endpoint /rides/history not available, trying alternatives');
      // Fallback: try with status filter
      try {
        const response = await api.get('/rides', {
          params: {
            status: 'completed',
            includeCompleted: true
          }
        });
        const rides = response.data?.rides || response.data || [];
        console.log('📊 [RIDE SERVICE] getRideHistory from /rides?status=completed:', rides.length);
        return rides.map(mapRide);
      } catch (error2) {
        console.warn('⚠️ Both history endpoints failed, will filter from getAllRides');
        // Last fallback: get all rides and filter on frontend
        // Call getAllRides directly to avoid circular reference
        const response = await api.get('/rides', {
          params: {
            includeCompleted: true,
            status: 'all'
          }
        });
        const allRides = response.data?.rides || response.data || [];
        const completedRides = allRides.filter((ride: any) => {
          const status = ride.rideStatus || ride.status;
          return status === 'completed' || status === 'COMPLETED';
        });
        console.log('📊 [RIDE SERVICE] getRideHistory filtered from all rides:', {
          total: allRides.length,
          completed: completedRides.length
        });
        return completedRides.map(mapRide);
      }
    }
  },

  getUserBookings: async () => {
    const response = await api.get('/rides/my-bookings');
    const bookings = response.data?.rides || response.data || [];
    return bookings.map(mapRide);

  },

  bookRide: async (rideId, seats) => {
    const response = await api.post(`/rides/${rideId}/book`, { seats });
    return response.data;
  },

  getRideBookingRequests: async (rideId, seats) => {
    const response = await api.get(`/rides/${rideId}/booking-requests`);
    return response.data;
  },


  getDriverCurrentRide: async () => {
    const response = await api.get(`/rides/driver/current`);
    return response.data;
  },

  cancelRide: async (rideId) => {
    const response = await api.delete(`/rides/${rideId}`);
    return response.data;
  },

  // Get all available rides for passengers to book
  getAvailableRides: async (params = {}) => {
    // Try different endpoints that might return available rides
    const endpoints = [
      '/rides/search',
      '/rides/available',
      '/rides/all',
      '/rides'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint, { params });
        const rides = response.data?.rides || response.data || [];
        if (Array.isArray(rides)) {
          return rides.map(mapRide);
        }
      } catch (error) {
        console.log(`${endpoint} failed:`, error.message);
      }
    }

    return [];
  }
};



