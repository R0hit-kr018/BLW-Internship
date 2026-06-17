const express = require('express');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const operational = await Equipment.countDocuments({ status: 'operational' });
    const underMaintenance = await Equipment.countDocuments({ status: 'under-maintenance' });
    const critical = await Equipment.countDocuments({ status: 'critical' });
    const decommissioned = await Equipment.countDocuments({ status: 'decommissioned' });

    const totalMaintenance = await Maintenance.countDocuments();
    const scheduled = await Maintenance.countDocuments({ status: 'scheduled' });
    const inProgress = await Maintenance.countDocuments({ status: 'in-progress' });
    const completed = await Maintenance.countDocuments({ status: 'completed' });

    const unresolvedAlerts = await Alert.countDocuments({ isResolved: false });
    const criticalAlerts = await Alert.countDocuments({ severity: 'critical', isResolved: false });
    const totalUsers = await User.countDocuments();

    // Equipment type distribution
    const typeDistribution = await Equipment.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Maintenance type distribution
    const maintenanceTypes = await Maintenance.aggregate([
      { $group: { _id: '$maintenanceType', count: { $sum: 1 } } },
    ]);

    // Monthly maintenance trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrend = await Maintenance.aggregate([
      { $match: { maintenanceDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$maintenanceDate' } },
          count: { $sum: 1 },
          cost: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Risk distribution
    const riskDistribution = await Equipment.aggregate([
      { $group: { _id: '$predictedMaintenance', count: { $sum: 1 } } },
    ]);

    // Upcoming maintenance (next 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const upcoming = await Maintenance.find({
      status: 'scheduled',
      maintenanceDate: { $lte: thirtyDaysLater },
    })
      .populate('equipment', 'equipmentId equipmentName type location')
      .populate('technician', 'name')
      .sort({ maintenanceDate: 1 })
      .limit(10);

    // Recent alerts
    const recentAlerts = await Alert.find({ isResolved: false })
      .populate('equipment', 'equipmentId equipmentName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Top risk equipment
    const topRiskEquipment = await Equipment.find({ riskScore: { $gt: 0 } })
      .sort({ riskScore: -1 })
      .limit(5)
      .select('equipmentId equipmentName type riskScore predictedMaintenance status');

    res.json({
      kpis: {
        totalEquipment, operational, underMaintenance, critical, decommissioned,
        totalMaintenance, scheduled, inProgress, completed,
        unresolvedAlerts, criticalAlerts, totalUsers,
      },
      typeDistribution,
      maintenanceTypes,
      monthlyTrend,
      riskDistribution,
      upcoming,
      recentAlerts,
      topRiskEquipment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
