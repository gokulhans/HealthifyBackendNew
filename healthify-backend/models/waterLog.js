// models/waterLog.js
const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String,  // Format: YYYY-MM-DD (date only, no time)
        required: true,
        index: true
    },
    count: {
        type: Number,
        default: 0,
        min: 0
    },
    goal: {
        type: Number,
        default: 8,
        min: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries - one log per user per day
waterLogSchema.index({ user: 1, date: 1 }, { unique: true });

// Helper method to get percentage
waterLogSchema.methods.getPercentage = function () {
    if (this.goal === 0) return 0;
    return Math.min(Math.round((this.count / this.goal) * 100), 100);
};

module.exports = mongoose.models.WaterLog || mongoose.model('WaterLog', waterLogSchema);
