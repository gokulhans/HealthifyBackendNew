const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    type: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
        default: 'Snack'
    },
    items: [{
        name: { type: String },
        calories: { type: Number }
    }],
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Index for faster queries on user and date
mealLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MealLog', mealLogSchema);
