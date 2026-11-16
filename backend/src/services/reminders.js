const cron = require('node-cron');
const { Op } = require('sequelize');
const { Appointment, DoctorProfile } = require('../models');
const notify = require('../utils/notify');
const { MIN, HOUR, DAY, fmt } = require('../utils/time');

// Sorted from the closest to the furthest
const WINDOWS = [
  { flag: 'reminded15m', ms: 15 * MIN, label: 'in 15 minutes' },
  { flag: 'reminded1h', ms: HOUR, label: 'in 1 hour' },
  { flag: 'reminded1d', ms: DAY, label: 'tomorrow (in about 24 hours)' },
];

async function runReminders() {
  const now = Date.now();
  const due = await Appointment.findAll({
    where: {
      status: 'booked',
      startAt: { [Op.gt]: new Date(now), [Op.lte]: new Date(now + DAY) },
      [Op.or]: WINDOWS.map((w) => ({ [w.flag]: false })),
    },
    include: [{ model: DoctorProfile, as: 'doctor', attributes: ['userId'] }],
  });

  for (const a of due) {
    const diff = new Date(a.startAt).getTime() - now;
    // Pick the closest window that is due and not yet sent; mark it and all wider windows as done,
    // so after downtime we never send a stale "tomorrow" reminder 10 minutes before the visit.
    const hit = WINDOWS.find((w) => diff <= w.ms && !a[w.flag]);
    if (!hit) continue;
    const update = {};
    WINDOWS.filter((w) => w.ms >= hit.ms).forEach((w) => (update[w.flag] = true));
    await a.update(update);
    const text = `Appointment ${hit.label}: ${fmt(a.startAt)}.`;
    await notify(a.userId, 'Appointment reminder', text, 'reminder');
    await notify(a.doctor.userId, 'Appointment reminder', text, 'reminder');
  }
}

exports.startReminders = () => {
  cron.schedule('* * * * *', () => runReminders().catch((e) => console.error('Reminder job failed:', e.message)));
  console.log('Reminder job running every minute');
};
exports.runReminders = runReminders;
