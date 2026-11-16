require('dotenv').config();
const sequelize = require('./config/db');
require('./models');
const app = require('./app');
const bootstrap = require('./bootstrap');
const { startReminders } = require('./services/reminders');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in your .env file.');
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    await sequelize.sync(); // creates the tables if they do not exist
    console.log('Tables ready');
    await bootstrap();
    startReminders();
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Could not start the server:', e.message);
    process.exit(1);
  }
})();
