const mongoose = require('mongoose');

const geminiUsageSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 1500 }
}, { timestamps: true });

module.exports = mongoose.model('GeminiUsage', geminiUsageSchema);
