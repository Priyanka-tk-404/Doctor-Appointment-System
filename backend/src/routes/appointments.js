const router = require('express').Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { User, DoctorProfile, Slot, Appointment, Prescription } = require('../models');
const { auth, requireRole, requireApprovedDoctor } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const notify = require('../utils/notify');
const { calcFees } = require('../utils/fees');
const { getCommission } = require('../utils/settings');
const { DAY, fmt, reminderFlags } = require('../utils/time');

const include = [
  { model: DoctorProfile, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
  { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'phone'] },
  { model: Prescription, as: 'prescription' },
];

// Rule: no cancel / reschedule within 24 hours of the start time
const canChange = (a) => a.status === 'booked' && new Date(a.startAt).getTime() - Date.now() >= DAY;
const assertChangeable = (a) => {
  if (a.status !== 'booked') throw httpError(400, 'Only booked appointments can be changed.');
  if (!canChange(a)) {
    throw httpError(400, 'Appointments cannot be cancelled or rescheduled within 24 hours of the start time.');
  }
};

const overlapWhere = (userId, slot, excludeId) => ({
  userId,
  status: 'booked',
  ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  startAt: { [Op.lt]: slot.endAt },
  endAt: { [Op.gt]: slot.startAt },
});

// Next free slot of the same doctor after the current one, skipping times where the patient is already busy
async function findNextSlot(appt, t) {
  const candidates = await Slot.findAll({
    where: { doctorId: appt.doctorId, isBooked: false, startAt: { [Op.gt]: appt.startAt } },
    order: [['startAt', 'ASC']],
    limit: 20,
    transaction: t,
    lock: t ? t.LOCK.UPDATE : undefined,
  });
  for (const s of candidates) {
    const clash = await Appointment.findOne({ where: overlapWhere(appt.userId, s, appt.id), transaction: t });
    if (!clash) return s;
  }
  return null;
}

const loadOwn = async (req, t) => {
  const appt = await Appointment.findOne({ where: { id: req.params.id, userId: req.user.id }, transaction: t, lock: t ? t.LOCK.UPDATE : undefined });
  if (!appt) throw httpError(404, 'Appointment not found.');
  return appt;
};

// ----- List (role aware) -----
router.get('/', auth, asyncHandler(async (req, res) => {
  let where = {};
  if (req.user.role === 'user') where = { userId: req.user.id };
  else if (req.user.role === 'doctor') {
    if (!req.user.profile) return res.json([]);
    where = { doctorId: req.user.profile.id };
  }
  const rows = await Appointment.findAll({ where, include, order: [['startAt', 'DESC']], limit: 500 });
  res.json(rows.map((a) => ({ ...a.toJSON(), canChange: canChange(a) })));
}));

// ----- Book -----
router.post('/', auth, requireRole('user'), asyncHandler(async (req, res) => {
  const { slotId, reason } = req.body;
  if (!slotId) throw httpError(400, 'Choose a time slot.');
  const percent = await getCommission();

  const appt = await sequelize.transaction(async (t) => {
    // Row lock: two people clicking the same slot are handled one after the other
    const slot = await Slot.findByPk(slotId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!slot) throw httpError(404, 'This slot no longer exists.');
    if (slot.isBooked) throw httpError(409, 'Sorry, this slot was just booked by someone else. Please pick another.');
    if (new Date(slot.startAt) <= new Date()) throw httpError(400, 'This slot is in the past.');
    const doctor = await DoctorProfile.findByPk(slot.doctorId, { transaction: t });
    if (!doctor || doctor.status !== 'approved') throw httpError(400, 'This doctor is not available for booking.');
    if (await Appointment.findOne({ where: overlapWhere(req.user.id, slot), transaction: t })) {
      throw httpError(409, 'You already have an appointment at that time.');
    }

    const created = await Appointment.create(
      {
        userId: req.user.id,
        doctorId: doctor.id,
        slotId: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        reason: reason && reason.trim() ? reason.trim().slice(0, 250) : null,
        ...calcFees(doctor.fee, percent), // fee is frozen at booking time
        ...reminderFlags(slot.startAt),
      },
      { transaction: t }
    );
    await slot.update({ isBooked: true }, { transaction: t });
    await notify(req.user.id, 'Appointment booked', `Your appointment is confirmed for ${fmt(slot.startAt)}.`, 'booking', t);
    await notify(doctor.userId, 'New appointment', `${req.user.name} booked ${fmt(slot.startAt)}.`, 'booking', t);
    return created;
  });
  res.status(201).json(appt);
}));

// ----- Cancel (frees the slot) -----
router.post('/:id/cancel', auth, requireRole('user'), asyncHandler(async (req, res) => {
  await sequelize.transaction(async (t) => {
    const appt = await loadOwn(req, t);
    assertChangeable(appt);
    const doctor = await DoctorProfile.findByPk(appt.doctorId, { transaction: t });
    const oldSlotId = appt.slotId;
    await appt.update({ status: 'cancelled', slotId: null }, { transaction: t });
    await Slot.update({ isBooked: false }, { where: { id: oldSlotId }, transaction: t });
    await notify(req.user.id, 'Appointment cancelled', `Your appointment on ${fmt(appt.startAt)} was cancelled.`, 'cancel', t);
    await notify(doctor.userId, 'Appointment cancelled', `${req.user.name} cancelled ${fmt(appt.startAt)}.`, 'cancel', t);
  });
  res.json({ message: 'Appointment cancelled.' });
}));

// ----- Reschedule: preview, then confirm -----
router.get('/:id/reschedule-preview', auth, requireRole('user'), asyncHandler(async (req, res) => {
  const appt = await loadOwn(req);
  assertChangeable(appt);
  const next = await findNextSlot(appt);
  res.json({ nextSlot: next ? { id: next.id, startAt: next.startAt, endAt: next.endAt } : null });
}));

router.post('/:id/reschedule', auth, requireRole('user'), asyncHandler(async (req, res) => {
  const moved = await sequelize.transaction(async (t) => {
    const appt = await loadOwn(req, t);
    assertChangeable(appt);
    const next = await findNextSlot(appt, t);
    if (!next) throw httpError(409, 'No later slot is available right now. Your current appointment stays as it is.');
    const doctor = await DoctorProfile.findByPk(appt.doctorId, { transaction: t });
    const oldSlotId = appt.slotId;
    const oldStart = appt.startAt;
    await appt.update(
      { slotId: next.id, startAt: next.startAt, endAt: next.endAt, rescheduleCount: appt.rescheduleCount + 1, ...reminderFlags(next.startAt) },
      { transaction: t }
    );
    await next.update({ isBooked: true }, { transaction: t });
    await Slot.update({ isBooked: false }, { where: { id: oldSlotId }, transaction: t });
    await notify(req.user.id, 'Appointment rescheduled', `Moved from ${fmt(oldStart)} to ${fmt(next.startAt)}.`, 'reschedule', t);
    await notify(doctor.userId, 'Appointment rescheduled', `${req.user.name} moved ${fmt(oldStart)} to ${fmt(next.startAt)}.`, 'reschedule', t);
    return appt;
  });
  res.json(moved);
}));

// ----- Doctor marks it complete -----
router.patch('/:id/complete', auth, requireApprovedDoctor, asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ where: { id: req.params.id, doctorId: req.user.profile.id } });
  if (!appt) throw httpError(404, 'Appointment not found.');
  if (appt.status !== 'booked') throw httpError(400, 'Only booked appointments can be completed.');
  if (new Date(appt.startAt) > new Date()) throw httpError(400, 'You can complete an appointment only after it has started.');
  await appt.update({ status: 'completed' });
  await notify(appt.userId, 'Appointment completed', `Your visit with Dr. ${req.user.name} is complete. Check for your prescription.`, 'complete');
  res.json(appt);
}));

module.exports = router;
