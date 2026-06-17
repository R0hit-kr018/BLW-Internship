const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: [true, 'Equipment ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  equipmentName: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Equipment type is required'],
    enum: [
      'Locomotive Engine',
      'Bogie Assembly',
      'Brake System',
      'Electrical System',
      'HVAC System',
      'Signaling Equipment',
      'Track Equipment',
      'Coupling System',
      'Suspension System',
      'Power Transformer',
      'Pantograph',
      'Compressor',
      'Other',
    ],
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
  },
  installationDate: {
    type: Date,
    required: [true, 'Installation date is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['operational', 'under-maintenance', 'critical', 'decommissioned'],
    default: 'operational',
  },
  usageHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  temperature: {
    type: Number,
    default: 25,
  },
  age: {
    type: Number,
    default: 0,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
  lastMaintenanceDate: {
    type: Date,
  },
  nextMaintenanceDate: {
    type: Date,
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  predictedMaintenance: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'none'],
    default: 'none',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Calculate age automatically before saving
equipmentSchema.pre('save', function (next) {
  if (this.installationDate) {
    const now = new Date();
    const diffTime = Math.abs(now - this.installationDate);
    this.age = Math.round((diffTime / (1000 * 60 * 60 * 24 * 365)) * 10) / 10;
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);
