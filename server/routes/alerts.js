const express = require('express');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { severity, type, resolved, page = 1, limit = 20 } = req.query;
    const query = {};
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (resolved !== undefined) query.isResolved = resolved === 'true';

    const total = await Alert.countDocuments(query);
    const alerts = await Alert.find(query)
      .populate('equipment', 'equipmentId equipmentName type location')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ alerts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/resolve', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    ).populate('equipment', 'equipmentId equipmentName');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
