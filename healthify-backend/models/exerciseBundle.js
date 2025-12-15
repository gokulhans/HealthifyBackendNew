// models/exerciseBundle.js
const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * ExerciseBundle - Multi-day workout program
 * 
 * Structure:
 * - Bundle has multiple days
 * - Each day can be a rest day or have exercises
 * - Each exercise has reps/sets/duration for that day
 */

// Sub-schema for exercise in a day
const dayExerciseSchema = new mongoose.Schema({
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    reps: {
        type: Number,
        default: 0  // 0 means not applicable (use duration instead)
    },
    sets: {
        type: Number,
        default: 1
    },
    duration: {
        type: Number,
        default: 0  // in seconds, 0 means use reps instead
    },
    notes: {
        type: String,
        default: ''
    }
}, { _id: false });

// Sub-schema for a day in the bundle
const bundleDaySchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true,
        min: 1
    },
    isRestDay: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''  // e.g., "Leg Day", "Upper Body", "Rest & Recovery"
    },
    exercises: [dayExerciseSchema]
}, { _id: false });

// Main bundle schema
const exerciseBundleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    totalDays: {
        type: Number,
        required: true,
        min: 1,
        max: 90  // Max 90 days program
    },
    schedule: [bundleDaySchema],

    // Metadata
    isPublished: {
        type: Boolean,
        default: false
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false
    },
    tags: [{
        type: String,
        trim: true
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
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

// Auto-generate slug from name
exerciseBundleSchema.pre('validate', function (next) {
    if (this.name && (!this.slug || this.isModified('name'))) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Virtual for total exercises count
exerciseBundleSchema.virtual('totalExercises').get(function () {
    let count = 0;
    for (const day of this.schedule) {
        if (!day.isRestDay) {
            count += day.exercises.length;
        }
    }
    return count;
});

// Virtual for rest days count
exerciseBundleSchema.virtual('restDays').get(function () {
    return this.schedule.filter(d => d.isRestDay).length;
});

exerciseBundleSchema.set('toJSON', { virtuals: true });
exerciseBundleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.ExerciseBundle || mongoose.model('ExerciseBundle', exerciseBundleSchema);
