const mongoose = require('mongoose');

const tempSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'alive' }
}, { versionKey: false });

module.exports = mongoose.model('Temp', tempSchema);
