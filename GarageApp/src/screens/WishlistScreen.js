import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGarage } from '../context/GarageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistScreen = ({ navigation }) => {
  const { fetchLikedGarages, likedGarages } = useGarage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 

  useEffect(() => {
    const loadLikedGarages = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        await fetchLikedGarages(token); 
      } catch (error) {
        console.error('Error fetching liked garages:', error);
        setError('Failed to load liked garages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLikedGarages();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    ); 
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ); 
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wishlist</Text>
      <FlatList
        data={likedGarages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.garageItem}
            onPress={() => navigation.navigate('GarageDetail', { garageId: item._id })} 
          >
            <Text style={styles.garageName}>{item.name}</Text>
            <Text style={styles.garageAddress}>{item.address}</Text>
            <Text style={styles.garagePrice}>{item.price}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyMessage}>No liked garages found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f9fc', 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333', 
  },
  garageItem: {
    padding: 15,
    marginVertical: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#ffffff', 
    elevation: 2, 
  },
  garageName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  garageAddress: {
    fontSize: 16,
    color: '#555', 
  },
  garagePrice: {
    fontSize: 16,
    color: '#007BFF', 
    fontWeight: '600', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#007BFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888', 
  },
});

export default WishlistScreen;
