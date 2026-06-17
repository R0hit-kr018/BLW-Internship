const express = require('express');
const axios = require('axios');
const Equipment = require('../models/Equipment');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { equipmentId: { $regex: search, $options: 'i' } },
        { equipmentName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Equipment.countDocuments(query);
    const equipment = await Equipment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      equipment,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get single equipment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate('createdBy', 'name email');
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const equipmentData = { ...req.body, createdBy: req.user._id };
    const equipment = await Equipment.create(equipmentData);

    res.status(201).json(equipment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Equipment ID already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private/Admin,Engineer
router.put('/:id', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    // Check for alerts
    if (equipment.temperature > 80) {
      await Alert.create({
        equipment: equipment._id,
        type: 'high-temperature',
        severity: equipment.temperature > 100 ? 'critical' : 'warning',
        message: `${equipment.equipmentName} (${equipment.equipmentId}) temperature is ${equipment.temperature}°C — exceeds safe threshold.`,
      });
    }

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    res.json({ message: 'Equipment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/equipment/:id/predict
// @desc    Get ML prediction for equipment
// @access  Private/Admin,Engineer
router.post('/:id/predict', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    // Call ML API
    try {
      const mlResponse = await axios.post(`${process.env.ML_API_URL}/predict`, {
        age: equipment.age,
        usage_hours: equipment.usageHours,
        failure_count: equipment.failureCount,
        temperature: equipment.temperature,
      });

      const prediction = mlResponse.data;

      // Update equipment with prediction
      equipment.predictedMaintenance = prediction.risk_level;
      equipment.riskScore = prediction.risk_score;
      await equipment.save();

      // Create alert if high risk
      if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {
        await Alert.create({
          equipment: equipment._id,
          type: 'prediction-alert',
          severity: prediction.risk_level === 'critical' ? 'critical' : 'warning',
          message: `ML Prediction: ${equipment.equipmentName} has ${prediction.risk_level} maintenance risk (Score: ${prediction.risk_score}%).`,
        });
      }

      res.json({
        equipment: equipment.equipmentId,
        prediction,
      });
    } catch (mlError) {
      // If ML API is unavailable, return a simulated prediction
      const simulatedRisk = calculateSimulatedRisk(equipment);
      equipment.predictedMaintenance = simulatedRisk.risk_level;
      equipment.riskScore = simulatedRisk.risk_score;
      await equipment.save();

      res.json({
        equipment: equipment.equipmentId,
        prediction: simulatedRisk,
        note: 'ML API unavailable — using rule-based prediction',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/equipment/:id/ai-analysis
// @desc    Get IBM Granite AI analysis
// @access  Private/Admin,Engineer
router.post('/:id/ai-analysis', protect, authorize('admin', 'engineer'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    const prompt = `You are a railway maintenance expert AI. Analyze this equipment and provide maintenance recommendations:

Equipment: ${equipment.equipmentName} (${equipment.equipmentId})
Type: ${equipment.type}
Manufacturer: ${equipment.manufacturer}
Age: ${equipment.age} years
Usage Hours: ${equipment.usageHours} hrs
Temperature: ${equipment.temperature}°C
Failure Count: ${equipment.failureCount}
Current Status: ${equipment.status}
Risk Score: ${equipment.riskScore}%

Provide:
1. Risk Assessment (Low/Medium/High/Critical)
2. Root Cause Analysis
3. Recommended Maintenance Actions
4. Estimated Time to Failure
5. Cost-Benefit Analysis of Immediate vs Deferred Maintenance
6. Safety Recommendations

Format the response in clear, structured sections.`;

    try {
      const response = await axios.post(
        process.env.IBM_GRANITE_URL,
        {
          model_id: 'ibm/granite-13b-instruct-v2',
          input: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.3,
            top_p: 0.9,
          },
          project_id: process.env.IBM_GRANITE_PROJECT_ID,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.IBM_GRANITE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiAnalysis = response.data.results?.[0]?.generated_text || '';

      res.json({
        equipment: equipment.equipmentId,
        analysis: aiAnalysis,
        generatedAt: new Date(),
      });
    } catch (aiError) {
      // Fallback: generate rule-based analysis
      const analysis = generateFallbackAnalysis(equipment);
      res.json({
        equipment: equipment.equipmentId,
        analysis,
        generatedAt: new Date(),
        note: 'IBM Granite API unavailable — using rule-based analysis',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Simulated risk calculation fallback
function calculateSimulatedRisk(equipment) {
  let score = 0;

  // Age factor (0-25)
  if (equipment.age > 15) score += 25;
  else if (equipment.age > 10) score += 20;
  else if (equipment.age > 5) score += 10;
  else score += 5;

  // Usage hours factor (0-25)
  if (equipment.usageHours > 20000) score += 25;
  else if (equipment.usageHours > 10000) score += 20;
  else if (equipment.usageHours > 5000) score += 10;
  else score += 5;

  // Failure count factor (0-25)
  if (equipment.failureCount > 10) score += 25;
  else if (equipment.failureCount > 5) score += 20;
  else if (equipment.failureCount > 2) score += 10;
  else score += 5;

  // Temperature factor (0-25)
  if (equipment.temperature > 100) score += 25;
  else if (equipment.temperature > 80) score += 20;
  else if (equipment.temperature > 60) score += 10;
  else score += 5;

  let risk_level = 'low';
  if (score >= 80) risk_level = 'critical';
  else if (score >= 60) risk_level = 'high';
  else if (score >= 40) risk_level = 'medium';

  return {
    risk_score: Math.min(score, 100),
    risk_level,
    confidence: 0.75,
    factors: {
      age_impact: equipment.age > 10 ? 'High' : 'Low',
      usage_impact: equipment.usageHours > 10000 ? 'High' : 'Low',
      failure_impact: equipment.failureCount > 5 ? 'High' : 'Low',
      temperature_impact: equipment.temperature > 80 ? 'High' : 'Low',
    },
  };
}

// Fallback AI analysis
function generateFallbackAnalysis(eq) {
  const riskLevel = eq.riskScore >= 80 ? 'CRITICAL' : eq.riskScore >= 60 ? 'HIGH' : eq.riskScore >= 40 ? 'MEDIUM' : 'LOW';

  return `## 🔍 Equipment Risk Assessment — ${riskLevel}

### 1. Risk Assessment
**Risk Level:** ${riskLevel} (Score: ${eq.riskScore}%)
**Equipment:** ${eq.equipmentName} (${eq.equipmentId})

### 2. Key Findings
- **Age:** ${eq.age} years — ${eq.age > 10 ? '⚠️ Approaching end of optimal lifecycle' : '✅ Within normal range'}
- **Usage:** ${eq.usageHours} hours — ${eq.usageHours > 10000 ? '⚠️ High usage detected' : '✅ Normal usage pattern'}
- **Temperature:** ${eq.temperature}°C — ${eq.temperature > 80 ? '🔴 Above safe threshold' : '✅ Within acceptable range'}
- **Failures:** ${eq.failureCount} recorded — ${eq.failureCount > 5 ? '⚠️ Frequent failures indicate degradation' : '✅ Acceptable failure rate'}

### 3. Recommended Maintenance Actions
${eq.riskScore >= 60 ? '- **URGENT:** Schedule immediate preventive maintenance\n- Conduct thorough inspection of all critical components\n- Replace worn parts before next operational cycle' : '- Continue routine inspection schedule\n- Monitor temperature and usage trends\n- Plan next preventive maintenance as scheduled'}

### 4. Safety Recommendations
- Ensure all safety protocols are followed during maintenance
- Document all findings and corrective actions
- Update maintenance log in the system
- ${eq.temperature > 80 ? 'Install additional cooling systems' : 'Continue standard monitoring'}

---
*Analysis generated by RailGuard AI Engine*`;
}

module.exports = router;
