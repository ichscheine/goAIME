/**
 * Script to create a test user with improved performance by copying and modifying goAmy's data
 * Run with: node create_improved_test_user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Verify MongoDB URI
if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in .env file.');
  console.log('Please make sure your .env file contains the MONGODB_URI variable.');
  process.exit(1);
}

console.log(`Attempting to connect to MongoDB Atlas...`);

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Check if your MONGODB_URI in .env is correct and your IP is whitelisted in MongoDB Atlas.');
  process.exit(1);
});

// Generate hashed password
const generateHashedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Define test user data
const testUser = {
  username: 'test_user_good_performer',
  email: 'test_good@example.com',
  password: 'test123',
  role: 'student',
  createdAt: new Date()
};

// Main function to create test user with improved data from goAmy
const createImprovedTestUser = async () => {
  try {
    console.log('Starting improved test user creation process...');
    
    // Check if User model is properly loaded
    if (!User || !User.findOne) {
      throw new Error('User model not properly loaded. Check model imports.');
    }
    
    // 1. Find goAmy user to copy data from
    console.log('Looking for goAmy user to copy data from...');
    const sourceUser = await User.findOne({ username: 'goamy' });
    
    if (!sourceUser) {
      throw new Error("Source user 'goAmy' not found. Cannot proceed without source data.");
    }
    
    console.log(`Found source user goAmy with ID: ${sourceUser._id}`);
    
    // 2. Check if test user already exists and remove if needed
    console.log('Checking if test user already exists...');
    const existingUser = await User.findOne({ username: testUser.username });
    
    if (existingUser) {
      console.log(`Test user '${testUser.username}' already exists with ID: ${existingUser._id}`);
      console.log('Deleting existing user and related data to create fresh test data...');
      
      // Delete existing problems and sessions for this user
      await Problem.deleteMany({ user: existingUser._id });
      await Session.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      
      console.log('Existing user data deleted successfully.');
    }
    
    // 3. Create new test user
    console.log('Creating new test user...');
    const hashedPassword = await generateHashedPassword(testUser.password);
    const newUser = new User({
      ...testUser,
      password: hashedPassword
    });
    
    const savedUser = await newUser.save();
    console.log(`Created test user: ${savedUser.username} with ID: ${savedUser._id}`);
    
    // 4. Get all sessions from goAmy
    console.log('Fetching sessions from goAmy...');
    const sourceSessions = await Session.find({ user: sourceUser._id });
    
    if (sourceSessions.length === 0) {
      throw new Error("No sessions found for goAmy. Cannot proceed without session data.");
    }
    
    console.log(`Found ${sourceSessions.length} sessions to copy from goAmy.`);
    
    // 5. Copy and modify sessions for the new user
    console.log('Copying and improving sessions for test user...');
    let sessionCount = 0;
    let totalProblemCount = 0;
    
    for (const sourceSession of sourceSessions) {
      // Create a new session based on the source session
      const newSession = new Session({
        user: savedUser._id,
        contest: sourceSession.contest,
        year: sourceSession.year,
        mode: sourceSession.mode,
        problems: [], // Will be populated later
        completed: sourceSession.completed,
        completedAt: sourceSession.completedAt,
        score: sourceSession.score,
        totalAttempted: sourceSession.totalAttempted,
        accuracy: sourceSession.accuracy,
        averageTimePerProblem: sourceSession.averageTimePerProblem
      });
      
      const savedSession = await newSession.save();
      sessionCount++;
      
      // 6. Get problems for this session
      const sourceProblems = await Problem.find({ session: sourceSession._id });
      
      if (sourceProblems.length > 0) {
        // 7. Copy and improve problems (70% accuracy boost)
        const newProblems = sourceProblems.map(sourceProblem => {
          // Determine if this problem should be correct (70% chance for improved performance)
          const makeCorrect = Math.random() < 0.7;
          
          // If the problem was already correct, keep it correct
          // If it was wrong, we have a 70% chance to make it correct
          const isCorrect = sourceProblem.isCorrect ? true : makeCorrect;
          
          // Improved time spent for correct answers
          const timeSpent = isCorrect ? 
            Math.max(5, sourceProblem.timeSpent * 0.7) : // 30% faster for correct answers
            sourceProblem.timeSpent;
          
          return {
            session: savedSession._id,
            user: savedUser._id,
            problemNumber: sourceProblem.problemNumber,
            topic: sourceProblem.topic,
            difficulty: sourceProblem.difficulty,
            userAnswer: isCorrect ? sourceProblem.correctAnswer : sourceProblem.userAnswer,
            correctAnswer: sourceProblem.correctAnswer,
            isCorrect: isCorrect,
            timeSpent: timeSpent
          };
        });
        
        // Save the improved problems
        const savedProblems = await Problem.insertMany(newProblems);
        totalProblemCount += savedProblems.length;
        
        // Update the new session with problem IDs
        savedSession.problems = savedProblems.map(problem => problem._id);
        
        // Recalculate session metrics for accuracy and speed improvements
        const correctCount = savedProblems.filter(p => p.isCorrect).length;
        const accuracy = (correctCount / savedProblems.length) * 100;
        const averageTimePerProblem = savedProblems.reduce((sum, p) => sum + p.timeSpent, 0) / savedProblems.length;
        
        // Update session with improved metrics
        savedSession.accuracy = accuracy;
        savedSession.score = correctCount;
        savedSession.averageTimePerProblem = averageTimePerProblem;
        
        await savedSession.save();
        
        console.log(`Copied session ${sessionCount}/${sourceSessions.length} with ${savedProblems.length} problems (Accuracy: ${accuracy.toFixed(2)}%)`);
      } else {
        console.log(`Session ${sessionCount} had no problems to copy.`);
      }
    }
    
    // 8. Verify data was created
    const finalSessionCount = await Session.countDocuments({ user: savedUser._id });
    const finalProblemCount = await Problem.countDocuments({ user: savedUser._id });
    
    console.log(`\n=== TEST USER CREATED SUCCESSFULLY ===`);
    console.log(`Username: ${testUser.username}`);
    console.log(`Password: ${testUser.password}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Sessions created: ${finalSessionCount}`);
    console.log(`Problems created: ${finalProblemCount}`);
    console.log(`Average accuracy: ~70% (improved from goAmy's data)`);
    console.log(`=======================================\n`);
    
    return savedUser;
    
  } catch (error) {
    console.error('Error creating improved test user:', error);
    throw error;
  }
};

// Run the script with error handling
createImprovedTestUser()
  .then(() => {
    console.log('Script completed successfully.');
    mongoose.disconnect()
      .then(() => console.log('MongoDB disconnected'))
      .catch(err => console.error('Error disconnecting from MongoDB:', err))
      .finally(() => process.exit(0));
  })
  .catch(error => {
    console.error('Script failed:', error);
    mongoose.disconnect()
      .then(() => console.log('MongoDB disconnected'))
      .catch(err => console.error('Error disconnecting from MongoDB:', err))
      .finally(() => process.exit(1));
  });
