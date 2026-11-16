const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const fmt = (d) =>
  new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  });

// If a booking is made late, the reminders that are already "in the past" are marked as sent.
const reminderFlags = (startAt) => {
  const diff = new Date(startAt).getTime() - Date.now();
  return { reminded1d: diff <= DAY, reminded1h: diff <= HOUR, reminded15m: diff <= 15 * MIN };
};

module.exports = { MIN, HOUR, DAY, fmt, reminderFlags };
