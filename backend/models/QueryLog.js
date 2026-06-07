const mongoose = require('mongoose');

const QueryLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  matchedDeployments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deployment',
    },
  ],
  score: {
    type: Number,
    default: 1.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QueryLog', QueryLogSchema);
