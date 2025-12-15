// models/userMedicine.js
const mongoose = require('mongoose');

/**
 * UserMedicine - User's personal medicine list with schedules and reminders
 * 
 * - Links to global medicine catalog (optional) or custom medicine
 * - Contains schedule (frequency, times, dates)
 * - Alarm times for mobile notifications
 */
const userMedicineSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Link to global medicine catalog (optional - can be custom)
    catalogMedicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: false
    },

    // Medicine details (can override catalog or be custom)
    name: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        default: ''
    },
    unit: {
        type: String,
        default: '',
        enum: ['', 'mg', 'ml', 'tablets', 'capsules', 'drops', 'spoons', 'units']
    },
    instructions: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },

    // Schedule settings
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'as_needed', 'custom'],
        default: 'daily'
    },

    // For weekly frequency - which days
    weekDays: {
        type: [String],
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        default: []
    },

    // Reminder times (multiple times per day)
    reminderTimes: [{
        time: {
            type: String,  // HH:MM format (24-hour)
            required: true
        },
        label: {
            type: String,  // e.g., "Morning", "After Lunch", "Before Bed"
            default: ''
        },
        enabled: {
            type: Boolean,
            default: true
        }
    }],

    // Date range
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: false  // Optional - ongoing if not set
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    // Alarm settings (for mobile app)
    alarmEnabled: {
        type: Boolean,
        default: true
    },

    // Notes
    notes: {
        type: String,
        default: ''
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

// Compound index for user's medicine list
userMedicineSchema.index({ user: 1, name: 1 });
userMedicineSchema.index({ user: 1, isActive: 1 });

// Virtual to check if medicine is currently active based on dates
userMedicineSchema.virtual('isCurrentlyActive').get(function () {
    const now = new Date();
    const started = this.startDate <= now;
    const notEnded = !this.endDate || this.endDate >= now;
    return this.isActive && started && notEnded;
});

// Ensure virtuals are included in JSON output
userMedicineSchema.set('toJSON', { virtuals: true });
userMedicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.UserMedicine || mongoose.model('UserMedicine', userMedicineSchema);
