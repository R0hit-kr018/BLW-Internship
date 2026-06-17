const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment reference is required'],
  },
  maintenanceDate: {
    type: Date,
    required: [true, 'Maintenance date is required'],
    default: Date.now,
  },
  maintenanceType: {
    type: String,
    required: [true, 'Maintenance type is required'],
    enum: ['preventive', 'corrective', 'predictive', 'emergency', 'routine-inspection'],
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Technician is required'],
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  remarks: {
    type: String,
    trim: true,
  },
  nextMaintenanceDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  cost: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // in hours
    default: 0,
  },
  partsReplaced: [{
    partName: String,
    partNumber: String,
    quantity: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
