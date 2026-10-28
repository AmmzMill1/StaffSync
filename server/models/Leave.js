const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['casual', 'sick', 'earned', 'unpaid'], required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
