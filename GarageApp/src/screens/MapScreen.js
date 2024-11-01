import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, ActivityIndicator, TextInput, Switch } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useGarage } from '../context/GarageContext';

const { width, height } = Dimensions.get('window');

// Custom Marker Component with color prop and improved styling
const CustomMarker = ({ price, onPress, color }) => (
  <TouchableOpacity onPress={onPress} style={[styles.markerContainer]}>
    <View style={[styles.marker, { backgroundColor: color, shadowColor: color }]}>
      <Text style={styles.markerPrice}>{price}</Text>
    </View>
  </TouchableOpacity>
);

const MapScreen = () => {
  const { garages, mygarages, loading, error, fetchMyGarages } = useGarage();
  const navigation = useNavigation();
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.9838,
    longitude: 23.7275,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [isClosedGarage, setIsClosedGarage] = useState(null);
  const [minHeight, setMinHeight] = useState('');
  const [minSquareMeters, setMinSquareMeters] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMyGarages();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (garages.length > 0) {
      const latitudes = garages.map(garage => Number(garage.latitude));
      const longitudes = garages.map(garage => Number(garage.longitude));
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLong = Math.min(...longitudes);
      const maxLong = Math.max(...longitudes);

      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLong + maxLong) / 2,
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

  const filteredGarages = garages.filter(garage => {
    const meetsPriceCondition = !maxPrice || garage.price <= maxPrice;
    const meetsTypeCondition = isClosedGarage === null || garage.garagetype === isClosedGarage;
    const meetsHeightCondition = isClosedGarage !== true || !minHeight || garage.maxheight >= minHeight;
    const meetsSquareMetersCondition = !minSquareMeters || garage.squaremeter >= minSquareMeters;
    const hasAvailableHours = Array.isArray(garage.availableHours) && garage.availableHours.length > 0;
    const isNotUserGarage = !mygarages.some(myGarage => myGarage._id === garage._id);

    return (
      meetsPriceCondition &&
      meetsTypeCondition &&
      meetsHeightCondition &&
      meetsSquareMetersCondition &&
      hasAvailableHours &&
      isNotUserGarage
    );
  });

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={region => setMapRegion(region)}
      >
        {filteredGarages.map((garage, index) => (
          <Marker
            key={garage._id || index}
            coordinate={{ latitude: Number(garage.latitude), longitude: Number(garage.longitude) }}
            onPress={() => navigation.navigate('MyGarages', { screen: 'GarageDetail', params: { garageId: garage._id } })}
          >
            <View style={[styles.marker, { backgroundColor: '#007BFF', shadowColor: '#007BFF' }]}>
              <Text style={styles.markerPrice}>{`€${garage.price}`}</Text>
            </View>
          </Marker>
        ))}
        {mygarages.map(garage => (
          <Marker
            key={garage._id}
            coordinate={{ latitude: Number(garage.latitude), longitude: Number(garage.longitude) }}
            onPress={() => navigation.navigate('MyGarages', { screen: 'GarageDetail', params: { garageId: garage._id } })}
          >
            <View style={[styles.marker, { backgroundColor: 'green', shadowColor: 'green' }]}>
              <Text style={styles.markerPrice}>{`€${garage.price}`}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(!filterVisible)}>
        <Text style={styles.filterButtonText}>Filters</Text>
      </TouchableOpacity>
      {filterVisible && (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Max Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter max price"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={text => setMaxPrice(Number(text))}
          />
          <Text style={styles.sidebarTitle}>Garage Type</Text>
          <View style={styles.switchContainer}>
            <Text>Closed</Text>
            <Switch
              value={isClosedGarage === true}
              onValueChange={value => {
                setIsClosedGarage(value ? true : null);
                if (!value) setMinHeight('');
              }}
            />
            <Text>Open</Text>
            <Switch
              value={isClosedGarage === false}
              onValueChange={value => setIsClosedGarage(value ? false : null)}
            />
          </View>
          {isClosedGarage === true && (
            <>
              <Text style={styles.sidebarTitle}>Min Height</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter min height"
                keyboardType="numeric"
                value={minHeight}
                onChangeText={text => setMinHeight(Number(text))}
              />
            </>
          )}
          <Text style={styles.sidebarTitle}>Min Square Meters</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter min square meters"
            keyboardType="numeric"
            value={minSquareMeters}
            onChangeText={text => setMinSquareMeters(Number(text))}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerPrice: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  filterButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 20,
  },
  filterButtonText: { color: 'white', fontWeight: 'bold' },
  sidebar: {
    position: 'absolute',
    top: 50,
    left: 10,
    width: 200,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  sidebarTitle: { fontWeight: 'bold', marginBottom: 10 },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
});

export default MapScreen;
