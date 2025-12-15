// models/healthAssessment.js
const mongoose = require('mongoose');

/**
 * HealthAssessment - Stores user's health assessment answers
 * 
 * - Each user has one assessment record (updated as they answer)
 * - Stores all answers grouped by category
 * - Tracks completion status per category
 */

// Individual answer schema
const answerSchema = new mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthQuestion',
        required: true
    },
    questionText: {
        type: String  // Denormalized for easy access
    },
    selectedOption: {
        type: Number,  // Index of selected option (0-based)
        required: true
    },
    selectedOptionText: {
        type: String  // Denormalized for easy access
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Category progress schema
const categoryProgressSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['Body', 'Mind', 'Nutrition', 'Lifestyle'],
        required: true
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    answeredQuestions: {
        type: Number,
        default: 0
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, { _id: false });

// Main assessment schema
const healthAssessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    answers: [answerSchema],
    categoryProgress: [categoryProgressSchema],
    overallProgress: {
        totalQuestions: {
            type: Number,
            default: 0
        },
        answeredQuestions: {
            type: Number,
            default: 0
        },
        percentComplete: {
            type: Number,
            default: 0
        }
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
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

// Update updatedAt on save
healthAssessmentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.models.HealthAssessment || mongoose.model('HealthAssessment', healthAssessmentSchema);
