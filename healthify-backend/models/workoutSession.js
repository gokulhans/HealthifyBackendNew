// models/workoutSession.js
const mongoose = require('mongoose');

/**
 * WorkoutSession - Tracks a user's exercise program session
 * 
 * - Stores which program/day the user is doing
 * - Tracks each exercise completion with time
 * - Calculates total workout time
 * - Used for calendar view and daily summary
 */

// Individual exercise progress within a session
const exerciseProgressSchema = new mongoose.Schema({
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    // From the program schedule
    targetReps: {
        type: Number,
        default: 0
    },
    targetSets: {
        type: Number,
        default: 1
    },
    // What user actually completed
    completedReps: {
        type: Number,
        default: 0
    },
    completedSets: {
        type: Number,
        default: 0
    },
    // Time tracking
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    duration: {
        type: Number,  // in seconds
        default: 0
    },
    restTime: {
        type: Number,  // rest after this exercise, in seconds
        default: 0
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        default: 'pending'
    },
    order: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Main workout session schema
const workoutSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Reference to the program and day
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExerciseBundle',
        required: false  // Can be a standalone workout too
    },
    programDay: {
        type: Number,  // Which day of the program (1, 2, 3...)
        required: false
    },
    programDayTitle: {
        type: String,
        default: ''
    },

    // Or standalone workout reference
    workout: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workout',
        required: false
    },

    // Session details
    title: {
        type: String,
        default: 'Workout Session'
    },
    date: {
        type: String,  // YYYY-MM-DD format for easy querying
        required: true,
        index: true
    },

    // Exercise list with progress
    exercises: [exerciseProgressSchema],

    // Overall session tracking
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'paused', 'completed', 'abandoned'],
        default: 'not_started'
    },
    currentExerciseIndex: {
        type: Number,
        default: 0
    },

    // Time tracking
    startedAt: {
        type: Date
    },
    pausedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    totalDuration: {
        type: Number,  // Total workout time in seconds
        default: 0
    },
    totalRestTime: {
        type: Number,  // Total rest time in seconds
        default: 0
    },
    pausedDuration: {
        type: Number,  // Time spent paused
        default: 0
    },

    // Summary
    totalExercises: {
        type: Number,
        default: 0
    },
    completedExercises: {
        type: Number,
        default: 0
    },
    skippedExercises: {
        type: Number,
        default: 0
    },

    // User notes
    notes: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,  // User's rating of the workout (1-5)
        min: 1,
        max: 5
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

// Compound indexes
workoutSessionSchema.index({ user: 1, date: 1 });
workoutSessionSchema.index({ user: 1, program: 1, programDay: 1 });
workoutSessionSchema.index({ user: 1, status: 1 });

// Virtual for completion percentage
workoutSessionSchema.virtual('completionPercentage').get(function () {
    if (this.totalExercises === 0) return 0;
    return Math.round((this.completedExercises / this.totalExercises) * 100);
});

// Virtual for formatted duration
workoutSessionSchema.virtual('formattedDuration').get(function () {
    const mins = Math.floor(this.totalDuration / 60);
    const secs = this.totalDuration % 60;
    return `${mins}m ${secs}s`;
});

workoutSessionSchema.set('toJSON', { virtuals: true });
workoutSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.WorkoutSession || mongoose.model('WorkoutSession', workoutSessionSchema);
