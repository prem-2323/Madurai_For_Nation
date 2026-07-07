const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  pollutionType: { type: String, required: true },
  location: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  AQI: { type: Number, required: true },
  predictedAQI: { type: Number, required: true },
  confidence: { type: Number, required: true },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  reason: { type: String, required: true },
  suggestedAction: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  assignedTeam: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
