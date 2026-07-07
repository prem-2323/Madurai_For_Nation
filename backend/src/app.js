const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/mongodb');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/reports', require('./routes/report'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/alerts', require('./routes/alert'));
app.use('/api/prediction', require('./routes/prediction'));
app.use('/api/users', require('./routes/users'));
app.use('/api/hotspots', require('./routes/hotspot'));

if (!process.env.VERCEL) {
  const frontendDist = path.join(__dirname, '../../Frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

module.exports = app;
