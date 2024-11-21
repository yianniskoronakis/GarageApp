import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  BackHandler, 
  ActivityIndicator,
  ScrollView, 
  Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useGarage } from '../context/GarageContext';
import { useAuth } from '../context/AuthContext'; 
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const GarageDetailScreen = () => {
  const route = useRoute();
  const { garageId } = route.params;
  const { updateGarage, deleteGarage, getGarageById, fetchReservations, fetchLikedGarages } = useGarage();
  const { likeGarage, unlikeGarage, user } = useAuth();
  const navigation = useNavigation();

  const [garage, setGarage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [squaremeter, setSquaremeter] = useState('');
  const [garagetype, setGaragetype] = useState(false);
  const [maxheight, setMaxheight] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [reservations, setReservations] = useState([]); // State for reservations
  const [currentIndex, setCurrentIndex] = useState(0);

  // Review-related states
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newRating, setNewRating] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchGarageDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const fetchedGarage = await getGarageById(garageId, token);
        setGarage(fetchedGarage);
    
        const response = await fetch(`${config.server.baseUrl}/api/review/${garageId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
    
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
    
        // Έλεγχος αν ο χρήστης έχει ήδη κάνει review
        const userReview = data.reviews.find((review) => review.user._id === user.id);
        if (userReview) {
          setNewRating(userReview.rating);
          setNewComment(userReview.comment);
        }
      } catch (error) {
        console.error('Error fetching garage:', error);
        alert(`Error fetching garage: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    
    fetchGarageDetails();
  }, [garageId, user.id]);

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteGarage(garageId, token);
      navigation.navigate('Mygarages');
    } catch (error) {
      console.error('Error deleting garage:', error);
    }
  };

  const handleUpdate = async () => {
    if (!address || !price || !squaremeter) {
      console.error('All fields must be filled out');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const updatedData = { address, price, squaremeter, garagetype, maxheight, description };

      await updateGarage(garageId, updatedData, token);
      const fetchedGarage = await getGarageById(garageId, token);
      setGarage(fetchedGarage);
      setAddress(fetchedGarage?.address || '');
      setPrice(fetchedGarage?.price || '');
      setSquaremeter(fetchedGarage?.squaremeter || '');
      setGaragetype(fetchedGarage?.garagetype || false);
      setMaxheight(fetchedGarage?.maxheight || '');
      setDescription(fetchedGarage?.description || '');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating garage:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikeGarage(garageId);
        setIsLiked(false);
      } else {
        await likeGarage(garageId);
        setIsLiked(true);
      }
      await fetchLikedGarages();
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('An error occurred while liking the garage. Please try again later.');
    }
  };

  const handleSubmitReview = async () => {
    if (!newRating || newRating < 1 || newRating > 5) {
      alert('Please provide a rating between 1 and 5.');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          garageId,
          rating: newRating,
          comment: newComment,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        // Ενημέρωση του state με το νέο review
        setReviews((prev) => [...prev, { ...result.review, user: { _id: user.id, firstname: user.firstname, lastname: user.lastname } }]);
        setAverageRating(result.averageRating);
  
        // Καθαρισμός των πεδίων
        setNewRating('');
        setNewComment('');
      } else {
        console.error('Failed to submit review:', result.error);
        alert(result.error || 'Failed to submit review.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    }
  };
  

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.server.baseUrl}/api/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        const updatedReviews = reviews.filter((review) => review._id !== reviewId);
        setReviews(updatedReviews);
  
        // Υπολογισμός νέου μέσου όρου
        const newAverage = updatedReviews.length
          ? updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length
          : 0;
  
        setAverageRating(newAverage);
      } else {
        alert('Failed to delete review.');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review.');
    }
  };
  



const renderStars = (rating, editable = false) => {
  const filledStar = require('../assets/icons/filled_star.png');
  const emptyStar = require('../assets/icons/empty_star.png');

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => editable && setNewRating(i)}
        disabled={!editable}
      >
        <Image
          source={i <= rating ? filledStar : emptyStar}
          style={{
            width: 24,
            height: 24,
            marginHorizontal: 2,
          }}
        />
      </TouchableOpacity>
    );
  }

  return <View style={styles.starContainer}>{stars}</View>;
};





  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Mygarages');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading garage details...</Text>
      </View>
    );
  }

  if (!garage) {
    return <Text style={styles.errorText}>No garage found.</Text>;
  }

  const isOwner = garage.owner === user.id;
  
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.infoText}>Garage ID: {garageId}</Text>
        <Text style={styles.infoText}>Owner: {user.firstname} {user.lastname}</Text>
        <Text style={styles.infoText}>Phone: {user.phone}</Text>
        <Text style={styles.label}>Address: {garage.address}</Text>
        <Text style={styles.label}>Squaremeter: {garage.squaremeter}</Text>
        <Text style={styles.label}>Garage Type: {garage.garagetype ? 'Open' : 'Close'}</Text>
        {!garage.garagetype && (
          <Text style={styles.label}>Maxheight: {garage.maxheight || 'N/A'}</Text>
        )}

        <Text style={styles.label}>Photos:</Text>
        {garage.photos && garage.photos.length > 0 ? (
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))} style={styles.arrowButton}>
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: `${config.server.baseUrl}/uploads/${garage.photos[currentIndex]}` }}
              style={styles.photo}
            />
            <TouchableOpacity onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, garage.photos.length - 1))} style={styles.arrowButton}>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
            <Text style={styles.imageIndexText}>{`${currentIndex + 1} of ${garage.photos.length}`}</Text>
          </View>
        ) : (
          <Text style={styles.noPhotosText}>No photos available.</Text>
        )}

        <Text style={styles.label}>Price:</Text>
        {isEditing ? (
          <TextInput value={price} onChangeText={setPrice} placeholder="Price" keyboardType="numeric" style={styles.input} />
        ) : (
          <Text style={styles.value}>{garage.price || 'N/A'}</Text>
        )}

        <Text style={styles.label}>Description:</Text>
        {isEditing ? (
          <TextInput value={description} onChangeText={setDescription} placeholder="Description" style={styles.input} />
        ) : (
          <Text style={styles.value}>{garage.description || 'N/A'}</Text>
        )}
        {reservations.map((reservation) => (
          <View key={reservation._id} style={styles.reservationItem}>
            <Text style={styles.infoText}>
              User: {reservation.user.firstname} {reservation.user.lastname}
            </Text>
            <Text style={styles.infoText}>Phone: {reservation.user.phone}</Text>
            <Text style={styles.infoText}>Start Hour: {reservation.startHour}</Text>
            <Text style={styles.infoText}>End Hour: {reservation.endHour}</Text>
          </View>
        ))}
      </View>

      {isOwner ? (
        <>
          {isEditing ? (
            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Apply Changes</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SetAvailability', { garageId })}>
                <Text style={styles.buttonText}>Availability</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleLike}>
            <Text style={styles.buttonText}>{isLiked ? 'Unlike' : 'Like'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Reservation', { garageId })}>
            <Text style={styles.buttonText}>Book</Text>
          </TouchableOpacity>
        </>
      )}
      <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.averageRatingContainer}>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.averageRatingText}>{reviews.length} reviews</Text>
        </View>

        {reviews.map((review) => (
  <View key={review._id} style={styles.reviewItem}>
    <Text style={styles.reviewText}>
      {(review.user?.firstname || 'Unknown')} {(review.user?.lastname || 'User')} - {review.rating}/5
    </Text>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    {review.user?._id === user.id && (
      <TouchableOpacity onPress={() => handleDeleteReview(review._id)}>
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    )}
  </View>
))}

{!isOwner ? (
  !reviews.some((review) => review.user?._id === user.id) ? (
    <View style={styles.addReviewContainer}>
      <Text style={styles.sectionTitle}>Add Your Review</Text>
      {renderStars(newRating, true)}
      <TextInput
        style={styles.input}
        placeholder="Leave a comment"
        value={newComment}
        onChangeText={(value) => setNewComment(value)}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmitReview}>
        <Text style={styles.buttonText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={styles.infoText}>You have already submitted a review for this garage.</Text>
  )
) : (
  <Text style={styles.infoText}>You cannot review your own garage.</Text>
)}

{!isOwner && (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: '#FF5733' }]}
    onPress={() => navigation.navigate('Report', { garageId })}
  >
    <Text style={styles.buttonText}>Report Garage</Text>
  </TouchableOpacity>
)}




    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  innerContainer: {
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  arrowButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  arrowText: {
    color: 'white',
    fontSize: 18,
  },
  imageIndexText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
  },
  noPhotosText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  reservationsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e8f4fa',
    borderRadius: 8,
  },
  reservationItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    marginHorizontal: 16, // Add horizontal margin to prevent touching the edges
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  averageRating: {
    fontSize: 16,
    marginBottom: 10,
  },
  reviewItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewComment: {
    fontSize: 14,
    marginTop: 5,
  },
  deleteButton: {
    color: 'red',
    marginTop: 10,
    textAlign: 'right',
  },
  addReviewContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  starContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
  infoContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff8dc',
    borderRadius: 5,
    borderColor: '#ffd700',
    borderWidth: 1,
  },
  infoText: {
    color: '#555',
    textAlign: 'center',
    fontSize: 14,
  },
  
});

export default GarageDetailScreen;
