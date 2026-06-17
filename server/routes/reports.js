const express = require('express');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/equipment-summary', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const equipment = await Equipment.find().select('equipmentId equipmentName type status usageHours temperature age riskScore failureCount location');
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/maintenance-history', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.maintenanceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const records = await Maintenance.find(query)
      .populate('equipment', 'equipmentId equipmentName type')
      .populate('technician', 'name')
      .sort({ maintenanceDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/cost-analysis', protect, authorize('admin'), async (req, res) => {
  try {
    const costByType = await Maintenance.aggregate([
      { $group: { _id: '$maintenanceType', totalCost: { $sum: '$cost' }, count: { $sum: 1 } } },
    ]);
    const costByMonth = await Maintenance.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$maintenanceDate' } }, totalCost: { $sum: '$cost' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ costByType, costByMonth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
