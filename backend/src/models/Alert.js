const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  location: { type: String, required: true, trim: true },
  pollutionType: { type: String, required: true },
  aqi: { type: Number, required: true },
  predictedAQI: { type: Number, required: true },
  severity: { type: Number, required: true }, // 0-100 percentage
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  reason: { type: String, required: true },
  suggestedAction: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
