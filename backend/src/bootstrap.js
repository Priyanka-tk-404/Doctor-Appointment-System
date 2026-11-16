const bcrypt = require('bcryptjs');
const { User, Setting } = require('./models');
const { DEFAULTS } = require('./utils/settings');

// Runs on every start: makes sure default settings and the admin account exist
module.exports = async () => {
  for (const [name, value] of Object.entries(DEFAULTS)) {
    await Setting.findOrCreate({ where: { name }, defaults: { value } });
  }
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const [, created] = await User.findOrCreate({
    where: { email },
    defaults: { name: 'Admin', role: 'admin', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10) },
  });
  if (created) console.log(`Admin account created: ${email}`);
};
