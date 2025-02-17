const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth'); 
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
  

router.post('/', verifyToken, async (req, res) => {
  const { garageId, rating, comment } = req.body;

  if (!garageId || !rating) {
    return res.status(400).json({ error: 'Garage ID and rating are required' });
  }

  try {
    const existingReview = await Review.findOne({ garage: garageId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this garage.' });
    }

    const review = new Review({
      garage: garageId,
      user: req.user._id,
      rating,
      comment,
    });

    await review.save();

    const reviews = await Review.find({ garage: garageId });
    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    res.status(201).json({ review, averageRating });
  } catch (error) {
    console.error('Failed to submit review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});


router.delete('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  try {
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviews = await Review.find({ garage: deletedReview.garage });
    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.status(200).json({ message: 'Review deleted', averageRating });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
});



module.exports = router;
