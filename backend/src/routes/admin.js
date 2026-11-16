const router = require('express').Router();
const path = require('path');
const { User, DoctorProfile, Appointment } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { UPLOAD_ROOT } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const notify = require('../utils/notify');
const { calcFees } = require('../utils/fees');
const { getCommission } = require('../utils/settings');

router.use(auth, requireRole('admin'));

router.get('/stats', asyncHandler(async (req, res) => {
  const [users, doctors, pendingDoctors, appointments, booked, completed, cancelled, earned] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    DoctorProfile.count({ where: { status: 'approved' } }),
    DoctorProfile.count({ where: { status: 'pending' } }),
    Appointment.count(),
    Appointment.count({ where: { status: 'booked' } }),
    Appointment.count({ where: { status: 'completed' } }),
    Appointment.count({ where: { status: 'cancelled' } }),
    Appointment.sum('commissionAmount', { where: { status: 'completed' } }),
  ]);
  res.json({ users, doctors, pendingDoctors, appointments, booked, completed, cancelled, commissionEarned: Number(earned || 0) });
}));

router.get('/doctors', asyncHandler(async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const percent = await getCommission();
  const rows = await DoctorProfile.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'isActive'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(rows.map((d) => ({
    id: d.id,
    name: d.user.name,
    email: d.user.email,
    phone: d.user.phone,
    specialization: d.specialization,
    experienceYears: d.experienceYears,
    status: d.status,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt,
    ...calcFees(d.fee, percent),
  })));
}));

// Certificates are private: only an admin can open them (not served as public files)
router.get('/doctors/:id/certificate', asyncHandler(async (req, res) => {
  const doc = await DoctorProfile.findByPk(req.params.id);
  if (!doc) throw httpError(404, 'Doctor not found.');
  const file = path.join(UPLOAD_ROOT, doc.certificatePath);
  if (!file.startsWith(UPLOAD_ROOT)) throw httpError(400, 'Invalid file.');
  res.sendFile(file, (err) => {
    if (err && !res.headersSent) res.status(404).json({ message: 'Certificate file not found.' });
  });
}));

router.patch('/doctors/:id/approve', asyncHandler(async (req, res) => {
  const doc = await DoctorProfile.findByPk(req.params.id);
  if (!doc) throw httpError(404, 'Doctor not found.');
  await doc.update({ status: 'approved', rejectionReason: null });
  await notify(doc.userId, 'Account approved', 'Your doctor account is approved. You can now add availability slots.', 'approval');
  res.json({ message: 'Doctor approved.' });
}));

router.patch('/doctors/:id/reject', asyncHandler(async (req, res) => {
  const doc = await DoctorProfile.findByPk(req.params.id);
  if (!doc) throw httpError(404, 'Doctor not found.');
  const reason = (req.body.reason || '').trim().slice(0, 250) || 'Your documents could not be verified.';
  await doc.update({ status: 'rejected', rejectionReason: reason });
  await notify(doc.userId, 'Account not approved', reason, 'approval');
  res.json({ message: 'Doctor rejected.' });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { role: 'user' },
    attributes: ['id', 'name', 'email', 'phone', 'isActive', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json(users);
}));

router.patch('/users/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw httpError(404, 'User not found.');
  if (user.role === 'admin') throw httpError(400, 'The admin account cannot be deactivated.');
  await user.update({ isActive: !user.isActive });
  res.json({ isActive: user.isActive });
}));

module.exports = router;
