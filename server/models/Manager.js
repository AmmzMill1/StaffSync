const mongoose = require('mongoose');

// Extra data that only managers have: the department they run and the people on their team.
const managerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: String, trim: true },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // team members' User ids
  },
  { timestamps: true }
);

module.exports = mongoose.model('Manager', managerSchema);
