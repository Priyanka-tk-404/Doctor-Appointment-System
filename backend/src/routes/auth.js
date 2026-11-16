const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sequelize = require('../config/db');
const { User, DoctorProfile } = require('../models');
const { auth } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const certUpload = makeUpload('certificates').single('certificate');
const emailOk = /^\S+@\S+\.\S+$/;

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  doctorStatus: u.profile ? u.profile.status : null,
  rejectionReason: u.profile ? u.profile.rejectionReason : null,
});

// Shared checks for both registration types. Returns an error message or null.
const checkBasics = async ({ name, email, password }) => {
  if (!name || !name.trim() || !email || !password) return 'Name, email and password are required.';
  if (!emailOk.test(email)) return 'Enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (await User.findOne({ where: { email: email.toLowerCase() } })) return 'An account with this email already exists.';
  return null;
};

router.post('/register', asyncHandler(async (req, res) => {
  const problem = await checkBasics(req.body);
  if (problem) return res.status(problem.includes('exists') ? 409 : 400).json({ message: problem });
  const { name, email, password, phone } = req.body;
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    phone,
    role: 'user',
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

router.post('/register-doctor', certUpload, asyncHandler(async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
  const fail = (code, message) => {
    cleanup();
    return res.status(code).json({ message });
  };
  try {
    if (!req.file) return fail(400, 'Please upload your medical certificate (PDF, JPG or PNG).');
    const problem = await checkBasics(req.body);
    if (problem) return fail(problem.includes('exists') ? 409 : 400, problem);

    const { name, email, password, phone, specialization, experienceYears, fee, bio } = req.body;
    if (!specialization || !specialization.trim()) return fail(400, 'Specialization is required.');
    const feeNum = Number(fee);
    if (!(feeNum > 0)) return fail(400, 'Enter a consultation fee greater than 0.');
    const exp = Number(experienceYears || 0);
    if (!Number.isInteger(exp) || exp < 0 || exp > 70) return fail(400, 'Experience must be a whole number of years.');

    const user = await sequelize.transaction(async (t) => {
      const u = await User.create(
        { name: name.trim(), email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10), phone, role: 'doctor' },
        { transaction: t }
      );
      await DoctorProfile.create(
        {
          userId: u.id,
          specialization: specialization.trim(),
          experienceYears: exp,
          bio,
          fee: feeNum,
          certificatePath: `certificates/${req.file.filename}`,
        },
        { transaction: t }
      );
      return User.findByPk(u.id, { include: [{ model: DoctorProfile, as: 'profile' }], transaction: t });
    });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    cleanup();
    throw e;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    where: { email: (email || '').toLowerCase() },
    include: [{ model: DoctorProfile, as: 'profile' }],
  });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated. Contact the admin.' });
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', auth, (req, res) => res.json(publicUser(req.user)));

module.exports = router;
