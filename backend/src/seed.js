// Optional demo data: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, DoctorProfile, Slot } = require('./models');
const bootstrap = require('./bootstrap');

(async () => {
  await sequelize.sync();
  await bootstrap();
  const hash = await bcrypt.hash('Demo@123', 10);

  const [patient] = await User.findOrCreate({
    where: { email: 'patient@example.com' },
    defaults: { name: 'Demo Patient', passwordHash: hash, role: 'user', phone: '9000000001' },
  });

  const docs = [
    { email: 'asha@example.com', name: 'Asha Raman', spec: 'Cardiologist', fee: 800, exp: 12 },
    { email: 'karthik@example.com', name: 'Karthik Subbu', spec: 'Dermatologist', fee: 600, exp: 8 },
    { email: 'meena@example.com', name: 'Meena Devi', spec: 'Pediatrician', fee: 500, exp: 15 },
  ];
  for (const d of docs) {
    const [u] = await User.findOrCreate({
      where: { email: d.email },
      defaults: { name: d.name, passwordHash: hash, role: 'doctor', phone: '9000000002' },
    });
    const [profile] = await DoctorProfile.findOrCreate({
      where: { userId: u.id },
      defaults: {
        specialization: d.spec, experienceYears: d.exp, fee: d.fee, status: 'approved',
        certificatePath: 'certificates/demo.pdf', bio: `${d.spec} with ${d.exp} years of experience.`,
      },
    });
    // 8 half-hour slots a day for the next 4 days (starting 2 days from now so reschedule/cancel can be tested)
    for (let day = 2; day <= 5; day++) {
      for (let i = 0; i < 8; i++) {
        const start = new Date();
        start.setDate(start.getDate() + day);
        start.setHours(10, 0, 0, 0);
        start.setMinutes(i * 30);
        await Slot.findOrCreate({
          where: { doctorId: profile.id, startAt: start },
          defaults: { endAt: new Date(start.getTime() + 30 * 60000) },
        });
      }
    }
  }
  console.log('Demo data ready. Logins (password Demo@123): patient@example.com, asha@example.com, karthik@example.com, meena@example.com');
  await sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
