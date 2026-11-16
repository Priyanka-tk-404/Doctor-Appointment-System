const router = require('express').Router();
const { Notification } = require('../models');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const items = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
  const unread = await Notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ items, unread });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ message: 'All marked as read.' });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
  res.json({ message: 'Marked as read.' });
}));

module.exports = router;
