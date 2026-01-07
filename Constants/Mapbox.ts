// Mapbox Configuration
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYmxhLWJsYS1tYXBib3giLCJhIjoiY21qdWp1aHp5NHpwNjNlcXhvZHdobHBqdSJ9.HY2XzzczySeboHjMRpJwYw';

// Default map settings
export const DEFAULT_MAP_CENTER = {
  latitude: 28.6139, // Delhi, India (central location)
  longitude: 77.2090,
};

export const DEFAULT_ZOOM_LEVEL = 10;

// India bounds for map
export const INDIA_BOUNDS = {
  ne: [97.4, 35.5], // Northeast
  sw: [68.1, 6.7],  // Southwest
};

// City coordinates for common Indian cities
export const CITY_COORDINATES: { [key: string]: { latitude: number; longitude: number } } = {
  'delhi': { latitude: 28.6139, longitude: 77.2090 },
  'mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'chennai': { latitude: 13.0827, longitude: 80.2707 },
  'kolkata': { latitude: 22.5726, longitude: 88.3639 },
  'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
  'pune': { latitude: 18.5204, longitude: 73.8567 },
  'jaipur': { latitude: 26.9124, longitude: 75.7873 },
  'noida': { latitude: 28.5355, longitude: 77.3910 },
  'gurgaon': { latitude: 28.4595, longitude: 77.0266 },
  'rampur': { latitude: 28.7930, longitude: 79.0250 },
  'moradabad': { latitude: 28.8386, longitude: 78.7733 },
  'lucknow': { latitude: 26.8467, longitude: 80.9462 },
  'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
  'goa': { latitude: 15.2993, longitude: 74.1240 },
};

// Get coordinates for a city name (case-insensitive)
export const getCityCoordinates = (cityName: string): { latitude: number; longitude: number } | null => {
  const normalizedCity = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalizedCity] || null;
};

