const jwt = require('jsonwebtoken');
const { User, DoctorProfile } = require('../models');

exports.auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { include: [{ model: DoctorProfile, as: 'profile' }] });
    if (!user || !user.isActive) return res.status(401).json({ message: 'This account is not available.' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
};

exports.requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this.' });

// Doctors can manage slots / prescriptions only after the admin approves them
exports.requireApprovedDoctor = (req, res, next) => {
  const ok = req.user.role === 'doctor' && req.user.profile && req.user.profile.status === 'approved';
  return ok ? next() : res.status(403).json({ message: 'Your doctor account is not approved yet.' });
};
