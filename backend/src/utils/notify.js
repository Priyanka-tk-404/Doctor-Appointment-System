const { Notification } = require('../models');

module.exports = (userId, title, message, type = 'info', transaction) =>
  Notification.create({ userId, title, message, type }, { transaction });
