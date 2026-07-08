const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/mongodb');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Madurai For Nation Backend API is running'
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/reports', require('./routes/report'));
app.use('/api/officer', require('./routes/officer'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/alerts', require('./routes/alert'));
app.use('/api/prediction', require('./routes/prediction'));
app.use('/api/hotspots', require('./routes/hotspot'));
app.use('/api/usage', require('./routes/usage'));

module.exports = app;
