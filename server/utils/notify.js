const Notification = require('../models/Notification');

// Fire-and-forget helper; a failed notification must never break the main request.
module.exports = async function notify(userIds, message, link = '') {
  try {
    const ids = [].concat(userIds).filter(Boolean);
    if (!ids.length) return;
    await Notification.insertMany(ids.map((user) => ({ user, message, link })));
  } catch (err) {
    console.error('notify failed:', err.message);
  }
};
