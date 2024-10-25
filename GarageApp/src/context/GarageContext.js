import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const GarageContext = createContext();

export const GarageProvider = ({ children }) => {
  const [garages, setGarages] = useState([]);
  const [mygarages, setMyGarages] = useState([]);
  const [garageLocations, setGarageLocations] = useState([]);
  const [likedGarages, setLikedGarages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch garages');
      }

      const data = await response.json();
      console.log('Fetched garages:', data);

      // Check and set valid coordinates for each garage
      const validGarages = data.filter(garage => {
        return !isNaN(Number(garage.latitude)) && !isNaN(Number(garage.longitude));
      });

      setGarages(validGarages);
    } catch (error) {
      console.error('Error fetching garages:', error);
      setError('Error fetching garages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGarages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages/mygarages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my garages');
      }

      const data = await response.json();
      setMyGarages(data);
    } catch (error) {
      console.error('Error fetching my garages:', error);
      setError('Error fetching my garages');
    }
  };

  const fetchCoordinates = async () => {
    try {
      if (garages.length === 0) {
        console.log("No garages to fetch coordinates for.");
        setGarageLocations([]); 
        return; 
      }

      const locations = garages.map(garage => ({
        id: garage._id,
        latitude: Number(garage.latitude),  
        longitude: Number(garage.longitude),
        title: garage.name,
        price: garage.price,
      }));

      console.log('Garage locations:', locations);
      setGarageLocations(locations); 
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      setError('Failed to fetch coordinates');
    }
  };

  // Inside your GarageContext
const fetchLikedGarages = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${config.server.baseUrl}/api/garages/wishlist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to fetch liked garages');
    }

    const data = await response.json();
    setLikedGarages(data); // Make sure to update the liked garages state
  } catch (error) {
    console.error('Error fetching liked garages:', error);
  }
};

  const getGarageById = async (garageId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages/${garageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error fetching garage details:', errorResponse);
        throw new Error('Failed to fetch garage details');
      }

      const garageData = await response.json();
      return garageData;
    } catch (error) {
      console.error('Error fetching garage details:', error);
      throw error;
    }
  };

  const createGarage = async (formData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      // Έλεγχος αν η response είναι ορισμένη
      if (!response) {
        throw new Error('No response from server');
      }
  
      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.message || 'Failed to create garage');
        throw new Error(errorResponse.message || 'Failed to create garage');
      }
  
      const newGarage = await response.json();
      setGarages(prevGarages => [...prevGarages, newGarage]);  // Προσθήκη του νέου γκαράζ στην κατάσταση
    } catch (error) {
      console.error('Error creating garage:', error);
      setError('Failed to create garage');
      throw error;
    }
  };
  

  // Delete a garage
  const deleteGarage = async (garageId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages/delete/${garageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete garage');
      }

      // Remove the deleted garage from state
      setGarages(prevGarages => prevGarages.filter(garage => garage._id !== garageId));
    } catch (error) {
      console.error('Error deleting garage:', error);
      setError('Failed to delete garage');
      throw error;
    }
  };

  const updateGarage = async (garageId, updatedData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/garages/update/${garageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Failed to update garage');
      }
  
      // Update το garage στο state με τα νέα δεδομένα
      const updatedGarage = await response.json(); // Προσθήκη αυτής της γραμμής
      setGarages(prevGarages =>
        prevGarages.map(garage => (garage._id === garageId ? updatedGarage : garage))
      );
    } catch (error) {
      console.error('Error updating garage:', error);
      setError('Failed to update garage');
      throw error;
    }
  };
  

useEffect(() => {
  fetchGarages();
  fetchMyGarages();
  fetchCoordinates();
  fetchLikedGarages();
}, []);
  

  return (
    <GarageContext.Provider value={{
      garages,
      mygarages,
      garageLocations,
      likedGarages,
      fetchGarages,
      fetchMyGarages,
      fetchCoordinates,
      fetchLikedGarages,
      getGarageById,
      deleteGarage,
      updateGarage,
      createGarage,
      loading,
      error
    }}>
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => useContext(GarageContext);