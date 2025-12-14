// routes/userMedicines.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const UserMedicine = require('../models/userMedicine');
const Medicine = require('../models/medicine');
const { protect } = require('../middleware/auth');

/**
 * Helper: Validate time format (HH:MM)
 */
function isValidTime(time) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Helper: Validate date string
 */
function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

// ============================================
// GLOBAL MEDICINE CATALOG (for searching)
// ============================================

/**
 * @desc    Search global medicine catalog
 * @route   GET /api/user-medicines/catalog
 * @access  Private (User)
 * @query   { q?: string, page?: number, limit?: number }
 */
router.get('/catalog', protect, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
        const q = (req.query.q || '').trim();

        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        const total = await Medicine.countDocuments(filter);
        const medicines = await Medicine.find(filter)
            .select('name slug dosage unit description image')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            data: medicines
        });
    } catch (error) {
        console.error('Search medicine catalog error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get single medicine from catalog
 * @route   GET /api/user-medicines/catalog/:id
 * @access  Private (User)
 */
router.get('/catalog/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await Medicine.findById(req.params.id)
            .select('name slug dosage unit description image');

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        console.error('Get catalog medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Suggest a new medicine to the catalog (users can contribute)
 * @route   POST /api/user-medicines/catalog/suggest
 * @access  Private (User)
 */
router.post('/catalog/suggest', protect, async (req, res) => {
    try {
        const { name, dosage, unit, description, image } = req.body || {};

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Medicine name is required' });
        }

        // Check if already exists
        const exists = await Medicine.findOne({
            name: { $regex: `^${name.trim()}$`, $options: 'i' }
        });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Medicine already exists in catalog',
                data: { existingId: exists._id }
            });
        }

        // Create new medicine in catalog
        const medicine = new Medicine({
            name: name.trim(),
            dosage: dosage || '',
            unit: unit || '',
            description: description || '',
            image: image || '',
            user: req.user.id  // Track who suggested it
        });

        await medicine.save();

        res.status(201).json({
            success: true,
            message: 'Medicine added to catalog',
            data: medicine
        });
    } catch (error) {
        console.error('Suggest medicine error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Medicine already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// USER'S PERSONAL MEDICINE LIST
// ============================================

/**
 * @desc    Get all user's medicines
 * @route   GET /api/user-medicines
 * @access  Private (User)
 * @query   { active?: boolean, q?: string }
 */
router.get('/', protect, async (req, res) => {
    try {
        const filter = { user: req.user.id };

        // Filter by active status
        if (req.query.active === 'true') {
            filter.isActive = true;
        } else if (req.query.active === 'false') {
            filter.isActive = false;
        }

        // Search by name
        if (req.query.q) {
            filter.name = { $regex: req.query.q, $options: 'i' };
        }

        const medicines = await UserMedicine.find(filter)
            .populate('catalogMedicine', 'name slug image')
            .sort({ createdAt: -1 });

        // Add isCurrentlyActive flag
        const now = new Date();
        const data = medicines.map(med => {
            const obj = med.toObject();
            const started = new Date(med.startDate) <= now;
            const notEnded = !med.endDate || new Date(med.endDate) >= now;
            obj.isCurrentlyActive = med.isActive && started && notEnded;
            return obj;
        });

        res.status(200).json({
            success: true,
            total: data.length,
            data: data
        });
    } catch (error) {
        console.error('Get user medicines error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get single user medicine
 * @route   GET /api/user-medicines/:id
 * @access  Private (User)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        // Skip if it's a catalog route
        if (req.params.id === 'catalog') {
            return res.status(400).json({ success: false, message: 'Invalid route' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await UserMedicine.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('catalogMedicine', 'name slug image description');

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        res.status(200).json({
            success: true,
            data: medicine
        });
    } catch (error) {
        console.error('Get user medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Add medicine to user's list
 * @route   POST /api/user-medicines
 * @access  Private (User)
 * @body    { name, dosage?, unit?, frequency, reminderTimes[], startDate, endDate?, instructions?, catalogMedicineId? }
 */
router.post('/', protect, async (req, res) => {
    try {
        const {
            name,
            dosage,
            unit,
            instructions,
            image,
            frequency,
            weekDays,
            reminderTimes,
            startDate,
            endDate,
            alarmEnabled,
            notes,
            catalogMedicineId
        } = req.body || {};

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Medicine name is required' });
        }

        if (!startDate || !isValidDate(startDate)) {
            return res.status(400).json({ success: false, message: 'Valid start date is required' });
        }

        if (endDate && !isValidDate(endDate)) {
            return res.status(400).json({ success: false, message: 'Invalid end date' });
        }

        if (endDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        // Validate reminder times
        let validatedTimes = [];
        if (reminderTimes && Array.isArray(reminderTimes)) {
            for (const rt of reminderTimes) {
                if (!rt.time || !isValidTime(rt.time)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid time format: ${rt.time}. Use HH:MM (24-hour)`
                    });
                }
                validatedTimes.push({
                    time: rt.time,
                    label: rt.label || '',
                    enabled: rt.enabled !== false
                });
            }
        }

        // Validate catalog medicine if provided
        let catalogMedicine = null;
        if (catalogMedicineId) {
            if (!mongoose.Types.ObjectId.isValid(catalogMedicineId)) {
                return res.status(400).json({ success: false, message: 'Invalid catalog medicine ID' });
            }
            catalogMedicine = await Medicine.findById(catalogMedicineId);
            if (!catalogMedicine) {
                return res.status(400).json({ success: false, message: 'Catalog medicine not found' });
            }
        }

        const userMedicine = new UserMedicine({
            user: req.user.id,
            catalogMedicine: catalogMedicine ? catalogMedicine._id : undefined,
            name: name.trim(),
            dosage: dosage || '',
            unit: unit || '',
            instructions: instructions || '',
            image: image || (catalogMedicine ? catalogMedicine.image : ''),
            frequency: frequency || 'daily',
            weekDays: weekDays || [],
            reminderTimes: validatedTimes,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            alarmEnabled: alarmEnabled !== false,
            notes: notes || '',
            isActive: true
        });

        await userMedicine.save();
        await userMedicine.populate('catalogMedicine', 'name slug image');

        res.status(201).json({
            success: true,
            message: 'Medicine added successfully',
            data: userMedicine
        });
    } catch (error) {
        console.error('Add user medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update user's medicine
 * @route   PUT /api/user-medicines/:id
 * @access  Private (User)
 */
router.put('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await UserMedicine.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        const {
            name,
            dosage,
            unit,
            instructions,
            image,
            frequency,
            weekDays,
            reminderTimes,
            startDate,
            endDate,
            alarmEnabled,
            notes,
            isActive
        } = req.body || {};

        // Update fields if provided
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            medicine.name = name.trim();
        }

        if (dosage !== undefined) medicine.dosage = dosage;
        if (unit !== undefined) medicine.unit = unit;
        if (instructions !== undefined) medicine.instructions = instructions;
        if (image !== undefined) medicine.image = image;
        if (frequency !== undefined) medicine.frequency = frequency;
        if (weekDays !== undefined) medicine.weekDays = weekDays;
        if (notes !== undefined) medicine.notes = notes;
        if (isActive !== undefined) medicine.isActive = isActive;
        if (alarmEnabled !== undefined) medicine.alarmEnabled = alarmEnabled;

        // Validate and update reminder times
        if (reminderTimes !== undefined) {
            if (!Array.isArray(reminderTimes)) {
                return res.status(400).json({ success: false, message: 'reminderTimes must be an array' });
            }

            const validatedTimes = [];
            for (const rt of reminderTimes) {
                if (!rt.time || !isValidTime(rt.time)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid time format: ${rt.time}. Use HH:MM (24-hour)`
                    });
                }
                validatedTimes.push({
                    time: rt.time,
                    label: rt.label || '',
                    enabled: rt.enabled !== false
                });
            }
            medicine.reminderTimes = validatedTimes;
        }

        // Validate dates
        if (startDate !== undefined) {
            if (!isValidDate(startDate)) {
                return res.status(400).json({ success: false, message: 'Invalid start date' });
            }
            medicine.startDate = new Date(startDate);
        }

        if (endDate !== undefined) {
            if (endDate === null || endDate === '') {
                medicine.endDate = undefined;
            } else if (!isValidDate(endDate)) {
                return res.status(400).json({ success: false, message: 'Invalid end date' });
            } else if (new Date(endDate) < medicine.startDate) {
                return res.status(400).json({ success: false, message: 'End date must be after start date' });
            } else {
                medicine.endDate = new Date(endDate);
            }
        }

        medicine.updatedAt = new Date();
        await medicine.save();
        await medicine.populate('catalogMedicine', 'name slug image');

        res.status(200).json({
            success: true,
            message: 'Medicine updated successfully',
            data: medicine
        });
    } catch (error) {
        console.error('Update user medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Delete user's medicine
 * @route   DELETE /api/user-medicines/:id
 * @access  Private (User)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await UserMedicine.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Medicine deleted successfully'
        });
    } catch (error) {
        console.error('Delete user medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Toggle medicine active status
 * @route   PATCH /api/user-medicines/:id/toggle
 * @access  Private (User)
 */
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await UserMedicine.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        medicine.isActive = !medicine.isActive;
        medicine.updatedAt = new Date();
        await medicine.save();

        res.status(200).json({
            success: true,
            message: `Medicine ${medicine.isActive ? 'activated' : 'deactivated'}`,
            data: {
                id: medicine._id,
                isActive: medicine.isActive
            }
        });
    } catch (error) {
        console.error('Toggle medicine error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Toggle alarm for a medicine
 * @route   PATCH /api/user-medicines/:id/alarm
 * @access  Private (User)
 */
router.patch('/:id/alarm', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid medicine ID' });
        }

        const medicine = await UserMedicine.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        // If enabled is provided in body, use it; otherwise toggle
        if (req.body.enabled !== undefined) {
            medicine.alarmEnabled = req.body.enabled;
        } else {
            medicine.alarmEnabled = !medicine.alarmEnabled;
        }

        medicine.updatedAt = new Date();
        await medicine.save();

        res.status(200).json({
            success: true,
            message: `Alarm ${medicine.alarmEnabled ? 'enabled' : 'disabled'}`,
            data: {
                id: medicine._id,
                alarmEnabled: medicine.alarmEnabled
            }
        });
    } catch (error) {
        console.error('Toggle alarm error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get today's medicines with reminders (for notification scheduling)
 * @route   GET /api/user-medicines/today/reminders
 * @access  Private (User)
 */
router.get('/today/reminders', protect, async (req, res) => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

        // Find active medicines that are scheduled for today
        const medicines = await UserMedicine.find({
            user: req.user.id,
            isActive: true,
            alarmEnabled: true,
            startDate: { $lte: now },
            $or: [
                { endDate: null },
                { endDate: undefined },
                { endDate: { $gte: now } }
            ]
        }).select('name dosage unit frequency weekDays reminderTimes instructions');

        // Filter based on frequency
        const todayMedicines = medicines.filter(med => {
            if (med.frequency === 'daily') return true;
            if (med.frequency === 'weekly') {
                return med.weekDays.includes(dayOfWeek);
            }
            if (med.frequency === 'as_needed') return false; // Don't auto-remind
            return true;
        });

        // Build reminder list
        const reminders = [];
        for (const med of todayMedicines) {
            for (const rt of med.reminderTimes) {
                if (rt.enabled) {
                    reminders.push({
                        medicineId: med._id,
                        medicineName: med.name,
                        dosage: med.dosage,
                        unit: med.unit,
                        time: rt.time,
                        label: rt.label,
                        instructions: med.instructions
                    });
                }
            }
        }

        // Sort by time
        reminders.sort((a, b) => a.time.localeCompare(b.time));

        res.status(200).json({
            success: true,
            date: today,
            dayOfWeek: dayOfWeek,
            total: reminders.length,
            data: reminders
        });
    } catch (error) {
        console.error('Get today reminders error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
