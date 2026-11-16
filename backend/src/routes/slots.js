const router = require('express').Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Slot } = require('../models');
const { auth, requireApprovedDoctor } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { MIN, HOUR } = require('../utils/time');

router.use(auth, requireApprovedDoctor);

router.get('/mine', asyncHandler(async (req, res) => {
  const slots = await Slot.findAll({
    where: { doctorId: req.user.profile.id, startAt: { [Op.gte]: new Date() } },
    order: [['startAt', 'ASC']],
    limit: 500,
  });
  res.json(slots);
}));

// Body: { startAt, endAt, durationMin } -> splits the range into equal slots
router.post('/', asyncHandler(async (req, res) => {
  const start = new Date(req.body.startAt);
  const end = new Date(req.body.endAt);
  const dur = Number(req.body.durationMin || 30);
  if (isNaN(start) || isNaN(end)) throw httpError(400, 'Choose a valid date and time range.');
  if (start <= new Date()) throw httpError(400, 'Slots must start in the future.');
  if (end <= start) throw httpError(400, 'The end time must be after the start time.');
  if (!Number.isInteger(dur) || dur < 10 || dur > 120) throw httpError(400, 'Slot length must be between 10 and 120 minutes.');
  if (end - start > 12 * HOUR) throw httpError(400, 'One range can cover at most 12 hours.');
  const count = Math.floor((end - start) / (dur * MIN));
  if (count < 1) throw httpError(400, 'The time range is shorter than one slot.');

  const doctorId = req.user.profile.id;
  const result = await sequelize.transaction(async (t) => {
    let created = 0;
    let skipped = 0;
    for (let i = 0; i < count; i++) {
      const s = new Date(start.getTime() + i * dur * MIN);
      const e = new Date(s.getTime() + dur * MIN);
      const overlap = await Slot.findOne({
        where: { doctorId, startAt: { [Op.lt]: e }, endAt: { [Op.gt]: s } },
        transaction: t,
      });
      if (overlap) {
        skipped++;
        continue;
      }
      await Slot.create({ doctorId, startAt: s, endAt: e }, { transaction: t });
      created++;
    }
    return { created, skipped };
  });
  res.status(201).json(result);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const slot = await Slot.findOne({ where: { id: req.params.id, doctorId: req.user.profile.id } });
  if (!slot) throw httpError(404, 'Slot not found.');
  if (slot.isBooked) throw httpError(400, 'This slot is booked, so it cannot be removed.');
  await slot.destroy();
  res.json({ message: 'Slot removed.' });
}));

module.exports = router;
