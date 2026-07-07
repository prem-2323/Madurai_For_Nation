const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radius: { type: Number, required: true },
  reportCount: { type: Number, required: true },
  averageAQI: { type: Number, required: true },
  averageConfidence: { type: Number, required: true },
  highestSeverity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  risk: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  dominantPollution: { type: String, required: true },
  recommendedAction: { type: String, required: true },
  assignedTeam: { type: String, default: null },
  location: { type: String, default: '' },
  sourceReportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hotspot', hotspotSchema);

