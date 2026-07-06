const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  location: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'moderate' },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'dismissed', 'resolved'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
