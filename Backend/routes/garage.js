const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Garage = require('../models/Garage');
const User = require('../models/User');
const { verifyToken } = require('./auth');  
require('dotenv').config();
const router = express.Router();
const axios = require('axios');
const Reservation = require('../models/Reservation');


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
      console.log(`Geocoded location for address "${address}":`, location); 
      return {
          latitude: location.lat,   
          longitude: location.lng    
      }; 
  } catch (error) {
      console.error('Error in geocodeAddress:', error);
      throw error;
  }
};



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); 
  }
});

const upload = multer({ storage });


router.post('/create', verifyToken, upload.fields([{ name: 'photo_0' }, { name: 'photo_1' }, { name: 'photo_2' }, { name: 'photo_3' }, { name: 'photo_4' }]), async (req, res) => {
  console.log("Request body:", req.body); 
  console.log("Files:", req.files); 

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
    const location = await geocodeAddress(address); 
    const latitude = location.latitude;   
    const longitude = location.longitude;  
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    const newGarage = new Garage({
        price,
        address,
        squaremeter,
        garagetype,
        maxheight,
        description,
        photos,
        latitude, 
        longitude, 
        owner: req.user._id,
    });

    await newGarage.save();
    res.status(201).json(newGarage);
} catch (error) {
    console.error('Error creating garage:', error.message); 
    res.status(500).json({ message: 'Server error', error: error.message });
}

});


router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {

    const garage = await Garage.findById(req.params.id);

    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    
    if (garage.photos && garage.photos.length > 0) {
      garage.photos.forEach(photo => {
        const filePath = path.join(__dirname, '..', 'uploads', photo);
        
       
        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (!err) {
            
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


    await Garage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Garage and its photos deleted successfully' });
  } catch (error) {
    console.error('Garage deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const garages = await Garage.find(); 
    res.json(garages); 
  } catch (error) {
    console.error('Error fetching all garages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/mygarages', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id; 

    const mygarages = await Garage.find({ owner: userId });
    res.json(mygarages);
  } catch (error) {
    console.error('Error fetching user garages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const {price} = req.body; 
    
    
    let garage = await Garage.findById(req.params.id);
    
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    
    garage.price = price || garage.price;

    
    await garage.save();
    
    res.json(garage); 
  } catch (error) {
    console.error('Error updating garage:', error); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

router.get('/wishlist', verifyToken, async (req, res) => {
  try {
      const userId = req.user._id; 
      const user = await User.findById(userId).populate('likedGarages'); 
      
      if (!user) {
          console.error('User not found while fetching liked garages');
          return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user.likedGarages);
  } catch (error) {
      console.error('Error fetching liked garages:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});



router.get('/:id', verifyToken, async (req, res) => {
  try {
    const garageId = req.params.id;
    
 
    const garage = await Garage.findById(garageId);
    
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' }); 
    }
    
    res.json(garage);
  } catch (error) {
    console.error('Error fetching garage details:', error); 
    res.status(500).json({ message: 'Server error', error: error.message }); 
  }
});

router.post('/:garageId/setAvailability', async (req, res) => {
  console.log("Request received for setting availability");
  const { garageId } = req.params;
  const { availableHours } = req.body;

  try {
      const garage = await Garage.findByIdAndUpdate(garageId, { availableHours }, { new: true });
      if (!garage) {
          return res.status(404).json({ message: 'Το γκαράζ δεν βρέθηκε.' });
      }

      res.status(200).json({ message: 'Οι διαθέσιμες ώρες ενημερώθηκαν επιτυχώς.', garage });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Σφάλμα στον διακομιστή.', error: error.toString() });
  }
});

router.get('/:garageId/availableSlots', async (req, res) => {
  const { garageId } = req.params;

  try {
      const garage = await Garage.findById(garageId);
      if (!garage) {
          return res.status(404).json({ message: 'Το γκαράζ δεν βρέθηκε.' });
      }

      const availableHours = garage.availableHours || [];

      
      const reservations = await Reservation.find({
          garage: garageId,
          status: 'active',
          startHour: { $in: availableHours }, 
      });

      const reservedHours = reservations.map((reservation) => reservation.startHour);


      const freeHours = availableHours.filter(hour => !reservedHours.includes(hour));

      res.status(200).json({ availableHours: freeHours });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Σφάλμα στον διακομιστή.', error: error.toString() });
  }
});



router.get('/:garageId/reservations', verifyToken, async (req, res) => {
  const { garageId } = req.params;

  try {

    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }


    if (garage.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only the owner can view reservations.' });
    }


    const reservations = await Reservation.find({ garage: garageId })
      .populate('user', 'firstname lastname phone');

    res.status(200).json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
  }
});

module.exports = { router };