const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log("Token received in backend:", token);
 
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Invalid Token:", err);
    res.status(400).json({ message: 'Invalid Token' });
  }
};


router.post('/register', async (req, res) => {
  const { username, password, email, phone, firstname, lastname } = req.body;

  if (!username || !password || !email || !phone || !firstname || !lastname) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      phone,
      firstname,
      lastname,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }


    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

    console.log("Generated token: ", token);

    res.header('auth-token', token).json({
      message: 'Logged in successfully',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});


router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/test-token', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});


router.post('/like/:garageId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.likedGarages.includes(req.params.garageId)) {
      user.likedGarages.push(req.params.garageId);
      await user.save();
    }

    res.json({ message: 'Garage liked', likedGarages: user.likedGarages });
  } catch (error) {
    console.error('Error liking garage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/unlike/:garageId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.likedGarages = user.likedGarages.filter(
      (garageId) => garageId.toString() !== req.params.garageId
    );
    await user.save();

    res.json({ message: 'Garage unliked', likedGarages: user.likedGarages });
  } catch (error) {
    console.error('Error unliking garage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = { router, verifyToken };
