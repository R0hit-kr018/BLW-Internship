const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
  },
  type: {
    type: String,
    enum: ['maintenance-due', 'high-temperature', 'critical-failure', 'overdue-maintenance', 'prediction-alert', 'usage-limit'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
