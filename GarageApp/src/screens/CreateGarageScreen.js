import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  Switch, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useGarage } from '../context/GarageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Error from '../components/Error'; 
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const CreateGarageScreen = () => {
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [squaremeter, setsquaremeter] = useState('');
  const [garagetype, setgaragetype] = useState(false);
  const [maxheight, setmaxheight] = useState('');
  const [description, setdescription] = useState('');
  const [photos, setPhotos] = useState([]); 
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false); 

  const { createGarage } = useGarage();

  const handleCreateGarage = async () => {
    if (!address || !price || !squaremeter ||photos.length === 0) {
      setError('Please fill in all fields and select photos');
      return;
    }

    setLoading(true); 
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('address', address);
      formData.append('price', price);
      formData.append('squaremeter', squaremeter);
      formData.append('garagetype', garagetype);
      formData.append('maxheight', maxheight);
      formData.append('description', description);

      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName,
        });
      });
      console.log('FormData before sending:', formData);
      await createGarage(formData, token);


      setPrice('');
      setAddress('');
      setsquaremeter('');
      setgaragetype(false);
      setmaxheight('');
      setdescription('');
      setPhotos([]);
      setError('');
      navigation.navigate('Map');
    } catch (error) {
      console.error('Error creating garage:', error.message);
      setError('Failed to create garage: ' + error.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleSelectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else {
          const selectedPhotos = response.assets || [];
          setPhotos([...photos, ...selectedPhotos]); 
        }
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Garage</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Address" 
        value={address} 
        onChangeText={setAddress} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Price" 
        value={price} 
        keyboardType="numeric" 
        onChangeText={setPrice} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Squaremeter" 
        value={squaremeter} 
        keyboardType="numeric" 
        onChangeText={setsquaremeter} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Description" 
        value={description} 
        keyboardType="String" 
        onChangeText={setdescription} 
      />
      <Text style={styles.label}>Garage Type</Text>
      <Text style={styles.label}>Close</Text>
      <Switch   
        value={garagetype}  
        onValueChange={setgaragetype} 
      />
      <Text style={styles.label}>Open</Text>

      {!garagetype && ( 
        <TextInput 
        style={styles.input} 
        placeholder="Maxheight" 
        value={maxheight} 
        keyboardType="default" 
        onChangeText={setmaxheight} 
        />
      )}
      
      <TouchableOpacity onPress={handleSelectPhoto} style={styles.photoButton}>
        <Text style={styles.photoButtonText}>Select Photos</Text>
      </TouchableOpacity>

      <View style={styles.photoContainer}>
        {photos.map((photo, index) => (
          <Image 
            key={index} 
            source={{ uri: photo.uri }} 
            style={styles.photo} 
          />
        ))}
      </View>

      {error ? <Error message={error} /> : null}

      <TouchableOpacity 
        style={styles.createButton} 
        onPress={handleCreateGarage} 
        disabled={loading} 
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.createButtonText}>Create Garage</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f9fc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333', 
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#007BFF',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff', 
  },
  photoButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%', 
  },
  photoButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center', 
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginHorizontal: 10, 
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2, 
  },
  createButton: {
    backgroundColor: '#28a745', 
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%', 
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default CreateGarageScreen;