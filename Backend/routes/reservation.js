const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Garage = require('../models/Garage');

router.post('/create', async (req, res) => {
    const { garageId, userId, startHours, status } = req.body;

    try {
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return res.status(404).json({ message: 'Garage not found.' });
        }

        if (!garage.reservations) {
            garage.reservations = [];
        }

    
        for (const startHour of startHours) {
            const start = parseInt(startHour.split(':')[0], 10);
            const end = (start + 1) % 24;
            const endHour = `${end.toString().padStart(2, '0')}:00`;

            const overlappingReservations = await Reservation.find({
                garage: garageId,
                startHour: { $lt: endHour },
                endHour: { $gt: startHour },
                status: 'active'
            });

            if (overlappingReservations.length > 0) {
                return res.status(400).json({ message: `Garage isn't available ${startHour}.` });
            }
        }

      
        const reservationIds = [];
        for (const startHour of startHours) {
            const start = parseInt(startHour.split(':')[0], 10);
            const end = (start + 1) % 24;
            const endHour = `${end.toString().padStart(2, '0')}:00`;

            const reservation = new Reservation({
                garage: garageId,
                user: userId,
                startHour,
                endHour,
                status,
            });

            await reservation.save();
            reservationIds.push(reservation._id);
            garage.reservations.push(reservation._id);
        }

        await garage.save();

        res.status(201).json({ message: 'Reservation completed.', reservations: reservationIds });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.', error: error.toString() });
    }
});

router.get('/availableSlots/:garageId', async (req, res) => {
    const { garageId } = req.params;

    try {
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return res.status(404).json({ message: 'Garage not found.' });
        }

        const allSlots = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

        const reservations = await Reservation.find({ garage: garageId, status: 'active' });

        const unavailableSlots = reservations.map(reservation => reservation.startHour);
        const availableSlots = allSlots.filter(slot => !unavailableSlots.includes(slot));

        res.status(200).json({ availableSlots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.', error: error.toString() });
    }
});


router.get('/userReservations/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userReservations = await Reservation.find({ user: userId, status: 'active' })
            .populate('garage', 'address location'); 
        res.status(200).json({ userReservations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.', error: error.toString() });
    }
});


router.post('/:id/cancel', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found.' });
        }

        res.status(200).json({ message: 'Reservations canceled.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.', error: error.toString() });
    }
});


router.get('/availableSlots/:garageId', async (req, res) => {
    const { garageId } = req.params;

    try {
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return res.status(404).json({ message: 'Garage not found.' });
        }


        let currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);

     
        const allSlots = [];
        for (let i = 0; i < 24; i++) {
            allSlots.push(currentTime.toISOString().slice(11, 16)); 
            currentTime.setHours(currentTime.getHours() + 1);
        }

        
        const reservations = await Reservation.find({
            garage: garageId,
            status: 'active',
            startHour: { $gte: allSlots[0], $lte: allSlots[allSlots.length - 1] }
        });


        const unavailableSlots = reservations.map((reservation) => reservation.startHour);
        const availableSlots = allSlots.filter((slot) => !unavailableSlots.includes(slot));

        res.status(200).json({ availableSlots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.', error: error.toString() });
    }
});


module.exports = router;
