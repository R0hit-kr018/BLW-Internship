require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Equipment = require('./models/Equipment');
const Maintenance = require('./models/Maintenance');
const Alert = require('./models/Alert');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Equipment.deleteMany({});
    await Maintenance.deleteMany({});
    await Alert.deleteMany({});

    // Create Users
    console.log('👤 Creating users...');
    const admin = await User.create({ name: 'Rajesh Kumar', email: 'admin@railguard.in', password: 'admin123', role: 'admin', department: 'Management', phone: '9876543210' });
    const engineer = await User.create({ name: 'Priya Sharma', email: 'engineer@railguard.in', password: 'engineer123', role: 'engineer', department: 'Mechanical', phone: '9876543211' });
    const tech1 = await User.create({ name: 'Amit Singh', email: 'tech1@railguard.in', password: 'tech123', role: 'technician', department: 'Electrical', phone: '9876543212' });
    const tech2 = await User.create({ name: 'Vikram Patel', email: 'tech2@railguard.in', password: 'tech123', role: 'technician', department: 'Mechanical', phone: '9876543213' });

    // Create Equipment
    console.log('🔧 Creating equipment...');
    const equipmentData = [
      { equipmentId: 'LOC-001', equipmentName: 'WAP-7 Locomotive Engine', type: 'Locomotive Engine', manufacturer: 'Chittaranjan Locomotive Works', installationDate: new Date('2018-03-15'), location: 'Bay 1 - Main Workshop', status: 'operational', usageHours: 12500, temperature: 72, failureCount: 3 },
      { equipmentId: 'BOG-002', equipmentName: 'LHB Bogie Frame Assembly', type: 'Bogie Assembly', manufacturer: 'Rail Coach Factory', installationDate: new Date('2019-07-20'), location: 'Bay 2 - Assembly Line', status: 'operational', usageHours: 8900, temperature: 45, failureCount: 1 },
      { equipmentId: 'BRK-003', equipmentName: 'DAKO Brake System', type: 'Brake System', manufacturer: 'Knorr-Bremse', installationDate: new Date('2017-01-10'), location: 'Bay 3 - Testing Zone', status: 'under-maintenance', usageHours: 18200, temperature: 88, failureCount: 7 },
      { equipmentId: 'ELC-004', equipmentName: 'Traction Motor Assembly', type: 'Electrical System', manufacturer: 'BHEL', installationDate: new Date('2020-05-12'), location: 'Bay 4 - Electrical', status: 'operational', usageHours: 5600, temperature: 55, failureCount: 0 },
      { equipmentId: 'HVC-005', equipmentName: 'Roof-Mounted AC Package', type: 'HVAC System', manufacturer: 'Stone India Ltd', installationDate: new Date('2021-09-01'), location: 'Bay 5 - Climate Control', status: 'operational', usageHours: 3200, temperature: 38, failureCount: 1 },
      { equipmentId: 'SIG-006', equipmentName: 'ETCS Level-2 Signaling', type: 'Signaling Equipment', manufacturer: 'Alstom', installationDate: new Date('2016-11-25'), location: 'Signal Room - A Block', status: 'critical', usageHours: 22000, temperature: 95, failureCount: 12 },
      { equipmentId: 'TRK-007', equipmentName: 'Rail Grinding Machine', type: 'Track Equipment', manufacturer: 'Plasser & Theurer', installationDate: new Date('2015-06-18'), location: 'Track Yard - Section C', status: 'operational', usageHours: 15800, temperature: 65, failureCount: 4 },
      { equipmentId: 'CUP-008', equipmentName: 'Tight-Lock Coupler', type: 'Coupling System', manufacturer: 'Escorts Ltd', installationDate: new Date('2022-02-14'), location: 'Bay 6 - Assembly', status: 'operational', usageHours: 2100, temperature: 32, failureCount: 0 },
      { equipmentId: 'PWR-009', equipmentName: '25kV Power Transformer', type: 'Power Transformer', manufacturer: 'ABB India', installationDate: new Date('2014-08-30'), location: 'Sub-Station Alpha', status: 'under-maintenance', usageHours: 25000, temperature: 102, failureCount: 9 },
      { equipmentId: 'PAN-010', equipmentName: 'Carbon Strip Pantograph', type: 'Pantograph', manufacturer: 'Schunk India', installationDate: new Date('2020-12-05'), location: 'Overhead Line Section', status: 'operational', usageHours: 4800, temperature: 48, failureCount: 2 },
    ];

    const equipment = await Equipment.insertMany(equipmentData.map(e => ({ ...e, createdBy: admin._id })));

    // Create Maintenance Records
    console.log('🔩 Creating maintenance records...');
    const maintenanceData = [
      { equipment: equipment[0]._id, maintenanceDate: new Date('2024-12-01'), maintenanceType: 'preventive', technician: tech1._id, scheduledBy: engineer._id, remarks: 'Routine engine inspection completed. Oil changed.', status: 'completed', priority: 'medium', cost: 15000, duration: 8 },
      { equipment: equipment[2]._id, maintenanceDate: new Date('2025-01-15'), maintenanceType: 'corrective', technician: tech2._id, scheduledBy: engineer._id, remarks: 'Brake pad replacement due to excessive wear.', status: 'completed', priority: 'high', cost: 28000, duration: 12 },
      { equipment: equipment[5]._id, maintenanceDate: new Date('2025-02-20'), maintenanceType: 'emergency', technician: tech1._id, scheduledBy: admin._id, remarks: 'Critical signal failure. Board replaced.', status: 'completed', priority: 'critical', cost: 45000, duration: 6 },
      { equipment: equipment[8]._id, maintenanceDate: new Date('2025-03-10'), maintenanceType: 'predictive', technician: tech2._id, scheduledBy: engineer._id, remarks: 'Transformer oil analysis showed degradation.', status: 'in-progress', priority: 'high', cost: 35000, duration: 16 },
      { equipment: equipment[1]._id, maintenanceDate: new Date('2025-04-05'), maintenanceType: 'routine-inspection', technician: tech1._id, scheduledBy: engineer._id, remarks: 'Scheduled quarterly inspection.', nextMaintenanceDate: new Date('2025-07-05'), status: 'scheduled', priority: 'low', cost: 5000, duration: 4 },
      { equipment: equipment[6]._id, maintenanceDate: new Date('2025-03-25'), maintenanceType: 'preventive', technician: tech2._id, scheduledBy: engineer._id, remarks: 'Grinding wheel replacement and calibration.', status: 'completed', priority: 'medium', cost: 22000, duration: 10 },
    ];
    await Maintenance.insertMany(maintenanceData);

    // Create Alerts
    console.log('🔔 Creating alerts...');
    const alertData = [
      { equipment: equipment[5]._id, type: 'critical-failure', severity: 'critical', message: 'ETCS Level-2 Signaling (SIG-006) has 12 recorded failures. Immediate attention required.' },
      { equipment: equipment[8]._id, type: 'high-temperature', severity: 'critical', message: '25kV Power Transformer (PWR-009) temperature at 102°C — exceeds safe operating limit.' },
      { equipment: equipment[2]._id, type: 'maintenance-due', severity: 'warning', message: 'DAKO Brake System (BRK-003) maintenance is overdue by 15 days.' },
      { equipment: equipment[0]._id, type: 'usage-limit', severity: 'warning', message: 'WAP-7 Locomotive (LOC-001) approaching 15,000 hour service interval.' },
      { equipment: equipment[6]._id, type: 'prediction-alert', severity: 'info', message: 'ML prediction suggests Rail Grinding Machine (TRK-007) may need maintenance within 30 days.' },
    ];
    await Alert.insertMany(alertData);

    console.log('\n✅ Seed data created successfully!');
    console.log('📧 Login credentials:');
    console.log('   Admin:      admin@railguard.in / admin123');
    console.log('   Engineer:   engineer@railguard.in / engineer123');
    console.log('   Technician: tech1@railguard.in / tech123');
    console.log('   Technician: tech2@railguard.in / tech123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
