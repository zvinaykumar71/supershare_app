export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isDriver: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: string;
  seats: number;
}

export interface DriverData {
  driverLicense: string;
  vehicle: Vehicle;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Location {
  city: string;
  address: string;
}

export interface Stop {
  city: string;
  address: string;
}

export interface CreateRideData {
  from: Location;
  to: Location;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  stops?: Stop[];
  details?: string;
}

export interface Ride {
  id: string;
  from: Location;
  to: Location;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  stops?: Stop[];
  details?: string;
  driver: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    trips: number;
    isVerified: boolean;
    bio: string;
    phone: string;
  };
  car: {
    make: string;
    model: string;
    color: string;
    plate: string;
  };
  duration: string;
  date: string;
}
