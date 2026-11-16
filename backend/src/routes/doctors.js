const router = require('express').Router();
const { Op } = require('sequelize');
const { User, DoctorProfile, Slot } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { calcFees } = require('../utils/fees');
const { getCommission } = require('../utils/settings');

const shape = (p, percent) => ({
  id: p.id,
  name: p.user && p.user.name,
  specialization: p.specialization,
  experienceYears: p.experienceYears,
  bio: p.bio,
  status: p.status,
  ...calcFees(p.fee, percent),
});

router.use(auth);

// ----- Doctor: own profile (declared before "/:id") -----
router.get('/me/profile', requireRole('doctor'), asyncHandler(async (req, res) => {
  const percent = await getCommission();
  res.json({ ...shape({ ...req.user.profile.toJSON(), user: req.user }, percent), phone: req.user.phone });
}));

router.put('/me/profile', requireRole('doctor'), asyncHandler(async (req, res) => {
  const { name, phone, specialization, experienceYears, bio, fee } = req.body;
  if (!specialization || !specialization.trim()) throw httpError(400, 'Specialization is required.');
  const feeNum = Number(fee);
  if (!(feeNum > 0)) throw httpError(400, 'Enter a consultation fee greater than 0.');
  const exp = Number(experienceYears || 0);
  if (!Number.isInteger(exp) || exp < 0 || exp > 70) throw httpError(400, 'Experience must be a whole number of years.');
  await req.user.update({ name: (name && name.trim()) || req.user.name, phone });
  // A new fee only applies to future bookings. Existing appointments keep the fee they were booked with.
  await req.user.profile.update({ specialization: specialization.trim(), experienceYears: exp, bio, fee: feeNum });
  res.json({ message: 'Profile saved.' });
}));

// ----- Patients: browse approved doctors -----
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const percent = await getCommission();
  const where = { status: 'approved' };
  if (q) {
    where[Op.or] = [
      { specialization: { [Op.iLike]: `%${q}%` } },
      { '$user.name$': { [Op.iLike]: `%${q}%` } },
    ];
  }
  const doctors = await DoctorProfile.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'name'], required: true }],
    order: [['createdAt', 'DESC']],
  });
  res.json(doctors.map((d) => shape(d, percent)));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findOne({
    where: { id: req.params.id, status: 'approved' },
    include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
  });
  if (!doctor) throw httpError(404, 'Doctor not found.');
  const slots = await Slot.findAll({
    where: { doctorId: doctor.id, isBooked: false, startAt: { [Op.gt]: new Date() } },
    order: [['startAt', 'ASC']],
    limit: 200,
  });
  res.json({ ...shape(doctor, await getCommission()), slots });
}));

module.exports = router;
