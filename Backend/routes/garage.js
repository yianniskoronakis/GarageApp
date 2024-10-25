const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Garage = require('../models/Garage');
const User = require('../models/User');
const { verifyToken } = require('./auth');  // Χρήση του verifyToken από το auth
require('dotenv').config();
const router = express.Router();
const axios = require('axios');

const geocodeAddress = async (address) => {
  console.log("μπηκε στο geocode ", address);
  try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
              address: address,
              key: 'AIzaSyCjxeXCnDQqB71af5dtPb3mtRQbjHOcGVQ',
          },
      });

      if (response.data.results.length === 0) {
          throw new Error('No results found for the given address');
      }

      const location = response.data.results[0].geometry.location;
      console.log(`Geocoded location for address "${address}":`, location); // Log the geocoded location
      return {
          latitude: location.lat,   // Επιστρέφει τη γεωγραφική θέση
          longitude: location.lng    // Επιστρέφει τη γεωγραφική θέση
      }; 
  } catch (error) {
      console.error('Error in geocodeAddress:', error);
      throw error;
  }
};


// Ρυθμίσεις του multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Φάκελος όπου θα αποθηκεύονται οι εικόνες
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Όνομα αρχείου
  }
});

const upload = multer({ storage });

// Δημιουργία νέου γκαράζ
router.post('/create', verifyToken, upload.fields([{ name: 'photo_0' }, { name: 'photo_1' }, { name: 'photo_2' }, { name: 'photo_3' }, { name: 'photo_4' }]), async (req, res) => {
  console.log("Request body:", req.body); // Log the incoming request body
  console.log("Files:", req.files); // Log the files received

  const address = req.body.address ? req.body.address.trim() : undefined;
  const price = req.body.price !== undefined ? Number(req.body.price) : undefined;
  const squaremeter = req.body.squaremeter !== undefined ? Number(req.body.squaremeter) : undefined;
  const garagetype = req.body.garagetype ? req.body.garagetype.trim() : undefined;
  const maxheight = req.body.maxheight !== undefined ? Number(req.body.maxheight) : undefined;
  const description = req.body.description ? req.body.description.trim() : undefined;
  
  const photos = req.files ? Object.values(req.files).flat().map(file => file.filename) : [];

  if (!price || !address || !squaremeter || !garagetype || !description || photos.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const location = await geocodeAddress(address); // Καλείς τη γεωκωδικοποίηση
    const latitude = location.latitude;   // Εξαγωγή της γεωγραφικής θέσης
    const longitude = location.longitude;  // Εξαγωγή της γεωγραφικής θέσης
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`); // Log the coordinates

    const newGarage = new Garage({
        price,
        address,
        squaremeter,
        garagetype,
        maxheight,
        description,
        photos,
        latitude, // Χρησιμοποιείς τις σωστές τιμές
        longitude, // Χρησιμοποιείς τις σωστές τιμές
        owner: req.user._id,
    });

    await newGarage.save();
    res.status(201).json(newGarage);
} catch (error) {
    console.error('Error creating garage:', error.message); // Log specific error message
    res.status(500).json({ message: 'Server error', error: error.message });
}

});

// Διαγραφή γκαράζ
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    // Βρίσκεις το γκαράζ με βάση το ID
    const garage = await Garage.findById(req.params.id);

    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    // Διαγραφή των φωτογραφιών που ανήκουν στο γκαράζ
    if (garage.photos && garage.photos.length > 0) {
      garage.photos.forEach(photo => {
        const filePath = path.join(__dirname, '..', 'uploads', photo);
        
        // Έλεγχος αν το αρχείο υπάρχει πριν το διαγράψεις
        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (!err) {
            // Διαγραφή του αρχείου
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
              } else {
                console.log(`Successfully deleted file: ${filePath}`);
              }
            });
          } else {
            console.error(`File ${filePath} not found, could not delete`);
          }
        });
      });
    }

    // Διαγραφή του γκαράζ από τη βάση δεδομένων
    await Garage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Garage and its photos deleted successfully' });
  } catch (error) {
    console.error('Garage deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ανάκτηση όλων των γκαράζ
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const garages = await Garage.find(); // Εύρεση όλων των γκαράζ
    res.json(garages); // Επιστροφή των δεδομένων γκαράζ ως JSON
  } catch (error) {
    console.error('Error fetching all garages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ανάκτηση των γκαράζ του συνδεδεμένου χρήστη
router.get('/mygarages', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;  // req.user._id από το token

    // Εύρεση των γκαράζ που ανήκουν στον συνδεδεμένο χρήστη
    const mygarages = await Garage.find({ owner: userId });
    res.json(mygarages);
  } catch (error) {
    console.error('Error fetching user garages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ενημέρωση γκαράζ
router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const {price} = req.body; // Destructure properties from the request body
    
    // Εύρεση του γκαράζ με βάση το ID
    let garage = await Garage.findById(req.params.id);
    
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    // Ενημέρωση μόνο των πεδίων που έχουν σταλεί στο request
    garage.price = price || garage.price;

    // Αποθήκευση του ενημερωμένου γκαράζ
    await garage.save();
    
    res.json(garage); // Επιστροφή του ενημερωμένου γκαράζ
  } catch (error) {
    console.error('Error updating garage:', error); // Καταγραφή σφαλμάτων
    res.status(500).json({ message: 'Server error' }); // Επιστροφή σφάλματος σε περίπτωση αποτυχίας
  }
});

router.get('/wishlist', verifyToken, async (req, res) => {
  try {
      const userId = req.user._id; // Get the user ID from the request
      const user = await User.findById(userId).populate('likedGarages'); // Fetch user and populate liked garages
      
      if (!user) {
          console.error('User not found while fetching liked garages');
          return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user.likedGarages); // Return liked garages
  } catch (error) {
      console.error('Error fetching liked garages:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Ανάκτηση ενός γκαράζ με βάση το ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const garageId = req.params.id;
    
    // Εύρεση του γκαράζ με βάση το ID
    const garage = await Garage.findById(garageId);
    
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' }); // Επιστροφή μηνύματος αν δεν βρεθεί το γκαράζ
    }
    
    res.json(garage); // Επιστροφή των δεδομένων του γκαράζ
  } catch (error) {
    console.error('Error fetching garage details:', error); // Καταγραφή των σφαλμάτων
    res.status(500).json({ message: 'Server error', error: error.message }); // Επιστροφή μηνύματος σφάλματος
  }
});



module.exports = { router };