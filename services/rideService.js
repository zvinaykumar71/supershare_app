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
  };
};

export const rideService = {
  getAllRides: async () => {
    const response = await api.get('/rides');
    const rides = response.data?.rides || [];
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
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  getUserRides: async () => {
    const response = await api.get('/rides/my-rides');
    const rides = response.data?.rides || response.data || [];
    return rides.map(mapRide);
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



