import { useState, useEffect } from 'react';
import { getEquipmentReport, getMaintenanceReport, getCostReport } from '../services/api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, TrendingUp, DollarSign, Wrench, Train } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('equipment');
  const [eqReport, setEqReport] = useState([]);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const [eqRes, costRes] = await Promise.all([getEquipmentReport(), getCostReport()]);
      setEqReport(eqRes.data);
      setCostData(costRes.data);
    } catch {
      setEqReport(getDemoEqReport());
      setCostData(getDemoCostData());
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'equipment', label: 'Equipment Summary', icon: Train },
    { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6 text-amber-400" /> Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive reports and data analysis</p>
        </div>
        <button onClick={() => exportCSV(eqReport, 'equipment_report.csv')} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-slate-400 hover:text-slate-200 bg-slate-800/30 border border-slate-700/30'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="rail-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th><th>Usage (hrs)</th><th>Temp (°C)</th><th>Age (yrs)</th><th>Risk Score</th><th>Failures</th></tr>
                </thead>
                <tbody>
                  {loading ? [1,2,3].map(i => <tr key={i}><td colSpan={10}><div className="h-5 skeleton" /></td></tr>) :
                  eqReport.map((eq, i) => (
                    <tr key={i}>
                      <td className="text-xs font-mono text-amber-400">{eq.equipmentId}</td>
                      <td className="text-sm font-medium text-slate-200">{eq.equipmentName}</td>
                      <td className="text-xs text-slate-400">{eq.type}</td>
                      <td className="text-xs text-slate-400">{eq.location}</td>
                      <td><span className={`status-${eq.status} text-[10px] px-2 py-1 rounded-lg capitalize`}>{eq.status?.replace('-',' ')}</span></td>
                      <td className="text-xs">{(eq.usageHours || 0).toLocaleString()}</td>
                      <td className={`text-xs ${eq.temperature > 80 ? 'text-red-400 font-bold' : ''}`}>{eq.temperature}</td>
                      <td className="text-xs">{eq.age?.toFixed(1)}</td>
                      <td><span className={`text-xs font-bold ${(eq.riskScore || 0) >= 70 ? 'text-red-400' : (eq.riskScore || 0) >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{eq.riskScore || 0}%</span></td>
                      <td className="text-xs">{eq.failureCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usage Hours Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Usage Hours by Equipment</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eqReport.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="equipmentId" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
                <Bar dataKey="usageHours" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Usage Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Cost by Maintenance Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={(costData?.costByType || []).map((c, i) => ({ name: c._id, value: c.totalCost, count: c.count, color: COLORS[i % COLORS.length] }))} cx="50%" cy="50%" outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} stroke="none">
                  {(costData?.costByType || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} formatter={(val) => `₹${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Cost Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(costData?.costByMonth || []).map(c => ({ month: c._id, cost: c.totalCost, count: c.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} formatter={(val) => `₹${val.toLocaleString()}`} />
                <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Cost (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function getDemoEqReport() {
  return [
    { equipmentId: 'LOC-001', equipmentName: 'WAP-7 Locomotive', type: 'Locomotive Engine', location: 'Bay 1', status: 'operational', usageHours: 12500, temperature: 72, age: 7.2, riskScore: 38, failureCount: 3 },
    { equipmentId: 'BRK-003', equipmentName: 'DAKO Brake System', type: 'Brake System', location: 'Bay 3', status: 'under-maintenance', usageHours: 18200, temperature: 88, age: 8.4, riskScore: 62, failureCount: 7 },
    { equipmentId: 'SIG-006', equipmentName: 'ETCS Signaling', type: 'Signaling', location: 'Signal Room', status: 'critical', usageHours: 22000, temperature: 95, age: 9.1, riskScore: 88, failureCount: 12 },
    { equipmentId: 'PWR-009', equipmentName: 'Power Transformer', type: 'Transformer', location: 'Sub-Station', status: 'under-maintenance', usageHours: 25000, temperature: 102, age: 10.8, riskScore: 78, failureCount: 9 },
    { equipmentId: 'ELC-004', equipmentName: 'Traction Motor', type: 'Electrical', location: 'Bay 4', status: 'operational', usageHours: 5600, temperature: 55, age: 5.1, riskScore: 15, failureCount: 0 },
  ];
}

function getDemoCostData() {
  return {
    costByType: [
      { _id: 'preventive', totalCost: 37000, count: 2 }, { _id: 'corrective', totalCost: 28000, count: 1 },
      { _id: 'emergency', totalCost: 45000, count: 1 }, { _id: 'predictive', totalCost: 35000, count: 1 },
    ],
    costByMonth: [
      { _id: '2024-12', totalCost: 15000, count: 1 }, { _id: '2025-01', totalCost: 28000, count: 1 },
      { _id: '2025-02', totalCost: 45000, count: 1 }, { _id: '2025-03', totalCost: 57000, count: 2 },
    ],
  };
}
