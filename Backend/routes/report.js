const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.post('/', async (req, res) => {
    console.log('Incoming request:', req.body); // Καταγραφή αιτήματος
    const { garageId, reportText } = req.body;
  
    if (!garageId || !reportText) {
      console.log('Missing data:', { garageId, reportText }); // Καταγραφή αποτυχίας
      return res.status(400).json({ error: 'Garage ID and report text are required' });
    }
  
    try {
      const report = new Report({ garage: garageId, text: reportText });
      await report.save();
      console.log('Report saved successfully'); // Καταγραφή επιτυχίας
      return res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
      console.error('Error saving report:', error);
      return res.status(500).json({ error: 'Failed to submit report' });
    }
  });
  
  

module.exports = router;
