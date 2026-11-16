const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const { STRING, TEXT, INTEGER, BOOLEAN, DATE, DECIMAL, ENUM } = DataTypes;

const User = sequelize.define('User', {
  name: { type: STRING, allowNull: false },
  email: { type: STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: STRING, allowNull: false },
  phone: STRING,
  role: { type: ENUM('user', 'doctor', 'admin'), allowNull: false, defaultValue: 'user' },
  isActive: { type: BOOLEAN, allowNull: false, defaultValue: true },
});

const DoctorProfile = sequelize.define('DoctorProfile', {
  userId: { type: INTEGER, allowNull: false, unique: true },
  specialization: { type: STRING, allowNull: false },
  experienceYears: { type: INTEGER, allowNull: false, defaultValue: 0 },
  bio: TEXT,
  fee: { type: DECIMAL(10, 2), allowNull: false },
  certificatePath: { type: STRING, allowNull: false },
  status: { type: ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  rejectionReason: STRING,
});

const Slot = sequelize.define(
  'Slot',
  {
    doctorId: { type: INTEGER, allowNull: false },
    startAt: { type: DATE, allowNull: false },
    endAt: { type: DATE, allowNull: false },
    isBooked: { type: BOOLEAN, allowNull: false, defaultValue: false },
  },
  { indexes: [{ unique: true, fields: ['doctorId', 'startAt'] }] }
);

const Appointment = sequelize.define('Appointment', {
  userId: { type: INTEGER, allowNull: false },
  doctorId: { type: INTEGER, allowNull: false },
  // unique + nullable: one booking per slot, and a cancelled booking releases the slot (set to NULL)
  slotId: { type: INTEGER, allowNull: true, unique: true },
  startAt: { type: DATE, allowNull: false },
  endAt: { type: DATE, allowNull: false },
  status: { type: ENUM('booked', 'completed', 'cancelled'), allowNull: false, defaultValue: 'booked' },
  reason: STRING,
  doctorFee: { type: DECIMAL(10, 2), allowNull: false },
  commissionPercent: { type: DECIMAL(5, 2), allowNull: false },
  commissionAmount: { type: DECIMAL(10, 2), allowNull: false },
  totalFee: { type: DECIMAL(10, 2), allowNull: false },
  rescheduleCount: { type: INTEGER, allowNull: false, defaultValue: 0 },
  reminded1d: { type: BOOLEAN, allowNull: false, defaultValue: false },
  reminded1h: { type: BOOLEAN, allowNull: false, defaultValue: false },
  reminded15m: { type: BOOLEAN, allowNull: false, defaultValue: false },
});

const Prescription = sequelize.define('Prescription', {
  appointmentId: { type: INTEGER, allowNull: false, unique: true },
  userId: { type: INTEGER, allowNull: false },
  doctorId: { type: INTEGER, allowNull: false },
  diagnosis: { type: TEXT, allowNull: false },
  medicines: { type: TEXT, allowNull: false },
  notes: TEXT,
});

const Notification = sequelize.define('Notification', {
  userId: { type: INTEGER, allowNull: false },
  title: { type: STRING, allowNull: false },
  message: { type: TEXT, allowNull: false },
  type: { type: STRING, defaultValue: 'info' },
  isRead: { type: BOOLEAN, allowNull: false, defaultValue: false },
});

const Setting = sequelize.define('Setting', {
  name: { type: STRING, primaryKey: true },
  value: TEXT,
}, { timestamps: false });

// Relationships
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

DoctorProfile.hasMany(Slot, { foreignKey: 'doctorId', as: 'slots', onDelete: 'CASCADE' });
Slot.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'doctor' });

User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'patient' });

DoctorProfile.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'doctor' });

Slot.hasOne(Appointment, { foreignKey: 'slotId', onDelete: 'SET NULL' });
Appointment.belongsTo(Slot, { foreignKey: 'slotId' });

Appointment.hasOne(Prescription, { foreignKey: 'appointmentId', as: 'prescription' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Prescription.belongsTo(User, { foreignKey: 'userId', as: 'patient' });
Prescription.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'doctor' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, DoctorProfile, Slot, Appointment, Prescription, Notification, Setting };
