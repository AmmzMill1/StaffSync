const Employee = require('../models/Employee');

// User ids of everyone who reports to the given manager.
exports.teamUserIds = (managerUserId) => Employee.find({ manager: managerUserId }).distinct('user');

// True when `userId` reports to `managerUserId`.
exports.isOnTeam = async (managerUserId, userId) =>
  !!(await Employee.exists({ user: userId, manager: managerUserId }));
