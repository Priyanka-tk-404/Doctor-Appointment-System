const router = require('express').Router();
const { User, DoctorProfile, Appointment, Prescription } = require('../models');
const { auth, requireApprovedDoctor } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const notify = require('../utils/notify');

router.post('/', auth, requireApprovedDoctor, asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis, medicines, notes } = req.body;
  if (!diagnosis || !diagnosis.trim() || !medicines || !medicines.trim()) {
    throw httpError(400, 'Diagnosis and medicines are required.');
  }
  const appt = await Appointment.findOne({ where: { id: appointmentId, doctorId: req.user.profile.id } });
  if (!appt) throw httpError(404, 'Appointment not found.');
  if (appt.status === 'cancelled') throw httpError(400, 'This appointment was cancelled.');
  if (new Date(appt.startAt) > new Date()) throw httpError(400, 'You can write a prescription once the appointment has started.');

  const values = { diagnosis: diagnosis.trim(), medicines: medicines.trim(), notes };
  const [rx, created] = await Prescription.findOrCreate({
    where: { appointmentId: appt.id },
    defaults: { userId: appt.userId, doctorId: appt.doctorId, ...values },
  });
  if (!created) await rx.update(values);
  await notify(appt.userId, 'Prescription ready', `Dr. ${req.user.name} ${created ? 'added' : 'updated'} your prescription.`, 'prescription');
  res.status(created ? 201 : 200).json(rx);
}));

router.get('/', auth, asyncHandler(async (req, res) => {
  let where;
  if (req.user.role === 'user') where = { userId: req.user.id };
  else if (req.user.role === 'doctor' && req.user.profile) where = { doctorId: req.user.profile.id };
  else throw httpError(403, 'You do not have access to this.');
  const rows = await Prescription.findAll({
    where,
    include: [
      { model: Appointment, as: 'appointment', attributes: ['id', 'startAt'] },
      { model: DoctorProfile, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['name'] }] },
      { model: User, as: 'patient', attributes: ['name'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json(rows);
}));

module.exports = router;
