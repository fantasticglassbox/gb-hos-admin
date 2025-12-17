import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and hotel_id for hotel_admin
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For hotel_admin, automatically add hotel_id to query params if not already present
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'hotel_admin') {
      const selectedHotelId = localStorage.getItem('selectedHotelId');
      if (selectedHotelId && config.url) {
        // Skip adding hotel_id for these endpoints
        const skipEndpoints = ['/login', '/hotels', '/health'];
        const shouldSkip = skipEndpoints.some(endpoint => config.url?.includes(endpoint));
        
        if (!shouldSkip) {
          // Check if hotel_id is already in the URL
          const urlHasHotelId = config.url.includes('hotel_id=');
          
          // Check if hotel_id is already in params object
          const paramsHasHotelId = config.params && typeof config.params === 'object' && 'hotel_id' in config.params;
          
          if (!urlHasHotelId && !paramsHasHotelId) {
            // Prefer using params object if it exists, otherwise append to URL
            if (config.params && typeof config.params === 'object') {
              config.params = { ...config.params, hotel_id: selectedHotelId };
            } else {
              // Add hotel_id to query params in URL
              const separator = config.url.includes('?') ? '&' : '?';
              config.url = `${config.url}${separator}hotel_id=${selectedHotelId}`;
            }
          }
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedHotelId');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
