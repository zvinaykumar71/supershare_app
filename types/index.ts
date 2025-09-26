// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  trips: number;
  isVerified: boolean;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  trips: number;
  isVerified: boolean;
  bio: string;
  phone: string;
}

export interface Car {
  model: string;
  color: string;
  plate: string;
  ac: boolean;
}

export interface Location {
  city: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  driver: Driver;
  car: Car;
  from: Location;
  to: Location;
  date: Date;
  departureTime: Date;
  arrivalTime: Date;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  instantBooking: boolean;
  womenOnly: boolean;
}

export interface Filter {
  id: string;
  label: string;
  icon: string;
}

export interface Booking {
  id: string;
  rideId: string;
  userId: string;
  seats: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}