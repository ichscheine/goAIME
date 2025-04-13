d/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  preferences: {
    skin: { type: String, default: 'default' },
    showFeedback: { type: Boolean, default: true }
  },
  sessions: [{
    date: { type: Date, default: Date.now },
    mode: String,
    contest: String,
    year: Number,
    score: Number,
    attempted: Number,
    timeSpent: Number,
    attemptRecords: [{
      problem_number: String,
      correct: Boolean,
      timeSpent: Number
    }],
    incorrectProblems: [{
      problem_number: String,
      year: Number,
      contest: String
    }]
  }],
  assets: {
    sounds: {
      correct: String,
      incorrect: String
    },
    images: {
      correct: String,
      incorrect: String
    }
  }
});

module.exports = mongoose.model('User', userSchema);