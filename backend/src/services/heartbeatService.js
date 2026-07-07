const Temp = require('../models/Temp');

const HEARTBEAT_INTERVAL_MS = 20 * 60 * 1000;
const MAX_DOCS = 3;

async function insertHeartbeat() {
  try {
    await Temp.create({ status: 'alive' });
    console.log('Heartbeat inserted');
  } catch (err) {
    console.error('Heartbeat insert failed:', err.message);
  }
}

async function trimHeartbeats() {
  try {
    const count = await Temp.countDocuments();
    if (count > MAX_DOCS) {
      const docsToDelete = count - MAX_DOCS;
      const oldest = await Temp.find().sort({ createdAt: 1 }).limit(docsToDelete);
      if (oldest.length > 0) {
        const ids = oldest.map((doc) => doc._id);
        await Temp.deleteMany({ _id: { $in: ids } });
        console.log('Old heartbeat deleted');
      }
    }
  } catch (err) {
    console.error('Heartbeat trim failed:', err.message);
  }
}

async function tick() {
  await insertHeartbeat();
  await trimHeartbeats();
}

function startHeartbeat() {
  tick();
  setInterval(tick, HEARTBEAT_INTERVAL_MS);
  console.log(`Heartbeat service started (every ${HEARTBEAT_INTERVAL_MS / 60000} min, max ${MAX_DOCS} docs)`);
}

module.exports = { startHeartbeat };
