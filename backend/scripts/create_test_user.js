/**
 * Script to create a test user with good performance metrics
 * Run with: node create_test_user.js
 */

// First check if required packages are installed
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Check if the dependencies are installed in node_modules
const checkDependencies = () => {
  const requiredDeps = ['mongoose', 'bcryptjs', 'dotenv'];
  const missingDeps = [];
  
  console.log('Checking required dependencies...');
  
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} is installed`);
    } catch (e) {
      console.log(`❌ ${dep} is not installed`);
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.log(`Installing missing dependencies: ${missingDeps.join(', ')}...`);
    try {
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Failed to install dependencies:', error.message);
      process.exit(1);
    }
  }
};

// Run the dependency check
checkDependencies();

// Make sure to load dotenv before requiring any other modules
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Now we can safely require these modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');

// Get MongoDB Atlas URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Check if .env is loaded correctly
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- MONGODB_URI:', MONGODB_URI ? 'Found (URI hidden for security)' : 'Not found');

// Verify MongoDB URI
if (!MONGODB_URI) {
  console.error('ERROR: MongoDB URI is not defined in .env file.');
  console.log('\nPlease check the following:');
  console.log('1. Make sure .env file exists in the backend directory');
  console.log('2. .env file should contain a line like: MONGODB_URI=mongodb+srv://...');
  console.log('3. You might need to set the path manually. Current .env path search:', path.resolve(__dirname, '../.env'));
  
  // Last resort - manually prompt for URI
  console.log('\nAs a last resort, you can manually enter your MongoDB Atlas connection string:');
  
  // We won't actually prompt as that would require additional modules,
  // but provide clear instructions on how to run the script with the URI
  console.log('\nRun this script with the MongoDB URI as an environment variable:');
  console.log('MONGODB_URI=mongodb+srv://your-connection-string node scripts/create_test_user.js');
  
  process.exit(1);
}

console.log(`\nAttempting to connect to MongoDB Atlas...`);

// Connect to MongoDB Atlas with better error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000 // Increased timeout for Atlas connection
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('\nPossible issues:');
  console.log('1. The MongoDB Atlas connection string may be incorrect');
  console.log('2. Your IP address may not be whitelisted in MongoDB Atlas');
  console.log('3. Network connectivity issues may be preventing the connection');
  console.log('4. Atlas cluster may be paused or unavailable');
  
  console.log('\nTo debug:');
  console.log('1. Check if you can connect to MongoDB Atlas using MongoDB Compass');
  console.log('2. Verify your connection string is correct');
  console.log('3. Make sure your IP is whitelisted in Atlas Network Access settings');
  
  process.exit(1);
});

// Generate hashed password
const generateHashedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Define test user data with a simpler password for testing
const testUser = {
  username: 'test_user_good_performer',
  email: 'test_good@example.com',
  password: 'test123', // Simpler password for testing
  role: 'student',
  createdAt: new Date()
};

// Define topics with varied performance levels
const topics = [
  { name: 'Algebra', accuracy: 92, attempted: 25, correct: 23 },
  { name: 'Geometry', accuracy: 88, attempted: 32, correct: 28 },
  { name: 'Number Theory', accuracy: 85, attempted: 20, correct: 17 },
  { name: 'Probability', accuracy: 75, attempted: 16, correct: 12 },
  { name: 'Combinatorics', accuracy: 70, attempted: 10, correct: 7 },
  { name: 'Trigonometry', accuracy: 95, attempted: 18, correct: 17 },
  { name: 'Calculus', accuracy: 82, attempted: 22, correct: 18 },
  { name: 'Logic', accuracy: 90, attempted: 15, correct: 13 }
];

// Define difficulty performance levels
const difficulties = [
  { name: 'Easy', accuracy: 95, attempted: 50, correct: 47 },
  { name: 'Medium', accuracy: 82, attempted: 60, correct: 49 },
  { name: 'Hard', accuracy: 68, attempted: 48, correct: 32 }
];

// Create some session dates for trend data
const createSessionDates = (count) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * 5)); // Sessions every 5 days
    dates.push(date);
  }
  
  return dates;
};

// Create session data with good performance metrics
const createSessionData = (userId) => {
  const sessionDates = createSessionDates(8);
  const sessions = [];
  
  sessionDates.forEach((date, index) => {
    // Make slight variations in performance over time
    const baseAccuracy = 85 - (index % 3) * 2; // Small variance in accuracy
    const baseSpeed = 12 + (index % 4); // Small variance in speed
    
    sessions.push({
      user: userId,
      contest: `AMC ${10 + (index % 2) * 2}`,
      year: 2020 - (index % 5),
      mode: index % 2 === 0 ? 'Practice' : 'Test',
      problems: [], // Will be populated later
      completed: true,
      completedAt: date,
      score: 10 + (index % 4),
      totalAttempted: 15,
      accuracy: baseAccuracy,
      averageTimePerProblem: baseSpeed
    });
  });
  
  return sessions;
};

// Create problem attempts for each session
const createProblemAttempts = (sessionId, userId, count) => {
  const problems = [];
  
  // Use a mix of topics and difficulties for varied data
  for (let i = 0; i < count; i++) {
    const topicIndex = i % topics.length;
    const difficultyIndex = i % difficulties.length;
    
    const isCorrect = Math.random() < (topics[topicIndex].accuracy / 100);
    
    problems.push({
      session: sessionId,
      user: userId,
      problemNumber: i + 1,
      topic: topics[topicIndex].name,
      difficulty: difficulties[difficultyIndex].name,
      userAnswer: isCorrect ? 'A' : 'B', // Simplified
      correctAnswer: 'A', // Simplified
      isCorrect: isCorrect,
      timeSpent: topics[topicIndex].accuracy > 85 ? 10 + Math.random() * 5 : 15 + Math.random() * 10 // Better performers are faster
    });
  }
  
  return problems;
};

// Define a function to copy from goAmy to a new test user
const copyFromGoAmy = async (savedUser) => {
  try {
    // Find goAmy user
    console.log('Looking for goAmy to copy data from...');
    const sourceUser = await User.findOne({ username: 'goamy' });
    
    if (!sourceUser) {
      console.log('Source user goAmy not found. Will use generated data instead.');
      return false;
    }
    
    console.log(`Found goAmy with ID: ${sourceUser._id}`);
    
    // Get goAmy's sessions
    const sourceSessions = await Session.find({ user: sourceUser._id });
    
    if (sourceSessions.length === 0) {
      console.log('No sessions found for goAmy. Will use generated data instead.');
      return false;
    }
    
    console.log(`Found ${sourceSessions.length} sessions from goAmy to copy.`);
    
    // Copy each session
    let sessionCount = 0;
    for (const sourceSession of sourceSessions) {
      try {
        // Create a new session document based on the source
        const newSession = new Session({
          user: savedUser._id,
          contest: sourceSession.contest,
          year: sourceSession.year,
          mode: sourceSession.mode,
          problems: [],
          completed: sourceSession.completed,
          completedAt: sourceSession.completedAt,
          score: sourceSession.score,
          totalAttempted: sourceSession.totalAttempted,
          accuracy: sourceSession.accuracy,
          averageTimePerProblem: sourceSession.averageTimePerProblem
        });
        
        const savedSession = await newSession.save();
        sessionCount++;
        
        // Get the problems for this session
        const sourceProblems = await Problem.find({ session: sourceSession._id });
        
        if (sourceProblems.length > 0) {
          // Track metrics for recalculation
          let correctCount = 0;
          let totalTime = 0;
          const newProblems = [];
          
          // Copy and improve each problem
          for (const sourceProblem of sourceProblems) {
            // Make 70% of previously wrong answers correct
            const makeCorrect = sourceProblem.isCorrect || Math.random() < 0.7;
            
            // Improve speed for correct answers
            const timeSpent = makeCorrect ? 
              Math.max(5, sourceProblem.timeSpent * 0.7) : 
              sourceProblem.timeSpent;
            
            // Track for session metrics
            if (makeCorrect) correctCount++;
            totalTime += timeSpent;
            
            // Create the improved problem
            newProblems.push({
              session: savedSession._id,
              user: savedUser._id,
              problemNumber: sourceProblem.problemNumber,
              topic: sourceProblem.topic || 'General',
              difficulty: sourceProblem.difficulty || 'Medium',
              userAnswer: makeCorrect ? sourceProblem.correctAnswer : sourceProblem.userAnswer,
              correctAnswer: sourceProblem.correctAnswer,
              isCorrect: makeCorrect,
              timeSpent: timeSpent
            });
          }
          
          // Save all problems at once
          const savedProblems = await Problem.insertMany(newProblems);
          
          // Update session with problem references and improved metrics
          savedSession.problems = savedProblems.map(p => p._id);
          savedSession.score = correctCount;
          savedSession.accuracy = (correctCount / savedProblems.length) * 100;
          savedSession.averageTimePerProblem = totalTime / savedProblems.length;
          await savedSession.save();
          
          console.log(`Copied session ${sessionCount}/${sourceSessions.length} with ${savedProblems.length} problems. ` + 
                    `New accuracy: ${savedSession.accuracy.toFixed(2)}%`);
        }
      } catch (error) {
        console.error(`Error copying session ${sessionCount + 1}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error copying from goAmy:', error.message);
    return false;
  }
};

// Main function to create test user and data
const createTestUser = async () => {
  try {
    console.log('Starting test user creation process...');
    
    // Check if User model is properly loaded
    if (!User || !User.findOne) {
      throw new Error('User model not properly loaded. Check model imports.');
    }
    
    // Check if user already exists
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
    
    // Create new user
    console.log('Creating new test user...');
    const hashedPassword = await generateHashedPassword(testUser.password);
    const newUser = new User({
      ...testUser,
      password: hashedPassword
    });
    
    const savedUser = await newUser.save();
    console.log(`Created test user: ${savedUser.username} with ID: ${savedUser._id}`);
    
    // Verify user was created
    const verifyUser = await User.findOne({ username: testUser.username });
    if (!verifyUser) {
      throw new Error('User was not saved to database. Check MongoDB write permissions.');
    }
    console.log('User creation verified in database.');
    
    // First attempt to copy data from goAmy
    console.log('\nAttempting to copy data from goAmy user...');
    const copySuccess = await copyFromGoAmy(savedUser);
    
    // If copying failed, create synthetic data
    if (!copySuccess) {
      console.log('\nUsing synthetic data generation instead...');
      // Create sessions
      console.log('Creating test sessions...');
      const sessions = createSessionData(savedUser._id);
      
      let sessionCount = 0;
      for (const sessionData of sessions) {
        try {
          // Create a new session
          const newSession = new Session(sessionData);
          const savedSession = await newSession.save();
          sessionCount++;
          
          // Create problems for this session
          console.log(`Creating problems for session ${sessionCount}...`);
          const problems = createProblemAttempts(savedSession._id, savedUser._id, 15);
          
          // Save all problems
          const savedProblems = await Problem.insertMany(problems);
          
          // Update session with problem references
          savedSession.problems = savedProblems.map(p => p._id);
          
          // Calculate metrics
          const correctProblems = savedProblems.filter(p => p.isCorrect);
          const totalTime = savedProblems.reduce((sum, p) => sum + p.timeSpent, 0);
          
          savedSession.score = correctProblems.length;
          savedSession.totalAttempted = savedProblems.length;
          savedSession.accuracy = (correctProblems.length / savedProblems.length) * 100;
          savedSession.averageTimePerProblem = totalTime / savedProblems.length;
          
          await savedSession.save();
          
          console.log(`Created session ${sessionCount}/${sessions.length} with ${savedProblems.length} problems. ` + 
                      `Accuracy: ${savedSession.accuracy.toFixed(2)}%`);
        } catch (error) {
          console.error(`Error creating session ${sessionCount + 1}:`, error.message);
        }
      }
      
      console.log('\nSynthetic data creation completed successfully.');
    }
    
    console.log('\nTest user creation process completed!');
    console.log(`\nUser details:`);
    console.log(`- Username: ${testUser.username}`);
    console.log(`- Password: ${testUser.password}`);
    console.log(`- Email: ${testUser.email}`);
    
    // Get session count for confirmation
    const sessionCount = await Session.countDocuments({ user: savedUser._id });
    const problemCount = await Problem.countDocuments({ user: savedUser._id });
    
    console.log(`\nCreated a total of ${sessionCount} sessions with ${problemCount} problems.`);
    console.log('You can now log in with this test account to explore the application.');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    
  } catch (error) {
    console.error('Error in test user creation process:', error);
    process.exit(1);
  }
};

// Run the main function
createTestUser()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
