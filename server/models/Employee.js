const mongoose = require('mongoose');

// Profile data for every person in the company (employees, managers and HR all get one).
const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, unique: true, sparse: true },
    department: { type: String, trim: true, index: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    dateOfJoining: { type: Date, default: Date.now },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // the manager's User id
    emergencyContact: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
