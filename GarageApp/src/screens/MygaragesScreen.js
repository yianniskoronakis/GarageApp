import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGarage } from '../context/GarageContext';
import { useNavigation } from '@react-navigation/native';
import config from '../config';

const MygaragesScreen = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { mygarages, garages,fetchMyGarages } = useGarage();
  const navigation = useNavigation();

  useEffect(() => {
    handleMyGarages();
  }, [garages]); // Call only once on initial load

  const handleMyGarages = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      await fetchMyGarages();  // Call to fetch the user's garages
    } catch (error) {
      console.error('Error fetching garages:', error);
      setError(error.message);
    } finally {
      setLoading(false); // Complete loading state
    }
  };

  const renderGarage = ({ item }) => (
    <TouchableOpacity 
      style={styles.garageItem} 
      onPress={() => navigation.navigate('GarageDetail', { garageId: item._id })}
    >
      <Text style={styles.garageName}>{item.name}</Text>
      <Text style={styles.garageAddress}>Address: {item.address}</Text>
      <View style={styles.photoContainer}>
        {item.photos && item.photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: `${config.server.baseUrl}/uploads/${photo}` }}
            style={styles.photo}
            onError={() => console.error(`Failed to load image at ${photo}`)}
          />
        ))}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading your garages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={mygarages}
          renderItem={renderGarage}
          keyExtractor={item => item._id}
          ListEmptyComponent={<Text style={styles.emptyText}>No garages found.</Text>} // Handle empty state
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4', // Light background for the container
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  garageItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff', // White background for each garage item
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  garageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  garageAddress: {
    marginTop: 4,
    color: '#555',
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd', // Border color for photos
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
    fontSize: 18,
  },
});

export default MygaragesScreen;
