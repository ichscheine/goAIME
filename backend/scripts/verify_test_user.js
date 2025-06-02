/**
 * Script to verify if test_user_good_performer exists in the database
 * Run with: node verify_test_user.js
 */

const mongoose = require('mongoose');
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
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Username to verify
const usernameToVerify = 'test_user_good_performer';

// Function to verify user existence and fetch a sample session
const verifyUser = async () => {
  try {
    // Check if user exists
    console.log(`Looking for user: ${usernameToVerify}`);
    const user = await User.findOne({ username: usernameToVerify });
    
    if (!user) {
      console.error(`User '${usernameToVerify}' not found in the database!`);
      console.log('Try running the create_test_user.js script first.');
      return;
    }
    
    console.log(`\n✅ USER FOUND:`);
    console.log(`ID: ${user._id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Created: ${user.createdAt}`);
    
    // Count sessions for this user
    const sessionCount = await Session.countDocuments({ user: user._id });
    console.log(`\nSession count: ${sessionCount}`);
    
    if (sessionCount === 0) {
      console.log('No sessions found for this user.');
      return;
    }
    
    // Fetch a sample session
    const session = await Session.findOne({ user: user._id });
    
    console.log(`\n✅ SAMPLE SESSION:`);
    console.log(`ID: ${session._id}`);
    console.log(`Contest: ${session.contest} ${session.year}`);
    console.log(`Mode: ${session.mode}`);
    console.log(`Completed: ${session.completed}`);
    console.log(`Completed At: ${session.completedAt}`);
    console.log(`Score: ${session.score}`);
    console.log(`Total Attempted: ${session.totalAttempted}`);
    console.log(`Accuracy: ${session.accuracy}%`);
    console.log(`Average Time Per Problem: ${session.averageTimePerProblem}s`);
    
    // Count problems associated with this session
    const problemCount = await Problem.countDocuments({ session: session._id });
    console.log(`Problems in this session: ${problemCount}`);
    
    // Fetch a sample problem
    if (problemCount > 0) {
      const problem = await Problem.findOne({ session: session._id });
      
      console.log(`\n✅ SAMPLE PROBLEM:`);
      console.log(`ID: ${problem._id}`);
      console.log(`Number: ${problem.problemNumber}`);
      console.log(`Topic: ${problem.topic}`);
      console.log(`Difficulty: ${problem.difficulty}`);
      console.log(`Is Correct: ${problem.isCorrect}`);
      console.log(`Time Spent: ${problem.timeSpent}s`);
    }
    
    // Get topic performance summary
    console.log(`\n✅ TOPIC PERFORMANCE SUMMARY:`);
    const topics = await Problem.aggregate([
      { $match: { user: user._id } },
      { $group: {
          _id: "$topic",
          attempted: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] } }
        }
      },
      { $project: {
          topic: "$_id",
          attempted: 1,
          correct: 1,
          accuracy: { $multiply: [{ $divide: ["$correct", "$attempted"] }, 100] }
        }
      },
      { $sort: { attempted: -1 } }
    ]);
    
    topics.forEach(topic => {
      console.log(`${topic._id}: ${topic.correct}/${topic.attempted} correct (${topic.accuracy.toFixed(1)}%)`);
    });

  } catch (error) {
    console.error('Error verifying user:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  }
};

// Run the verification
verifyUser();
