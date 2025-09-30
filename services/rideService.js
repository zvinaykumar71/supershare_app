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
    totalSeats: r.availableSeats,
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
      phone: '',
    },
    car: { make: '', model: '', color: '', plate: '' },
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
    // Backend: GET /rides?from=..&to=..&date=YYYY-MM-DD&seats=1
    const response = await api.get('/rides', { params });
    const rides = response.data?.rides || response.data || [];
    return rides.map(mapRide);
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
};