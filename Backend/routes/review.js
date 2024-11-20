const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth'); // Διόρθωσε το path αν χρειάζεται
const Review = require('../models/Review');
const Garage = require('../models/Garage');

router.get('/:garageId', async (req, res) => {
    try {
      const reviews = await Review.find({ garage: req.params.garageId }).populate('user', 'firstname lastname _id');
      console.log('Fetched Reviews:', reviews);
      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });
  

// POST: Προσθήκη νέου review
router.post('/', verifyToken, async (req, res) => {
    const { garageId, rating, comment } = req.body;
  
    if (!garageId || !rating) {
      return res.status(400).json({ error: 'Garage ID and rating are required' });
    }
  
    try {
      // Βεβαιώσου ότι ο `req.user` έχει το `_id`
      if (!req.user || !req.user._id) {
        console.error('User information is missing:', req.user);
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const review = new Review({
        garage: garageId,
        user: req.user._id, // Βεβαιώσου ότι υπάρχει
        rating,
        comment,
      });
  
      await review.save();
  
      const reviews = await Review.find({ garage: garageId });
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
      res.status(201).json({ review, averageRating });
    } catch (error) {
      console.error('Failed to submit review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });
  
  
// DELETE: Διαγραφή ενός review
router.delete('/:reviewId', verifyToken, async (req, res) => {
    try {
      const review = await Review.findById(req.params.reviewId);
  
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
  
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You are not authorized to delete this review' });
      }
  
      await Review.findByIdAndDelete(req.params.reviewId);
  
      const reviews = await Review.find({ garage: review.garage });
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length || 1);
  
      res.status(200).json({ message: 'Review deleted', averageRating });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  });
  

module.exports = router;
