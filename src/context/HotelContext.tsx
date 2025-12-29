import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

interface Hotel {
  ID: number;
  name: string;
}

interface HotelContextType {
  selectedHotel: Hotel | null;
  hotels: Hotel[];
  setSelectedHotel: (hotel: Hotel) => void;
  clearSelectedHotel: () => void;
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

  const clearSelectedHotel = () => {
    setSelectedHotelState(null);
    localStorage.removeItem('selectedHotelId');
  };

  const fetchHotels = async () => {
    try {
      const response = await api.get('/hotels');
      setHotels(response.data);
      
      const userRole = localStorage.getItem('userRole');
      const savedId = localStorage.getItem('selectedHotelId');
      
      // For hotel_admin, always try to set the hotel from savedId
      if (userRole === 'hotel_admin' && savedId) {
        const hotelId = Number(savedId);
        const found = response.data.find((h: Hotel) => h.ID === hotelId);
        if (found) {
          setSelectedHotelState(found);
          return; // Don't proceed with default selection
        } else {
          // If hotel not found in list but we have a savedId, try to fetch it directly
          // This handles the case where hotels list might be filtered or incomplete
          console.warn(`Hotel ${hotelId} not found in hotels list for hotel_admin`);
        }
      }
      
      // Restore selection for other roles or if hotel_admin hotel wasn't found
      if (savedId) {
        const hotelId = Number(savedId);
        const found = response.data.find((h: Hotel) => h.ID === hotelId);
        if (found) {
          setSelectedHotelState(found);
        }
        // If saved hotel not found, keep selectedHotel as null
      }
      // If no savedId, keep selectedHotel as null (all hotels)
    } catch (error) {
      console.error('Failed to fetch hotels', error);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return (
    <HotelContext.Provider value={{ selectedHotel, hotels, setSelectedHotel, clearSelectedHotel, fetchHotels }}>
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

