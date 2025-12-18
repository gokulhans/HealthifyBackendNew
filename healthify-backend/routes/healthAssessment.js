// routes/healthAssessment.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const HealthQuestion = require('../models/healthQuestion');
const HealthAssessment = require('../models/healthAssessment');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// ============================================
// QUESTIONS (Public read, Admin write)
// ============================================

/**
 * @desc    Get all questions grouped by category
 * @route   GET /api/health-assessment/questions
 * @access  Public
 */
router.get('/questions', async (req, res) => {
    try {
        const questions = await HealthQuestion.find({ isActive: true })
            .sort({ category: 1, order: 1, questionNumber: 1 });

        // Group by category
        const grouped = {
            Body: [],
            Mind: [],
            Nutrition: [],
            Lifestyle: []
        };

        questions.forEach(q => {
            if (grouped[q.category]) {
                grouped[q.category].push(q);
            }
        });

        res.json({
            success: true,
            data: grouped,
            total: questions.length
        });
    } catch (error) {
        console.error('Get health questions error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get questions for a specific category
 * @route   GET /api/health-assessment/questions/:category
 * @access  Public
 */
router.get('/questions/:category', async (req, res) => {
    try {
        const validCategories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];
        const category = req.params.category;

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: Body, Mind, Nutrition, Lifestyle'
            });
        }

        const questions = await HealthQuestion.find({
            category,
            isActive: true
        }).sort({ order: 1, questionNumber: 1 });

        res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Get category questions error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Create a new question (Admin only)
 * @route   POST /api/health-assessment/questions
 * @access  Private (Admin)
 */
router.post('/questions', protect, isAdmin, async (req, res) => {
    try {
        const { category, questionNumber, questionText, options, optionScores, order } = req.body;

        if (!category || !questionText || !options || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Category, questionText, and at least 2 options are required'
            });
        }

        const validCategories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Get next question number for this category
        const maxQuestion = await HealthQuestion.findOne({ category })
            .sort({ questionNumber: -1 });
        const nextNumber = questionNumber || (maxQuestion ? maxQuestion.questionNumber + 1 : 1);

        const question = new HealthQuestion({
            category,
            questionNumber: nextNumber,
            questionText,
            options,
            optionScores: optionScores || options.map(() => 0),
            order: order || nextNumber
        });

        await question.save();

        res.status(201).json({
            success: true,
            message: 'Question created',
            data: question
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update a question (Admin only)
 * @route   PUT /api/health-assessment/questions/:id
 * @access  Private (Admin)
 */
router.put('/questions/:id', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid question ID' });
        }

        const question = await HealthQuestion.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const { category, questionNumber, questionText, options, optionScores, order, isActive } = req.body;

        if (category) question.category = category;
        if (questionNumber) question.questionNumber = questionNumber;
        if (questionText) question.questionText = questionText;
        if (options) question.options = options;
        if (optionScores) question.optionScores = optionScores;
        if (order !== undefined) question.order = order;
        if (isActive !== undefined) question.isActive = isActive;
        question.updatedAt = new Date();

        await question.save();

        res.json({
            success: true,
            message: 'Question updated',
            data: question
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Delete a question (Admin only)
 * @route   DELETE /api/health-assessment/questions/:id
 * @access  Private (Admin)
 */
router.delete('/questions/:id', protect, isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid question ID' });
        }

        const question = await HealthQuestion.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.json({
            success: true,
            message: 'Question deleted'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// USER ANSWERS
// ============================================

/**
 * @desc    Get user's assessment progress
 * @route   GET /api/health-assessment/my-progress
 * @access  Private (User)
 */
router.get('/my-progress', protect, async (req, res) => {
    try {
        let assessment = await HealthAssessment.findOne({ user: req.user.id })
            .populate('answers.question', 'category questionText options');

        if (!assessment) {
            // Create empty assessment for new users
            assessment = new HealthAssessment({
                user: req.user.id,
                answers: [],
                categoryProgress: [
                    { category: 'Body', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Mind', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Nutrition', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Lifestyle', totalQuestions: 0, answeredQuestions: 0 }
                ]
            });
            await assessment.save();
        }

        res.json({
            success: true,
            data: assessment
        });
    } catch (error) {
        console.error('Get assessment progress error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get assessment results with scores and recommendations
 * @route   GET /api/health-assessment/results
 * @access  Private (User)
 */
router.get('/results', protect, async (req, res) => {
    try {
        const assessment = await HealthAssessment.findOne({ user: req.user.id });

        if (!assessment || assessment.answers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No assessment results found. Please complete the assessment first.'
            });
        }

        // Get all questions to get their scoring weights
        const questions = await HealthQuestion.find({ isActive: true });
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        // Initialize category results
        const categories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];
        const categoryScores = {};
        categories.forEach(cat => {
            categoryScores[cat] = {
                totalScore: 0,
                maxScore: 0,
                answeredCount: 0,
                percentage: 0
            };
        });

        // Calculate scores
        assessment.answers.forEach(answer => {
            const question = questionMap[answer.question.toString()];
            if (question) {
                const category = question.category;
                const score = question.optionScores[answer.selectedOption] || 0;
                const maxPossible = Math.max(...question.optionScores);

                categoryScores[category].totalScore += score;
                categoryScores[category].maxScore += maxPossible;
                categoryScores[category].answeredCount += 1;
            }
        });

        // Finalize category percentages
        let totalWeightedScore = 0;
        let totalMaxScore = 0;

        categories.forEach(cat => {
            const s = categoryScores[cat];
            if (s.maxScore > 0) {
                s.percentage = Math.round((s.totalScore / s.maxScore) * 100);
                totalWeightedScore += s.totalScore;
                totalMaxScore += s.maxScore;
            }
        });

        const overallPercentage = totalMaxScore > 0 ? Math.round((totalWeightedScore / totalMaxScore) * 100) : 0;

        // Determine level
        let level = 'Needs Improvement';
        if (overallPercentage >= 90) level = 'Excellent';
        else if (overallPercentage >= 75) level = 'Good';
        else if (overallPercentage >= 50) level = 'Fair';

        // Generate Recommendations
        const recommendations = [];

        // 1. Low Category Recommendations
        if (categoryScores['Mind'].percentage < 60) {
            recommendations.push({
                category: 'Mind',
                priority: 'high',
                title: 'Prioritize Mental Rest',
                description: 'Your mind score suggests high stress or fatigue. Try incorporating 5-10 minutes of daily mindfulness.',
                icon: 'psychology'
            });
        }
        if (categoryScores['Body'].percentage < 60) {
            recommendations.push({
                category: 'Body',
                priority: 'high',
                title: 'Consistent Movement',
                description: 'Increasing your daily step count or light mobility exercises can significantly improve your physical baseline.',
                icon: 'fitness_center'
            });
        }

        // 2. Specific Answer-based Recommendations
        const answers = assessment.answers;

        // Stress check
        const stressQ = questions.find(q => q.questionText.includes('stress levels'));
        if (stressQ) {
            const stressAns = answers.find(a => a.question.toString() === stressQ._id.toString());
            if (stressAns && stressAns.selectedOption >= 2) { // 'High' or 'Very High'
                recommendations.push({
                    category: 'Mind',
                    priority: 'high',
                    title: 'Stress Management',
                    description: 'You indicated high stress. Consider our Guided Meditations to lower cortisol and improve focus.',
                    icon: 'psychology'
                });
            }
        }

        // Sleep check
        const sleepQ = questions.find(q => q.questionText.includes('hours of sleep'));
        if (sleepQ) {
            const sleepAns = answers.find(a => a.question.toString() === sleepQ._id.toString());
            if (sleepAns && sleepAns.selectedOption === 0) { // 'Less than 5'
                recommendations.push({
                    category: 'Lifestyle',
                    priority: 'high',
                    title: 'Sleep Hygiene',
                    description: 'Less than 5 hours of sleep is critical. Aim for a consistent bedtime and reduce blue light exposure.',
                    icon: 'bedtime'
                });
            }
        }

        // Add a general "keep it up" if everything is good
        if (recommendations.length === 0) {
            recommendations.push({
                category: 'General',
                priority: 'low',
                title: 'Maintain Consistency',
                description: 'Your habits are looking great! Keep following your current routine.',
                icon: 'lightbulb_outline'
            });
        }

        res.json({
            success: true,
            data: {
                overallScore: {
                    score: totalWeightedScore,
                    maxScore: totalMaxScore,
                    percentage: overallPercentage,
                    level: level
                },
                categoryScores: categoryScores,
                recommendations: recommendations,
                completedAt: assessment.completedAt,
                totalQuestionsAnswered: assessment.answers.length
            }
        });
    } catch (error) {
        console.error('Get assessment results error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Submit an answer
 * @route   POST /api/health-assessment/answer
 * @access  Private (User)
 * @body    { questionId, selectedOption }
 */
router.post('/answer', protect, async (req, res) => {
    try {
        const { questionId, selectedOption } = req.body;

        if (!questionId || selectedOption === undefined) {
            return res.status(400).json({
                success: false,
                message: 'questionId and selectedOption are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ success: false, message: 'Invalid question ID' });
        }

        // Get the question
        const question = await HealthQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        if (selectedOption < 0 || selectedOption >= question.options.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid option selected'
            });
        }

        // Get or create user's assessment
        let assessment = await HealthAssessment.findOne({ user: req.user.id });

        if (!assessment) {
            assessment = new HealthAssessment({
                user: req.user.id,
                answers: [],
                categoryProgress: [
                    { category: 'Body', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Mind', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Nutrition', totalQuestions: 0, answeredQuestions: 0 },
                    { category: 'Lifestyle', totalQuestions: 0, answeredQuestions: 0 }
                ]
            });
        }

        // Check if this question was already answered
        const existingAnswerIndex = assessment.answers.findIndex(
            a => a.question.toString() === questionId
        );

        const answerData = {
            question: questionId,
            questionText: question.questionText,
            selectedOption,
            selectedOptionText: question.options[selectedOption],
            answeredAt: new Date()
        };

        if (existingAnswerIndex >= 0) {
            // Update existing answer
            assessment.answers[existingAnswerIndex] = answerData;
        } else {
            // Add new answer
            assessment.answers.push(answerData);
        }

        // Update category progress
        const totalByCategory = await HealthQuestion.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const answeredByCategory = {};
        assessment.answers.forEach(a => {
            const q = a.question;
            // We'll need the category from the answer's questionText or re-query
        });

        // Get categories for all answered questions
        const answeredQuestionIds = assessment.answers.map(a => a.question);
        const answeredQuestions = await HealthQuestion.find({
            _id: { $in: answeredQuestionIds }
        }).select('category');

        answeredQuestions.forEach(q => {
            answeredByCategory[q.category] = (answeredByCategory[q.category] || 0) + 1;
        });

        // Update category progress
        assessment.categoryProgress = totalByCategory.map(t => {
            const category = t._id;
            const total = t.count;
            const answered = answeredByCategory[category] || 0;
            return {
                category,
                totalQuestions: total,
                answeredQuestions: answered,
                isComplete: answered >= total,
                completedAt: answered >= total ? new Date() : null
            };
        });

        // Update overall progress
        const totalQuestions = totalByCategory.reduce((sum, t) => sum + t.count, 0);
        const answeredTotal = assessment.answers.length;
        assessment.overallProgress = {
            totalQuestions,
            answeredQuestions: Math.min(answeredTotal, totalQuestions),
            percentComplete: totalQuestions > 0 ? Math.round((answeredTotal / totalQuestions) * 100) : 0
        };

        // Check if all complete
        assessment.isComplete = answeredTotal >= totalQuestions && totalQuestions > 0;
        if (assessment.isComplete && !assessment.completedAt) {
            assessment.completedAt = new Date();
        }

        await assessment.save();

        res.json({
            success: true,
            message: 'Answer saved',
            data: {
                answer: answerData,
                progress: assessment.overallProgress,
                isComplete: assessment.isComplete
            }
        });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get assessment results with calculated scores and recommendations
 * @route   GET /api/health-assessment/results
 * @access  Private (User)
 */
router.get('/results', protect, async (req, res) => {
    try {
        const assessment = await HealthAssessment.findOne({ user: req.user.id });

        if (!assessment || assessment.answers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No assessment found. Please complete the assessment first.'
            });
        }

        // Get all questions with their scores
        const questionIds = assessment.answers.map(a => a.question);
        const questions = await HealthQuestion.find({ _id: { $in: questionIds } });

        // Create a map of questions for quick lookup
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        // Calculate scores per category
        const categoryScores = {
            Body: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
            Mind: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
            Nutrition: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
            Lifestyle: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 }
        };

        // Process each answer
        assessment.answers.forEach(answer => {
            const question = questionMap[answer.question.toString()];
            if (!question) return;

            const category = question.category;
            const optionScores = question.optionScores || [];

            // Get score for selected option (default to index-based scoring if no scores defined)
            let score = 0;
            if (optionScores.length > 0 && optionScores[answer.selectedOption] !== undefined) {
                score = optionScores[answer.selectedOption];
            } else {
                // Default scoring: higher index = better score (0-3 scale for 4 options)
                score = answer.selectedOption;
            }

            // Max possible score for this question
            let maxScore = 0;
            if (optionScores.length > 0) {
                maxScore = Math.max(...optionScores);
            } else {
                maxScore = question.options.length - 1;
            }

            if (categoryScores[category]) {
                categoryScores[category].totalScore += score;
                categoryScores[category].maxScore += maxScore;
                categoryScores[category].answeredCount += 1;
            }
        });

        // Calculate percentages
        Object.keys(categoryScores).forEach(category => {
            const cat = categoryScores[category];
            if (cat.maxScore > 0) {
                cat.percentage = Math.round((cat.totalScore / cat.maxScore) * 100);
            }
        });

        // Calculate overall score
        const totalScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.totalScore, 0);
        const maxScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.maxScore, 0);
        const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        // Generate recommendations based on scores
        const recommendations = generateRecommendations(categoryScores);

        // Determine health level
        let healthLevel = 'Excellent';
        if (overallPercentage < 40) healthLevel = 'Needs Improvement';
        else if (overallPercentage < 60) healthLevel = 'Fair';
        else if (overallPercentage < 80) healthLevel = 'Good';

        res.json({
            success: true,
            data: {
                overallScore: {
                    score: totalScore,
                    maxScore: maxScore,
                    percentage: overallPercentage,
                    level: healthLevel
                },
                categoryScores: categoryScores,
                recommendations: recommendations,
                completedAt: assessment.completedAt,
                totalQuestionsAnswered: assessment.answers.length
            }
        });
    } catch (error) {
        console.error('Get assessment results error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get assessment results for a specific category
 * @route   GET /api/health-assessment/results/category/:category
 * @access  Private (User)
 */
router.get('/results/category/:category', protect, async (req, res) => {
    try {
        const validCategories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];
        const category = req.params.category;

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: Body, Mind, Nutrition, Lifestyle'
            });
        }

        const assessment = await HealthAssessment.findOne({ user: req.user.id });

        if (!assessment || assessment.answers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No assessment found. Please complete the assessment first.'
            });
        }

        // Get all questions for this category with their scores
        const questionIds = assessment.answers.map(a => a.question);
        const questions = await HealthQuestion.find({
            _id: { $in: questionIds },
            category: category
        });

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No answers found for ${category} category.`
            });
        }

        // Create a map of questions for quick lookup
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        // Calculate score for this category
        let totalScore = 0;
        let maxScore = 0;
        let answeredCount = 0;

        // Process each answer for this category
        assessment.answers.forEach(answer => {
            const question = questionMap[answer.question.toString()];
            if (!question) return;

            const optionScores = question.optionScores || [];

            // Get score for selected option
            let score = 0;
            if (optionScores.length > 0 && optionScores[answer.selectedOption] !== undefined) {
                score = optionScores[answer.selectedOption];
            } else {
                score = answer.selectedOption;
            }

            // Max possible score for this question
            let questionMaxScore = 0;
            if (optionScores.length > 0) {
                questionMaxScore = Math.max(...optionScores);
            } else {
                questionMaxScore = question.options.length - 1;
            }

            totalScore += score;
            maxScore += questionMaxScore;
            answeredCount += 1;
        });

        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        // Generate recommendation for this category
        const recommendation = generateCategoryRecommendation(category, percentage);

        // Determine level
        let level = 'Excellent';
        if (percentage < 40) level = 'Needs Improvement';
        else if (percentage < 60) level = 'Fair';
        else if (percentage < 80) level = 'Good';

        res.json({
            success: true,
            data: {
                category,
                score: {
                    totalScore,
                    maxScore,
                    percentage,
                    level,
                    answeredCount
                },
                recommendation
            }
        });
    } catch (error) {
        console.error('Get category results error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * Helper function to generate recommendation for a specific category
 */
function generateCategoryRecommendation(category, percentage) {
    const recommendations = {
        Body: {
            low: {
                priority: 'high',
                title: 'Increase Physical Activity',
                description: 'Consider starting with 15-20 minutes of daily exercise and gradually increase. Walking, swimming, or yoga are great starting points.'
            },
            medium: {
                priority: 'medium',
                title: 'Maintain Your Fitness Routine',
                description: 'You\'re doing well! Try adding variety to your workouts to target different muscle groups and prevent plateaus.'
            },
            high: {
                priority: 'low',
                title: 'Excellent Fitness Level',
                description: 'Keep up the great work! Consider challenging yourself with advanced exercises or new fitness goals.'
            }
        },
        Mind: {
            low: {
                priority: 'high',
                title: 'Focus on Stress Management',
                description: 'Try incorporating 10 minutes of daily meditation or deep breathing exercises. Consider our guided meditation sessions.'
            },
            medium: {
                priority: 'medium',
                title: 'Enhance Mental Wellness',
                description: 'You\'re on the right track! Try exploring different mindfulness techniques or journaling to further reduce stress.'
            },
            high: {
                priority: 'low',
                title: 'Strong Mental Health',
                description: 'Your mental wellness practices are excellent! Consider helping others by sharing your techniques.'
            }
        },
        Nutrition: {
            low: {
                priority: 'high',
                title: 'Improve Eating Habits',
                description: 'Focus on regular meal times and include more fruits and vegetables. Start with small changes like adding one healthy meal per day.'
            },
            medium: {
                priority: 'medium',
                title: 'Optimize Your Diet',
                description: 'Good nutrition habits! Try meal planning to ensure balanced nutrition throughout the week.'
            },
            high: {
                priority: 'low',
                title: 'Excellent Nutrition',
                description: 'Your diet is well-balanced! Consider exploring new healthy recipes to keep things interesting.'
            }
        },
        Lifestyle: {
            low: {
                priority: 'high',
                title: 'Improve Sleep & Habits',
                description: 'Aim for 7-8 hours of sleep. Establish a bedtime routine and limit screen time before bed.'
            },
            medium: {
                priority: 'medium',
                title: 'Fine-tune Your Lifestyle',
                description: 'You have good habits! Focus on consistency and consider adding relaxation time to your daily schedule.'
            },
            high: {
                priority: 'low',
                title: 'Healthy Lifestyle',
                description: 'Your lifestyle choices are excellent! Maintain your healthy habits and inspire others around you.'
            }
        }
    };

    const level = percentage < 50 ? 'low' : percentage < 75 ? 'medium' : 'high';
    return {
        category,
        icon: getCategoryIcon(category),
        ...recommendations[category][level]
    };
}

function getCategoryIcon(category) {
    switch (category) {
        case 'Body': return 'fitness_center';
        case 'Mind': return 'psychology';
        case 'Nutrition': return 'restaurant';
        case 'Lifestyle': return 'bedtime';
        default: return 'info';
    }
}

/**
 * Helper function to generate personalized recommendations
 */
function generateRecommendations(categoryScores) {
    const recommendations = [];

    // Body recommendations
    const bodyScore = categoryScores.Body.percentage;
    if (bodyScore < 50) {
        recommendations.push({
            category: 'Body',
            priority: 'high',
            title: 'Increase Physical Activity',
            description: 'Consider starting with 15-20 minutes of daily exercise and gradually increase. Walking, swimming, or yoga are great starting points.',
            icon: 'fitness_center'
        });
    } else if (bodyScore < 75) {
        recommendations.push({
            category: 'Body',
            priority: 'medium',
            title: 'Maintain Your Fitness Routine',
            description: 'You\'re doing well! Try adding variety to your workouts to target different muscle groups and prevent plateaus.',
            icon: 'fitness_center'
        });
    } else {
        recommendations.push({
            category: 'Body',
            priority: 'low',
            title: 'Excellent Fitness Level',
            description: 'Keep up the great work! Consider challenging yourself with advanced exercises or new fitness goals.',
            icon: 'fitness_center'
        });
    }

    // Mind recommendations
    const mindScore = categoryScores.Mind.percentage;
    if (mindScore < 50) {
        recommendations.push({
            category: 'Mind',
            priority: 'high',
            title: 'Focus on Stress Management',
            description: 'Try incorporating 10 minutes of daily meditation or deep breathing exercises. Consider our guided meditation sessions.',
            icon: 'psychology'
        });
    } else if (mindScore < 75) {
        recommendations.push({
            category: 'Mind',
            priority: 'medium',
            title: 'Enhance Mental Wellness',
            description: 'You\'re on the right track! Try exploring different mindfulness techniques or journaling to further reduce stress.',
            icon: 'psychology'
        });
    } else {
        recommendations.push({
            category: 'Mind',
            priority: 'low',
            title: 'Strong Mental Health',
            description: 'Your mental wellness practices are excellent! Consider helping others by sharing your techniques.',
            icon: 'psychology'
        });
    }

    // Nutrition recommendations
    const nutritionScore = categoryScores.Nutrition.percentage;
    if (nutritionScore < 50) {
        recommendations.push({
            category: 'Nutrition',
            priority: 'high',
            title: 'Improve Eating Habits',
            description: 'Focus on regular meal times and include more fruits and vegetables. Start with small changes like adding one healthy meal per day.',
            icon: 'restaurant'
        });
    } else if (nutritionScore < 75) {
        recommendations.push({
            category: 'Nutrition',
            priority: 'medium',
            title: 'Optimize Your Diet',
            description: 'Good nutrition habits! Try meal planning to ensure balanced nutrition throughout the week.',
            icon: 'restaurant'
        });
    } else {
        recommendations.push({
            category: 'Nutrition',
            priority: 'low',
            title: 'Excellent Nutrition',
            description: 'Your diet is well-balanced! Consider exploring new healthy recipes to keep things interesting.',
            icon: 'restaurant'
        });
    }

    // Lifestyle recommendations
    const lifestyleScore = categoryScores.Lifestyle.percentage;
    if (lifestyleScore < 50) {
        recommendations.push({
            category: 'Lifestyle',
            priority: 'high',
            title: 'Improve Sleep & Habits',
            description: 'Aim for 7-8 hours of sleep. Establish a bedtime routine and limit screen time before bed. Consider reducing harmful habits gradually.',
            icon: 'bedtime'
        });
    } else if (lifestyleScore < 75) {
        recommendations.push({
            category: 'Lifestyle',
            priority: 'medium',
            title: 'Fine-tune Your Lifestyle',
            description: 'You have good habits! Focus on consistency and consider adding relaxation time to your daily schedule.',
            icon: 'bedtime'
        });
    } else {
        recommendations.push({
            category: 'Lifestyle',
            priority: 'low',
            title: 'Healthy Lifestyle',
            description: 'Your lifestyle choices are excellent! Maintain your healthy habits and inspire others around you.',
            icon: 'bedtime'
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

/**
 * @desc    Reset assessment (start over)
 * @route   DELETE /api/health-assessment/reset
 * @access  Private (User)
 */
router.delete('/reset', protect, async (req, res) => {
    try {
        await HealthAssessment.findOneAndDelete({ user: req.user.id });

        res.json({
            success: true,
            message: 'Assessment reset successfully'
        });
    } catch (error) {
        console.error('Reset assessment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Seed default questions (Admin only)
 * @route   POST /api/health-assessment/seed
 * @access  Private (Admin)
 */
router.post('/seed', protect, isAdmin, async (req, res) => {
    try {
        // Check if questions already exist
        const existing = await HealthQuestion.countDocuments();
        if (existing > 0) {
            return res.status(400).json({
                success: false,
                message: 'Questions already exist. Delete them first to reseed.'
            });
        }

        const defaultQuestions = [
            // Body
            { category: 'Body', questionNumber: 1, questionText: 'What is your primary fitness goal?', options: ['Weight Loss', 'Muscle Gain', 'General Health', 'Endurance'], order: 1 },
            { category: 'Body', questionNumber: 2, questionText: 'How many days per week can you exercise?', options: ['1-2 days', '3-4 days', '5-6 days', 'Everyday'], order: 2 },
            // Mind
            { category: 'Mind', questionNumber: 1, questionText: 'How would you rate your daily stress levels?', options: ['Low', 'Moderate', 'High', 'Very High'], order: 1 },
            { category: 'Mind', questionNumber: 2, questionText: 'Do you practice meditation or mindfulness?', options: ['Daily', 'Sometimes', 'Rarely', 'Never'], order: 2 },
            // Nutrition
            { category: 'Nutrition', questionNumber: 1, questionText: 'How many meals do you eat per day?', options: ['2 meals', '3 meals', '4-5 meals', 'Irregular'], order: 1 },
            { category: 'Nutrition', questionNumber: 2, questionText: 'Do you follow any specific diet?', options: ['Vegan', 'Keto', 'Vegetarian', 'None'], order: 2 },
            // Lifestyle
            { category: 'Lifestyle', questionNumber: 1, questionText: 'How many hours of sleep do you get?', options: ['Less than 5', '5-6 hours', '7-8 hours', 'More than 8'], order: 1 },
            { category: 'Lifestyle', questionNumber: 2, questionText: 'Do you smoke or consume alcohol?', options: ['Frequently', 'Occasionally', 'Rarely', 'Never'], order: 2 },
        ];

        await HealthQuestion.insertMany(defaultQuestions);

        res.status(201).json({
            success: true,
            message: `Seeded ${defaultQuestions.length} default questions`,
            count: defaultQuestions.length
        });
    } catch (error) {
        console.error('Seed questions error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// ADMIN: User Assessment Management
// ============================================

/**
 * @desc    Get all user assessments with scores (Admin only)
 * @route   GET /api/health-assessment/admin/assessments
 * @access  Private (Admin)
 */
router.get('/admin/assessments', protect, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, completed } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (completed === 'true') query.isComplete = true;
        if (completed === 'false') query.isComplete = false;

        const assessments = await HealthAssessment.find(query)
            .populate('user', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await HealthAssessment.countDocuments(query);

        // Get all questions for score calculation
        const questions = await HealthQuestion.find({ isActive: true });
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        // Calculate scores for each assessment
        const assessmentsWithScores = assessments.map(assessment => {
            const categoryScores = {
                Body: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
                Mind: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
                Nutrition: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 },
                Lifestyle: { totalScore: 0, maxScore: 0, answeredCount: 0, percentage: 0 }
            };

            assessment.answers.forEach(answer => {
                const question = questionMap[answer.question.toString()];
                if (!question) return;

                const category = question.category;
                const optionScores = question.optionScores || [];

                let score = 0;
                if (optionScores.length > 0 && optionScores[answer.selectedOption] !== undefined) {
                    score = optionScores[answer.selectedOption];
                } else {
                    score = answer.selectedOption;
                }

                let maxScore = 0;
                if (optionScores.length > 0) {
                    maxScore = Math.max(...optionScores);
                } else {
                    maxScore = question.options.length - 1;
                }

                if (categoryScores[category]) {
                    categoryScores[category].totalScore += score;
                    categoryScores[category].maxScore += maxScore;
                    categoryScores[category].answeredCount += 1;
                }
            });

            // Calculate percentages
            Object.keys(categoryScores).forEach(category => {
                const cat = categoryScores[category];
                if (cat.maxScore > 0) {
                    cat.percentage = Math.round((cat.totalScore / cat.maxScore) * 100);
                }
            });

            const totalScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.totalScore, 0);
            const maxScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.maxScore, 0);
            const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

            let healthLevel = 'Excellent';
            if (overallPercentage < 40) healthLevel = 'Needs Improvement';
            else if (overallPercentage < 60) healthLevel = 'Fair';
            else if (overallPercentage < 80) healthLevel = 'Good';

            return {
                _id: assessment._id,
                user: assessment.user,
                overallScore: {
                    percentage: overallPercentage,
                    level: healthLevel
                },
                categoryScores,
                answeredCount: assessment.answers.length,
                isComplete: assessment.isComplete,
                completedAt: assessment.completedAt,
                createdAt: assessment.createdAt,
                updatedAt: assessment.updatedAt
            };
        });

        res.json({
            success: true,
            data: assessmentsWithScores,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get admin assessments error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get assessment statistics (Admin only)
 * @route   GET /api/health-assessment/admin/stats
 * @access  Private (Admin)
 */
router.get('/admin/stats', protect, isAdmin, async (req, res) => {
    try {
        const totalAssessments = await HealthAssessment.countDocuments();
        const completedAssessments = await HealthAssessment.countDocuments({ isComplete: true });
        const inProgressAssessments = await HealthAssessment.countDocuments({ isComplete: false });
        const totalQuestions = await HealthQuestion.countDocuments({ isActive: true });

        // Get assessments from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentAssessments = await HealthAssessment.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Questions per category
        const questionsByCategory = await HealthQuestion.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                totalAssessments,
                completedAssessments,
                inProgressAssessments,
                completionRate: totalAssessments > 0
                    ? Math.round((completedAssessments / totalAssessments) * 100)
                    : 0,
                totalQuestions,
                recentAssessments,
                questionsByCategory: questionsByCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get assessment stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;

