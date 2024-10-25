import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity,Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useGarage } from '../context/GarageContext';

const { width, height } = Dimensions.get('window');

// Custom Marker Component
const CustomMarker = ({ price, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.markerContainer}>
      <View style={styles.marker}>
        <Text style={styles.markerPrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MapScreen = () => {
  const { garages, loading, error } = useGarage(); // Get garages from context
  const navigation = useNavigation();
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.9838, // Default latitude for Athens
    longitude: 23.7275,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Recalculate map region to fit all markers
    if (garages.length > 0) {
      const latitudes = garages.map(garage => Number(garage.latitude));
      const longitudes = garages.map(garage => Number(garage.longitude));

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLong = Math.min(...longitudes);
      const maxLong = Math.max(...longitudes);

      const centerLatitude = (minLat + maxLat) / 2;
      const centerLongitude = (minLong + maxLong) / 2;

      setMapRegion({
        latitude: centerLatitude,
        longitude: centerLongitude,
        latitudeDelta: Math.abs(maxLat - minLat) + 0.01,
        longitudeDelta: Math.abs(maxLong - minLong) + 0.01,
      });
    }
  }, [garages]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading garages...</Text>
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
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={region => setMapRegion(region)}
      >
        {garages.map(garage => (
          <Marker
            key={garage._id}
            coordinate={{ latitude: Number(garage.latitude), longitude: Number(garage.longitude) }}
            onPress={() => {
              console.log('Navigating to GarageDetailScreen with ID:', garage._id);
              navigation.navigate('MyGarages', { screen: 'GarageDetail', params: { garageId: garage._id } });
            }}
          >
            <CustomMarker price={`€${garage.price}`} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40, // Increased width for better price visibility
    height: 40, // Increased height for better price visibility
    backgroundColor: '#007BFF', // Marker color
    borderRadius: 20, // Make it circular
    justifyContent: 'center', // Center content
    alignItems: 'center', // Center content
    borderWidth: 2, // Border for better visibility
    borderColor: 'white', // White border
  },
  markerPrice: {
    color: 'white', // Price text color
    fontWeight: 'bold', // Bold text
    textAlign: 'center', // Center text
    fontSize: 12, // Font size
  },
});

export default MapScreen;
