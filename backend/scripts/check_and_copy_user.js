/**
 * Script to check if test_user_good_performer exists and create it by copying goAmy's data
 * Run with: node check_and_copy_user.js
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
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Generate hashed password
const generateHashedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Main function to check and copy data
const checkAndCopyUser = async () => {
  try {
    console.log('\n=== DIAGNOSTIC CHECK ===');
    
    // 1. Check total session count in the database
    const totalSessions = await Session.countDocuments({});
    console.log(`Total sessions in database: ${totalSessions}`);
    
    // 2. Check if source user (goAmy) exists
    const sourceUser = await User.findOne({ username: 'goamy' });
    if (!sourceUser) {
      console.error("Error: Source user 'goamy' not found in the database.");
      return;
    }
    console.log(`Source user 'goamy' found with ID: ${sourceUser._id}`);
    
    // 3. Count goAmy's sessions
    const sourceSessions = await Session.countDocuments({ user: sourceUser._id });
    console.log(`goamy has ${sourceSessions} sessions in the database.`);
    
    // 4. Check if test user already exists
    const testUsername = 'test_user_good_performer';
    const existingUser = await User.findOne({ username: testUsername });
    
    if (existingUser) {
      console.log(`Test user '${testUsername}' exists with ID: ${existingUser._id}`);
      
      // 5. Count test user's sessions
      const testSessions = await Session.countDocuments({ user: existingUser._id });
      console.log(`${testUsername} has ${testSessions} sessions in the database.`);
      
      // 6. Delete existing user if requested
      console.log('Deleting existing test user and all related data...');
      
      // Delete problems first
      const deletedProblems = await Problem.deleteMany({ user: existingUser._id });
      console.log(`Deleted ${deletedProblems.deletedCount} problems.`);
      
      // Delete sessions
      const deletedSessions = await Session.deleteMany({ user: existingUser._id });
      console.log(`Deleted ${deletedSessions.deletedCount} sessions.`);
      
      // Delete user
      await User.deleteOne({ _id: existingUser._id });
      console.log(`Deleted test user.`);
    } else {
      console.log(`Test user '${testUsername}' does not exist yet.`);
    }
    
    // 7. Create the test user
    console.log('\n=== CREATING NEW TEST USER ===');
    const newUser = new User({
      username: testUsername,
      email: 'test_good@example.com',
      password: await generateHashedPassword('test123'),
      role: 'student',
      createdAt: new Date()
    });
    
    const savedUser = await newUser.save();
    console.log(`Created test user with ID: ${savedUser._id}`);
    
    // 8. Get all goAmy's sessions
    console.log('\n=== COPYING SESSIONS AND PROBLEMS ===');
    const goAmySessions = await Session.find({ user: sourceUser._id });
    console.log(`Found ${goAmySessions.length} sessions to copy.`);
    
    let copiedSessionCount = 0;
    let copiedProblemCount = 0;
    
    // 9. Copy each session and its problems
    for (const sourceSession of goAmySessions) {
      try {
        // Create a new session document based on source session
        const newSession = new Session({
          user: savedUser._id,
          contest: sourceSession.contest,
          year: sourceSession.year,
          mode: sourceSession.mode,
          problems: [], // Will be populated after copying problems
          completed: sourceSession.completed,
          completedAt: sourceSession.completedAt,
          // Keep the basic session data but will update metrics later
          score: sourceSession.score,
          totalAttempted: sourceSession.totalAttempted,
          accuracy: sourceSession.accuracy,
          averageTimePerProblem: sourceSession.averageTimePerProblem
        });
        
        const savedSession = await newSession.save();
        copiedSessionCount++;
        
        // 10. Find source problems for this session
        const sourceProblems = await Problem.find({ session: sourceSession._id });
        
        if (sourceProblems.length > 0) {
          let correctCount = 0;
          let totalTime = 0;
          
          // Create an array to hold the new problems
          const newProblems = [];
          
          // 11. Copy and improve each problem
          for (const sourceProblem of sourceProblems) {
            // Determine if this problem should be marked as correct (70% of the time)
            // If it was already correct, keep it correct
            const makeCorrect = sourceProblem.isCorrect || Math.random() < 0.7;
            
            // Improved time for correct answers
            const timeSpent = makeCorrect ? 
              Math.max(5, sourceProblem.timeSpent * 0.7) : // 30% faster for correct answers
              sourceProblem.timeSpent;
            
            // Track metrics for session update
            if (makeCorrect) correctCount++;
            totalTime += timeSpent;
            
            // Create the new problem with improvements
            newProblems.push({
              session: savedSession._id,
              user: savedUser._id,
              problemNumber: sourceProblem.problemNumber,
              topic: sourceProblem.topic || 'General', // Default if missing
              difficulty: sourceProblem.difficulty || 'Medium', // Default if missing
              userAnswer: makeCorrect ? sourceProblem.correctAnswer : sourceProblem.userAnswer,
              correctAnswer: sourceProblem.correctAnswer,
              isCorrect: makeCorrect,
              timeSpent: timeSpent
            });
          }
          
          // 12. Save all problems in one batch
          if (newProblems.length > 0) {
            const savedProblems = await Problem.insertMany(newProblems);
            copiedProblemCount += savedProblems.length;
            
            // 13. Update session with problem IDs and recalculated metrics
            savedSession.problems = savedProblems.map(p => p._id);
            savedSession.score = correctCount;
            savedSession.accuracy = (correctCount / savedProblems.length) * 100;
            savedSession.averageTimePerProblem = totalTime / savedProblems.length;
            await savedSession.save();
            
            console.log(`Copied session ${copiedSessionCount} with ${savedProblems.length} problems. ` +
                      `New accuracy: ${savedSession.accuracy.toFixed(2)}%`);
          }
        } else {
          console.log(`Session ${copiedSessionCount} had no problems to copy.`);
        }
      } catch (error) {
        console.error(`Error copying session: ${error.message}`);
      }
    }
    
    // 14. Verify final counts
    const finalSessionCount = await Session.countDocuments({ user: savedUser._id });
    const finalProblemCount = await Problem.countDocuments({ user: savedUser._id });
    const totalSessionsAfter = await Session.countDocuments({});
    
    console.log('\n=== RESULTS ===');
    console.log(`Total sessions before: ${totalSessions}`);
    console.log(`Total sessions after: ${totalSessionsAfter}`);
    console.log(`Created ${finalSessionCount} sessions for test user.`);
    console.log(`Created ${finalProblemCount} problems for test user.`);
    console.log(`\nYou can now log in with:`);
    console.log(`Username: ${testUsername}`);
    console.log(`Password: test123`);
    
    return {
      success: true,
      sessionCount: finalSessionCount,
      problemCount: finalProblemCount
    };
  } catch (error) {
    console.error('Error in check and copy process:', error);
    return { success: false, error: error.message };
  }
};

// Run the script
checkAndCopyUser()
  .then(result => {
    if (result && result.success) {
      console.log('Script completed successfully.');
    } else {
      console.log('Script completed with errors.');
    }
    
    // Disconnect from MongoDB
    mongoose.disconnect()
      .then(() => console.log('MongoDB disconnected'))
      .finally(() => process.exit(0));
  })
  .catch(error => {
    console.error('Script failed:', error);
    mongoose.disconnect()
      .finally(() => process.exit(1));
  });
