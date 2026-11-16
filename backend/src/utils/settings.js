const { Setting } = require('../models');

const DEFAULTS = { appName: 'Doctor Appointment System', commissionPercent: '10', logoPath: '' };

const getAll = async () => {
  const rows = await Setting.findAll();
  const o = { ...DEFAULTS };
  rows.forEach((r) => (o[r.name] = r.value));
  return { appName: o.appName, commissionPercent: Number(o.commissionPercent), logoPath: o.logoPath || null };
};

module.exports = {
  DEFAULTS,
  getAll,
  getCommission: async () => (await getAll()).commissionPercent,
  set: (name, value) => Setting.upsert({ name, value: String(value) }),
};
