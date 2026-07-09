const mongoose = require('mongoose');
const Temp = require('../models/Temp');

const HEARTBEAT_BATCH_INTERVAL_MS = 60 * 60 * 1000;
const HEARTBEAT_BATCH_SIZE = 15;
const HEARTBEAT_WINDOW_MS = 60 * 60 * 1000;
const MAX_HEARTBEAT_DOCS = 30;

function waitForMongoConnection() {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('MongoDB connection timed out while starting heartbeat service'));
    }, 10000);

    mongoose.connection.once('open', () => {
      clearTimeout(timeout);
      resolve();
    });

    mongoose.connection.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function trimHeartbeats() {
  try {
    await waitForMongoConnection();

    const count = await Temp.countDocuments();
    if (count <= MAX_HEARTBEAT_DOCS) {
      return;
    }

    const docsToDelete = count - MAX_HEARTBEAT_DOCS;
    const oldest = await Temp.find().sort({ createdAt: 1 }).limit(docsToDelete).select('_id');

    if (oldest.length > 0) {
      const ids = oldest.map((doc) => doc._id);
      await Temp.deleteMany({ _id: { $in: ids } });
      console.log(`[heartbeat] pruned ${ids.length} old record(s) to keep the latest ${MAX_HEARTBEAT_DOCS}`);
    }
  } catch (error) {
    console.error(`[heartbeat] cleanup failed: ${error.message}`);
  }
}

async function insertHeartbeat() {
  try {
    await waitForMongoConnection();

    const createdAt = new Date();
    await Temp.create({ status: 'alive', createdAt });
    console.log(`[heartbeat] inserted record at ${createdAt.toISOString()}`);

    await trimHeartbeats();
  } catch (error) {
    console.error(`[heartbeat] insert failed: ${error.message}`);
  }
}

async function runHeartbeatBatch() {
  try {
    await waitForMongoConnection();
    console.log(`[heartbeat] starting ${HEARTBEAT_BATCH_SIZE}-record batch`);

    const delays = Array.from({ length: HEARTBEAT_BATCH_SIZE }, () => Math.floor(Math.random() * HEARTBEAT_WINDOW_MS));
    delays.sort((a, b) => a - b);

    await Promise.all(
      delays.map(
        (delay) =>
          new Promise((resolve) => {
            setTimeout(() => {
              insertHeartbeat().finally(resolve);
            }, delay);
          })
      )
    );

    console.log(`[heartbeat] completed ${HEARTBEAT_BATCH_SIZE}-record batch`);
  } catch (error) {
    console.error(`[heartbeat] batch failed: ${error.message}`);
  }
}

function startHeartbeat() {
  runHeartbeatBatch();
  setInterval(runHeartbeatBatch, HEARTBEAT_BATCH_INTERVAL_MS);
  console.log(`[heartbeat] service started; batches every ${HEARTBEAT_BATCH_INTERVAL_MS / 60000} minute(s) and retain up to ${MAX_HEARTBEAT_DOCS} records`);
}

module.exports = { startHeartbeat };
