import { CreateRideData, Ride } from '../types/api';
import { api } from './api';

export const rideService = {
  getAllRides: async (): Promise<Ride[]> => {
    const response = await api.get('/rides');
    const rides = response.data?.rides || [];
    return rides.map((r: any) => {
      const departure = new Date(r.departureTime);
      const arrival = new Date(r.arrivalTime);
      const durationMs = Math.max(0, arrival.getTime() - departure.getTime());
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${hours}h ${minutes}m`;

      const mapped: Ride = {
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
        car: {
          make: '',
          model: '',
          color: '',
          plate: '',
        },
        duration,
        date: r.departureTime,
      };
      return mapped;
    });
  },
  searchRides: async (params: any): Promise<Ride[]> => {
    // Backend: GET /rides?from=..&to=..&date=YYYY-MM-DD&seats=1
    const response = await api.get('/rides', { params });
    const rides = response.data?.rides || response.data || [];
    return (rides as any[]).map((r: any) => {
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
      } as Ride;
    });
  },

  getRide: async (id: string): Promise<Ride> => {
    const response = await api.get(`/rides/${id}`);
    const r = response.data?.ride || response.data;
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
      car: {
        make: '',
        model: '',
        color: '',
        plate: '',
      },
      duration,
      date: r.departureTime,
    };
  },

  createRide: async (rideData: CreateRideData): Promise<Ride> => {
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  getUserRides: async (): Promise<Ride[]> => {
    const response = await api.get('/rides/my-rides');
    const rides = response.data?.rides || response.data || [];
    return (rides as any[]).map((r: any) => ({
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
      duration: '0h 0m',
      date: r.departureTime,
    }));
  },

  getUserBookings: async (): Promise<Ride[]> => {
    const response = await api.get('/rides/my-bookings');
    const bookings = response.data?.rides || response.data || [];
    return (bookings as any[]).map((r: any) => {
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
      } as Ride;
    });
  },

  bookRide: async (rideId: string, seats: number): Promise<any> => {
    const response = await api.post(`/rides/${rideId}/book`, { seats });
    return response.data;
  },
};