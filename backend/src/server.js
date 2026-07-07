const app = require('./app');
const { startHeartbeat } = require('./services/heartbeatService');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startHeartbeat();
});
