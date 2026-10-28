const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    mode: { type: String, enum: ['online', 'in-person'], default: 'online' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

trainingSchema.index({ assignees: 1, startDate: -1 });

module.exports = mongoose.model('Training', trainingSchema);
