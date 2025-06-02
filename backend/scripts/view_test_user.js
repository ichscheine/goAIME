/**
 * Script to view test_user_good_performer data from MongoDB Atlas
 * Run with: node view_test_user.js
 */

// Import required packages
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import mongoose
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');

// Get MongoDB Atlas URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Verify MongoDB URI
if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in .env file.');
  console.log('Please make sure your .env file contains the MONGODB_URI variable.');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

// Connect to MongoDB Atlas 
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to view test user data
const viewTestUser = async () => {
  try {
    // Username to find
    const testUsername = 'test_user_good_performer';
    
    // Find the test user
    console.log(`Looking for user: ${testUsername}`);
    const user = await User.findOne({ username: testUsername });
    
    if (!user) {
      console.log(`User '${testUsername}' not found in the database.`);
      
      // Show available users
      const users = await User.find({}, 'username');
      console.log('\nAvailable users in the database:');
      users.forEach(u => console.log(`- ${u.username}`));
      
      return { exists: false };
    }
    
    console.log(`\n✅ User found: ${user.username} (${user._id})`);
    
    // Count sessions for this user
    const sessionCount = await Session.countDocuments({ user: user._id });
    console.log(`Sessions: ${sessionCount}`);
    
    // Count problems for this user
    const problemCount = await Problem.countDocuments({ user: user._id });
    console.log(`Problems: ${problemCount}`);
    
    if (sessionCount === 0) {
      console.log('No sessions found for this user.');
      return { exists: true, hasSessions: false };
    }
    
    // Get session details
    const sessions = await Session.find({ user: user._id }).sort({ completedAt: -1 });
    
    console.log('\n📊 Session Details:');
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.contest} ${session.year || ''} (${session.mode})`);
      console.log(`   Date: ${session.completedAt.toLocaleString()}`);
      console.log(`   Score: ${session.score}/${session.totalAttempted}`);
      console.log(`   Accuracy: ${session.accuracy.toFixed(2)}%`);
      console.log(`   Avg Time: ${session.averageTimePerProblem?.toFixed(2) || 'N/A'}s`);
    });
    
    // Get topic performance (aggregate data)
    console.log('\n📊 Topic Performance:');
    const topicStats = await Problem.aggregate([
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
      { $sort: { accuracy: -1 } }
    ]);
    
    if (topicStats.length > 0) {
      topicStats.forEach(topic => {
        console.log(`   ${topic._id || 'Unknown'}: ${topic.correct}/${topic.attempted} correct (${topic.accuracy.toFixed(1)}%)`);
      });
    } else {
      console.log('   No topic data available');
    }
    
    // Get difficulty performance (aggregate data)
    console.log('\n📊 Difficulty Performance:');
    const difficultyStats = await Problem.aggregate([
      { $match: { user: user._id } },
      { $group: {
          _id: "$difficulty",
          attempted: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] } }
        }
      },
      { $project: {
          difficulty: "$_id",
          attempted: 1,
          correct: 1,
          accuracy: { $multiply: [{ $divide: ["$correct", "$attempted"] }, 100] }
        }
      },
      { $sort: { difficulty: 1 } }
    ]);
    
    if (difficultyStats.length > 0) {
      difficultyStats.forEach(diff => {
        console.log(`   ${diff._id || 'Unknown'}: ${diff.correct}/${diff.attempted} correct (${diff.accuracy.toFixed(1)}%)`);
      });
    } else {
      console.log('   No difficulty data available');
    }
    
    return { 
      exists: true, 
      hasSessions: true,
      sessionCount,
      problemCount,
      topicCount: topicStats.length,
      difficultyCount: difficultyStats.length
    };
    
  } catch (error) {
    console.error('Error viewing test user:', error);
    return { error: error.message };
  }
};

// Run the function and handle the results
viewTestUser()
  .then(result => {
    if (result.exists && result.hasSessions) {
      console.log('\n✅ Test user exists with data and can be used for testing the wind rose chart.');
    } else if (result.exists) {
      console.log('\n⚠️ Test user exists but has no sessions. The wind rose chart may not display properly.');
    } else {
      console.log('\n❌ Test user does not exist. Please run the create_test_user.js script first.');
    }
    
    // Disconnect from MongoDB
    mongoose.disconnect()
      .then(() => console.log('\nDisconnected from MongoDB Atlas'))
      .catch(err => console.error('Error disconnecting:', err))
      .finally(() => process.exit(0));
  })
  .catch(error => {
    console.error('Script failed:', error);
    mongoose.disconnect()
      .finally(() => process.exit(1));
  });
