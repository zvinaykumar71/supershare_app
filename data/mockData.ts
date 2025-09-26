
import { Driver, Filter, Ride } from "@/types";

export const drivers: Driver[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    avatar: 'https://picsum.photos/200',
    rating: 4.8,
    trips: 42,
    isVerified: true,
    bio: 'Safe and punctual driver. I travel between Mumbai and Pune every weekend. Happy to share the ride!',
    phone: '+91 98765 43210',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    avatar: 'https://picsum.photos/201',
    rating: 4.9,
    trips: 67,
    isVerified: true,
    bio: 'Frequent traveler between Delhi and Jaipur. Prefer women co-travelers. AC car with comfortable seating.',
    phone: '+91 98765 43211',
  },
  {
    id: '3',
    name: 'Vikram Singh',
    avatar: 'https://picsum.photos/202',
    rating: 4.5,
    trips: 28,
    isVerified: false,
    bio: 'New to BlaBlaCar but experienced driver. Travel for work regularly.',
    phone: '+91 98765 43212',
  },
  {
    id: '4',
    name: 'Ananya Patel',
    avatar: 'https://picsum.photos/203',
    rating: 4.7,
    trips: 35,
    isVerified: true,
    bio: 'Comfortable and safe ride. I maintain my car well and always on time.',
    phone: '+91 98765 43213',
  },
  {
    id: '5',
    name: 'Suresh Menon',
    avatar: 'https://picsum.photos/204',
    rating: 4.6,
    trips: 19,
    isVerified: true,
    bio: 'Business traveler with flexible timings. Happy to accommodate.',
    phone: '+91 98765 43214',
  },
  {
    id: '6',
    name: 'Neha Gupta',
    avatar: 'https://picsum.photos/205',
    rating: 4.9,
    trips: 53,
    isVerified: true,
    bio: 'Women-only rides available. Safe and comfortable journey guaranteed.',
    phone: '+91 98765 43215',
  },
];

export const cars: Car[] = [
  {
    model: 'Maruti Swift Dzire',
    color: 'White',
    plate: 'MH-01-AB-1234',
    ac: true,
  },
  {
    model: 'Hyundai Creta',
    color: 'Silver',
    plate: 'DL-02-CD-5678',
    ac: true,
  },
  {
    model: 'Honda City',
    color: 'Black',
    plate: 'KA-03-EF-9012',
    ac: true,
  },
  {
    model: 'Toyota Innova',
    color: 'Grey',
    plate: 'MH-12-GH-3456',
    ac: true,
  },
  {
    model: 'Tata Nexon',
    color: 'Blue',
    plate: 'TN-04-IJ-7890',
    ac: true,
  },
  {
    model: 'Mahindra XUV700',
    color: 'Red',
    plate: 'RJ-05-KL-1234',
    ac: true,
  },
];

export const locations: Location[] = [
  {
    city: 'Mumbai',
    address: 'Bandra Kurla Complex',
    lat: 19.0760,
    lng: 72.8777,
  },
  {
    city: 'Pune',
    address: 'Shivajinagar',
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    city: 'Delhi',
    address: 'Connaught Place',
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    city: 'Jaipur',
    address: 'Malviya Nagar',
    lat: 26.9124,
    lng: 75.7873,
  },
  {
    city: 'Bangalore',
    address: 'MG Road',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    city: 'Chennai',
    address: 'T Nagar',
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    city: 'Hyderabad',
    address: 'Banjara Hills',
    lat: 17.3850,
    lng: 78.4867,
  },
  {
    city: 'Goa',
    address: 'Panaji',
    lat: 15.2993,
    lng: 74.1240,
  },
];

export const rides: Ride[] = [
  {
    id: '1',
    driver: drivers[0],
    car: cars[0],
    from: locations[0],
    to: locations[1],
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    departureTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow 10:00 AM
    arrivalTime: new Date(Date.now() + 29 * 60 * 60 * 1000), // Tomorrow 1:00 PM
    duration: '3h',
    price: 500,
    availableSeats: 2,
    totalSeats: 4,
    instantBooking: true,
    womenOnly: false,
  },
  {
    id: '2',
    driver: drivers[1],
    car: cars[1],
    from: locations[2],
    to: locations[3],
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    departureTime: new Date(Date.now() + 27 * 60 * 60 * 1000), // Tomorrow 11:00 AM
    arrivalTime: new Date(Date.now() + 31 * 60 * 60 * 1000), // Tomorrow 3:00 PM
    duration: '4h',
    price: 600,
    availableSeats: 1,
    totalSeats: 3,
    instantBooking: true,
    womenOnly: true,
  },
  {
    id: '3',
    driver: drivers[2],
    car: cars[2],
    from: locations[4],
    to: locations[5],
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    departureTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // Day after tomorrow 2:00 PM
    arrivalTime: new Date(Date.now() + 54 * 60 * 60 * 1000), // Day after tomorrow 6:00 PM
    duration: '4h',
    price: 550,
    availableSeats: 3,
    totalSeats: 4,
    instantBooking: false,
    womenOnly: false,
  },
  {
    id: '4',
    driver: drivers[3],
    car: cars[3],
    from: locations[0],
    to: locations[1],
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    departureTime: new Date(Date.now() + 28 * 60 * 60 * 1000), // Tomorrow 12:00 PM
    arrivalTime: new Date(Date.now() + 31 * 60 * 60 * 1000), // Tomorrow 3:00 PM
    duration: '3h',
    price: 450,
    availableSeats: 1,
    totalSeats: 3,
    instantBooking: true,
    womenOnly: false,
  },
  {
    id: '5',
    driver: drivers[4],
    car: cars[4],
    from: locations[6],
    to: locations[7],
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
    departureTime: new Date(Date.now() + 74 * 60 * 60 * 1000), // In 3 days 2:00 PM
    arrivalTime: new Date(Date.now() + 80 * 60 * 60 * 1000), // In 3 days 8:00 PM
    duration: '6h',
    price: 800,
    availableSeats: 2,
    totalSeats: 4,
    instantBooking: true,
    womenOnly: false,
  },
  {
    id: '6',
    driver: drivers[5],
    car: cars[5],
    from: locations[2],
    to: locations[3],
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    departureTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow 10:00 AM
    arrivalTime: new Date(Date.now() + 30 * 60 * 60 * 1000), // Tomorrow 2:00 PM
    duration: '4h',
    price: 650,
    availableSeats: 2,
    totalSeats: 3,
    instantBooking: true,
    womenOnly: true,
  },
  {
    id: '7',
    driver: drivers[0],
    car: cars[0],
    from: locations[1],
    to: locations[0],
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In 4 days
    departureTime: new Date(Date.now() + 98 * 60 * 60 * 1000), // In 4 days 2:00 PM
    arrivalTime: new Date(Date.now() + 101 * 60 * 60 * 1000), // In 4 days 5:00 PM
    duration: '3h',
    price: 500,
    availableSeats: 3,
    totalSeats: 4,
    instantBooking: false,
    womenOnly: false,
  },
  {
    id: '8',
    driver: drivers[1],
    car: cars[1],
    from: locations[3],
    to: locations[2],
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    departureTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // Day after tomorrow 2:00 PM
    arrivalTime: new Date(Date.now() + 54 * 60 * 60 * 1000), // Day after tomorrow 6:00 PM
    duration: '4h',
    price: 600,
    availableSeats: 1,
    totalSeats: 3,
    instantBooking: true,
    womenOnly: true,
  },
];

export const filters: Filter[] = [
  {
    id: 'verified',
    label: 'Verified only',
    icon: 'checkmark-circle',
  },
  {
    id: 'instant',
    label: 'Instant booking',
    icon: 'flash',
  },
  {
    id: 'womenOnly',
    label: 'Women only',
    icon: 'female',
  },
  {
    id: 'ac',
    label: 'AC',
    icon: 'snow',
  },
  {
    id: 'pets',
    label: 'Pets allowed',
    icon: 'paw',
  },
];