import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import config from '../config'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [likedGarages, setLikedGarages] = useState([]);

  const register = async (username, password, email, phone, firstname, lastname) => {
    try {
      const response = await fetch(`${config.server.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, phone, firstname, lastname }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        return data.message;
      } else {
        throw new Error(data.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${config.server.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      await AsyncStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const deleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Account deletion failed');
      }

      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Account deletion failed', error);
      throw error;
    }
  };

  const likeGarage = async (garageId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/auth/like/${garageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({garageId})
      });
  
      if (!response.ok) {
        const errorData = await response.json(); 
        console.error('Error data:', errorData);
        throw new Error('Failed to like garage');
      }
      const data = await response.json();
      console.log("authhh",data,garageId);
      return data;
    } catch (error) {
      console.error('Error liking garage:', error);
      throw error;
    }
  };
  
  

  const unlikeGarage = async (garageId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/auth/unlike/${garageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unlike garage');
      }

      const data = await response.json();
      setLikedGarages(data.likedGarages); 
      return data.message;
    } catch (error) {
      console.error('Error unliking garage:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser,register, login, logout, deleteAccount, unlikeGarage, likeGarage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
