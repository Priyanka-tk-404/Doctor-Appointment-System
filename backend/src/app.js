const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOAD_ROOT } = require('./middleware/upload');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Only branding images are public. Doctor certificates are never served statically.
app.use('/uploads/branding', express.static(path.join(UPLOAD_ROOT, 'branding')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (maximum 5 MB).' : err.message;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'That was just taken. Please try again.';
  } else if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors.map((e) => e.message).join(', ');
  } else if (status === 500) {
    console.error(err);
    message = 'Server error. Please try again.';
  }
  res.status(status).json({ message });
});

module.exports = app;
