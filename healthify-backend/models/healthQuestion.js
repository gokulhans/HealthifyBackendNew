// models/healthQuestion.js
const mongoose = require('mongoose');

/**
 * HealthQuestion - Stores health assessment questions
 * 
 * - Questions are grouped by category (Body, Mind, Nutrition, Lifestyle)
 * - Each question has multiple choice options
 * - Admin can create/edit/delete questions
 */

const healthQuestionSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Body', 'Mind', 'Nutrition', 'Lifestyle'],
        index: true
    },
    questionNumber: {
        type: Number,
        default: 1
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        required: true,
        trim: true
    }],
    // Optional: score weights for each option (for future analytics)
    optionScores: [{
        type: Number,
        default: 0
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
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

// Compound index for efficient querying
healthQuestionSchema.index({ category: 1, order: 1 });

module.exports = mongoose.models.HealthQuestion || mongoose.model('HealthQuestion', healthQuestionSchema);
