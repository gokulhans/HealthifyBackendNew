const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const HealthQuestion = require('./models/healthQuestion');

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

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await HealthQuestion.deleteMany({});
        console.log('Cleared existing questions');

        await HealthQuestion.insertMany(defaultQuestions);
        console.log(`Seeded ${defaultQuestions.length} questions`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
