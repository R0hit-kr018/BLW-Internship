const express = require('express');
const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status, type, equipmentId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.maintenanceType = type;
    if (equipmentId) query.equipment = equipmentId;

    const total = await Maintenance.countDocuments(query);
    const records = await Maintenance.find(query)
      .populate('equipment', 'equipmentId equipmentName type location status')
      .populate('technician', 'name email')
      .populate('scheduledBy', 'name email')
      .sort({ maintenanceDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate('equipment', 'equipmentId equipmentName type location status')
      .populate('technician', 'name email')
      .populate('scheduledBy', 'name email');
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const record = await Maintenance.create({ ...req.body, scheduledBy: req.user._id });
    if (req.body.equipment) {
      await Equipment.findByIdAndUpdate(req.body.equipment, {
        status: 'under-maintenance',
        nextMaintenanceDate: req.body.nextMaintenanceDate,
      });
    }
    const populated = await Maintenance.findById(record._id)
      .populate('equipment', 'equipmentId equipmentName type location')
      .populate('technician', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'technician') {
      const allowed = ['status', 'remarks', 'duration', 'partsReplaced'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const updated = await Maintenance.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        .populate('equipment', 'equipmentId equipmentName type location')
        .populate('technician', 'name email');
      if (updates.status === 'completed') {
        await Equipment.findByIdAndUpdate(record.equipment, { status: 'operational', lastMaintenanceDate: new Date() });
      }
      return res.json(updated);
    }

    const updated = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('equipment', 'equipmentId equipmentName type location')
      .populate('technician', 'name email');
    if (req.body.status === 'completed') {
      await Equipment.findByIdAndUpdate(record.equipment, { status: 'operational', lastMaintenanceDate: new Date() });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const record = await Maintenance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
