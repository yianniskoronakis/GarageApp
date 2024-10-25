import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Error from '../components/Error';

const ProfileScreen = () => {
  const { logout, deleteAccount, user } = useAuth();
  const { mygarages, fetchMyGarages, deleteGarage } = useGarage();
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await fetchMyGarages();
              const token = await AsyncStorage.getItem('token');

              if (mygarages.length > 0) {
                for (const garage of mygarages) {
                  await deleteGarage(garage._id, token);
                }
              }

              await deleteAccount();
              navigation.navigate('Login');
            } catch (error) {
              setError(error.message || 'Account deletion failed');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.username}>{user.username}</Text>
        {error ? <Error message={error} /> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f9fc', // Light background for better contrast
  },
  card: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333', // Dark color for title
    textAlign: 'center', // Center align title
  },
  username: {
    fontSize: 22,
    color: '#555', // Dark grey for username
    marginBottom: 20,
    textAlign: 'center', // Center align username
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
