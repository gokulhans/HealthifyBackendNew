// routes/exerciseBundles.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ExerciseBundle = require('../models/exerciseBundle');
const Exercise = require('../models/exercise');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

/**
 * @desc    List all exercise bundles
 * @route   GET /api/exercise-bundles
 * @access  Public (for mobile app) / Admin sees all including unpublished
 */
router.get('/', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
        const q = (req.query.q || '').trim();

        const filter = {};

        // Search
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        // Filter by difficulty
        if (req.query.difficulty) {
            filter.difficulty = req.query.difficulty;
        }

        // Filter by category
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Filter by published status (admin can see all)
        if (req.query.published === 'true') {
            filter.isPublished = true;
        } else if (req.query.published === 'false') {
            filter.isPublished = false;
        }

        const total = await ExerciseBundle.countDocuments(filter);
        const bundles = await ExerciseBundle.find(filter)
            .populate('category', 'name slug')
            .populate('schedule.exercises.exercise', 'title slug image difficulty')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            data: bundles
        });
    } catch (error) {
        console.error('List exercise bundles error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get single exercise bundle
 * @route   GET /api/exercise-bundles/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const bundle = await ExerciseBundle.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('schedule.exercises.exercise', 'title slug image difficulty duration equipment description');

        if (!bundle) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        res.status(200).json({
            success: true,
            data: bundle
        });
    } catch (error) {
        console.error('Get exercise bundle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Create exercise bundle
 * @route   POST /api/exercise-bundles
 * @access  Admin
 */
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            thumbnail,
            difficulty,
            totalDays,
            schedule,
            category,
            tags,
            isPublished
        } = req.body || {};

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Bundle name is required' });
        }

        if (!totalDays || totalDays < 1) {
            return res.status(400).json({ success: false, message: 'Total days must be at least 1' });
        }

        // Check for duplicate name
        const exists = await ExerciseBundle.findOne({ name: name.trim() });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Bundle with this name already exists' });
        }

        // Validate schedule if provided
        let validatedSchedule = [];
        if (schedule && Array.isArray(schedule)) {
            for (const day of schedule) {
                if (!day.day || day.day < 1 || day.day > totalDays) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid day number: ${day.day}. Must be between 1 and ${totalDays}`
                    });
                }

                const dayData = {
                    day: day.day,
                    isRestDay: day.isRestDay || false,
                    title: day.title || '',
                    exercises: []
                };

                // Validate exercises if not rest day
                if (!day.isRestDay && day.exercises && Array.isArray(day.exercises)) {
                    for (const ex of day.exercises) {
                        if (!ex.exercise || !mongoose.Types.ObjectId.isValid(ex.exercise)) {
                            return res.status(400).json({
                                success: false,
                                message: `Invalid exercise ID in day ${day.day}`
                            });
                        }

                        // Verify exercise exists
                        const exerciseExists = await Exercise.findById(ex.exercise);
                        if (!exerciseExists) {
                            return res.status(400).json({
                                success: false,
                                message: `Exercise not found: ${ex.exercise}`
                            });
                        }

                        dayData.exercises.push({
                            exercise: ex.exercise,
                            reps: ex.reps || 0,
                            sets: ex.sets || 1,
                            duration: ex.duration || 0,
                            notes: ex.notes || ''
                        });
                    }
                }

                validatedSchedule.push(dayData);
            }
        }

        // Create bundle
        const bundle = new ExerciseBundle({
            name: name.trim(),
            description: description || '',
            thumbnail: thumbnail || '',
            difficulty: difficulty || 'beginner',
            totalDays: totalDays,
            schedule: validatedSchedule,
            category: category || undefined,
            tags: tags || [],
            isPublished: isPublished || false,
            createdBy: req.user.id
        });

        await bundle.save();

        // Populate for response
        await bundle.populate('category', 'name slug');
        await bundle.populate('schedule.exercises.exercise', 'title slug image difficulty');

        res.status(201).json({
            success: true,
            message: 'Exercise bundle created',
            data: bundle
        });
    } catch (error) {
        console.error('Create exercise bundle error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bundle name already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update exercise bundle
 * @route   PUT /api/exercise-bundles/:id
 * @access  Admin
 */
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const bundle = await ExerciseBundle.findById(req.params.id);
        if (!bundle) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        const {
            name,
            description,
            thumbnail,
            difficulty,
            totalDays,
            schedule,
            category,
            tags,
            isPublished
        } = req.body || {};

        // Update fields
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            bundle.name = name.trim();
        }

        if (description !== undefined) bundle.description = description;
        if (thumbnail !== undefined) bundle.thumbnail = thumbnail;
        if (difficulty !== undefined) bundle.difficulty = difficulty;
        if (category !== undefined) bundle.category = category || undefined;
        if (tags !== undefined) bundle.tags = tags;
        if (isPublished !== undefined) bundle.isPublished = isPublished;

        // Handle totalDays change
        if (totalDays !== undefined) {
            if (totalDays < 1) {
                return res.status(400).json({ success: false, message: 'Total days must be at least 1' });
            }
            bundle.totalDays = totalDays;

            // Remove schedule days that exceed new totalDays
            bundle.schedule = bundle.schedule.filter(d => d.day <= totalDays);
        }

        // Update schedule if provided
        if (schedule !== undefined) {
            const validatedSchedule = [];
            const days = totalDays || bundle.totalDays;

            for (const day of schedule) {
                if (!day.day || day.day < 1 || day.day > days) {
                    continue; // Skip invalid days
                }

                const dayData = {
                    day: day.day,
                    isRestDay: day.isRestDay || false,
                    title: day.title || '',
                    exercises: []
                };

                if (!day.isRestDay && day.exercises && Array.isArray(day.exercises)) {
                    for (const ex of day.exercises) {
                        if (!ex.exercise || !mongoose.Types.ObjectId.isValid(ex.exercise)) {
                            continue; // Skip invalid exercises
                        }

                        dayData.exercises.push({
                            exercise: ex.exercise,
                            reps: ex.reps || 0,
                            sets: ex.sets || 1,
                            duration: ex.duration || 0,
                            notes: ex.notes || ''
                        });
                    }
                }

                validatedSchedule.push(dayData);
            }

            bundle.schedule = validatedSchedule;
        }

        bundle.updatedAt = new Date();
        await bundle.save();

        await bundle.populate('category', 'name slug');
        await bundle.populate('schedule.exercises.exercise', 'title slug image difficulty');

        res.status(200).json({
            success: true,
            message: 'Bundle updated',
            data: bundle
        });
    } catch (error) {
        console.error('Update exercise bundle error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bundle name already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update single day in bundle (convenient for grid editing)
 * @route   PUT /api/exercise-bundles/:id/day/:dayNum
 * @access  Admin
 */
router.put('/:id/day/:dayNum', protect, isAdmin, async (req, res) => {
    try {
        const dayNum = parseInt(req.params.dayNum, 10);

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const bundle = await ExerciseBundle.findById(req.params.id);
        if (!bundle) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        if (dayNum < 1 || dayNum > bundle.totalDays) {
            return res.status(400).json({
                success: false,
                message: `Day must be between 1 and ${bundle.totalDays}`
            });
        }

        const { isRestDay, title, exercises } = req.body || {};

        // Find or create day entry
        let dayIndex = bundle.schedule.findIndex(d => d.day === dayNum);

        if (dayIndex === -1) {
            // Create new day entry
            bundle.schedule.push({
                day: dayNum,
                isRestDay: isRestDay || false,
                title: title || '',
                exercises: []
            });
            dayIndex = bundle.schedule.length - 1;
        }

        // Update day
        if (isRestDay !== undefined) bundle.schedule[dayIndex].isRestDay = isRestDay;
        if (title !== undefined) bundle.schedule[dayIndex].title = title;

        // Update exercises
        if (exercises !== undefined) {
            const validExercises = [];
            for (const ex of exercises) {
                if (ex.exercise && mongoose.Types.ObjectId.isValid(ex.exercise)) {
                    validExercises.push({
                        exercise: ex.exercise,
                        reps: ex.reps || 0,
                        sets: ex.sets || 1,
                        duration: ex.duration || 0,
                        notes: ex.notes || ''
                    });
                }
            }
            bundle.schedule[dayIndex].exercises = validExercises;
        }

        // Sort schedule by day
        bundle.schedule.sort((a, b) => a.day - b.day);

        bundle.updatedAt = new Date();
        await bundle.save();

        await bundle.populate('schedule.exercises.exercise', 'title slug image difficulty');

        res.status(200).json({
            success: true,
            message: `Day ${dayNum} updated`,
            data: bundle.schedule.find(d => d.day === dayNum)
        });
    } catch (error) {
        console.error('Update bundle day error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Delete exercise bundle
 * @route   DELETE /api/exercise-bundles/:id
 * @access  Admin
 */
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const bundle = await ExerciseBundle.findByIdAndDelete(req.params.id);
        if (!bundle) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Bundle deleted'
        });
    } catch (error) {
        console.error('Delete exercise bundle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Toggle publish status
 * @route   PATCH /api/exercise-bundles/:id/publish
 * @access  Admin
 */
router.patch('/:id/publish', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const bundle = await ExerciseBundle.findById(req.params.id);
        if (!bundle) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        bundle.isPublished = !bundle.isPublished;
        bundle.updatedAt = new Date();
        await bundle.save();

        res.status(200).json({
            success: true,
            message: `Bundle ${bundle.isPublished ? 'published' : 'unpublished'}`,
            data: {
                id: bundle._id,
                isPublished: bundle.isPublished
            }
        });
    } catch (error) {
        console.error('Toggle bundle publish error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Duplicate a bundle
 * @route   POST /api/exercise-bundles/:id/duplicate
 * @access  Admin
 */
router.post('/:id/duplicate', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid bundle ID' });
        }

        const original = await ExerciseBundle.findById(req.params.id);
        if (!original) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        // Create copy with new name
        const copyName = `${original.name} (Copy)`;
        let finalName = copyName;
        let counter = 1;

        while (await ExerciseBundle.findOne({ name: finalName })) {
            finalName = `${copyName} ${counter}`;
            counter++;
        }

        const copy = new ExerciseBundle({
            name: finalName,
            description: original.description,
            thumbnail: original.thumbnail,
            difficulty: original.difficulty,
            totalDays: original.totalDays,
            schedule: original.schedule,
            category: original.category,
            tags: original.tags,
            isPublished: false,
            createdBy: req.user.id
        });

        await copy.save();
        await copy.populate('category', 'name slug');
        await copy.populate('schedule.exercises.exercise', 'title slug image difficulty');

        res.status(201).json({
            success: true,
            message: 'Bundle duplicated',
            data: copy
        });
    } catch (error) {
        console.error('Duplicate bundle error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
