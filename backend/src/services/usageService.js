const GeminiUsage = require('../models/GeminiUsage');

const getDateString = () => new Date().toISOString().slice(0, 10);

const increment = async () => {
  const date = getDateString();
  await GeminiUsage.findOneAndUpdate(
    { date },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
};

const getUsage = async () => {
  const date = getDateString();
  let record = await GeminiUsage.findOne({ date });
  if (!record) {
    record = await GeminiUsage.create({ date, count: 0 });
  }
  const used = record.count;
  const limit = process.env.GEMINI_DAILY_LIMIT
    ? parseInt(process.env.GEMINI_DAILY_LIMIT)
    : record.dailyLimit;
  return {
    date,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    percentage: limit > 0 ? Math.round((used / limit) * 100) : 0
  };
};

module.exports = { increment, getUsage };
