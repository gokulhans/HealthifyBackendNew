const express = require('express');
const router = express.Router();
const MealLog = require('../models/mealLog');
const { protect } = require('../middleware/auth');

// GET /api/meals/today - Get logged meals for today
router.get('/today', protect, async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const meals = await MealLog.find({
            user: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ date: -1 });

        res.json({ data: meals });
    } catch (err) {
        console.error('Fetch today meals error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/meals/log - Log a new meal/food item
router.post('/log', protect, async (req, res) => {
    try {
        const { name, calories, type, items } = req.body;

        if (!name || isNaN(calories)) {
            return res.status(400).json({ message: 'Name and calories are required' });
        }

        const newMeal = new MealLog({
            user: req.user.id,
            name,
            calories: Number(calories),
            type: type || 'Snack',
            items: items || []
        });

        await newMeal.save();

        res.status(201).json({
            message: 'Meal logged successfully',
            data: newMeal
        });
    } catch (err) {
        console.error('Log meal error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/meals/:id - Remove a meal log
router.delete('/:id', protect, async (req, res) => {
    try {
        const meal = await MealLog.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!meal) {
            return res.status(404).json({ message: 'Meal log not found' });
        }

        res.json({ message: 'Meal log deleted successfully' });
    } catch (err) {
        console.error('Delete meal error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
