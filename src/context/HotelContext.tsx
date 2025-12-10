import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface Hotel {
  ID: number;
  name: string;
}

interface HotelContextType {
  selectedHotel: Hotel | null;
  hotels: Hotel[];
  setSelectedHotel: (hotel: Hotel) => void;
  fetchHotels: () => Promise<void>;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotelState] = useState<Hotel | null>(null);

  const setSelectedHotel = (hotel: Hotel) => {
    setSelectedHotelState(hotel);
    localStorage.setItem('selectedHotelId', hotel.ID.toString());
  };

  const fetchHotels = async () => {
    try {
      const response = await axios.get(`${API_URL}/hotels`);
      setHotels(response.data);
      
      const userRole = localStorage.getItem('userRole');
      const savedId = localStorage.getItem('selectedHotelId');
      
      // For hotel_admin, use the hotel_id from login response
      if (userRole === 'hotel_admin' && savedId) {
        const found = response.data.find((h: Hotel) => h.ID === Number(savedId));
        if (found) {
          setSelectedHotelState(found);
          return; // Don't proceed with default selection
        }
      }
      
      // Restore selection or default to first
      if (savedId) {
        const found = response.data.find((h: Hotel) => h.ID === Number(savedId));
        if (found) setSelectedHotelState(found);
        else if (response.data.length > 0) setSelectedHotelState(response.data[0]);
      } else if (response.data.length > 0) {
        setSelectedHotelState(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch hotels', error);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return (
    <HotelContext.Provider value={{ selectedHotel, hotels, setSelectedHotel, fetchHotels }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};

