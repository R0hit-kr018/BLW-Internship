import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Train, Wrench, AlertTriangle, CheckCircle, Activity, TrendingUp, Clock, Users, Zap, ShieldAlert, ThermometerSun, BarChart3 } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats(data);
    } catch (err) {
      // Use demo data if API is unavailable
      setStats(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const kpis = stats?.kpis || {};
  const statusData = [
    { name: 'Operational', value: kpis.operational || 7, color: '#10b981' },
    { name: 'Maintenance', value: kpis.underMaintenance || 2, color: '#f59e0b' },
    { name: 'Critical', value: kpis.critical || 1, color: '#ef4444' },
    { name: 'Decommissioned', value: kpis.decommissioned || 0, color: '#64748b' },
  ].filter(d => d.value > 0);

  const typeData = (stats?.typeDistribution || getDemoData().typeDistribution).map((t, i) => ({
    name: (t._id || '').replace(' ', '\n').substring(0, 15),
    count: t.count,
    fill: COLORS[i % COLORS.length],
  }));

  const trendData = stats?.monthlyTrend?.length > 0
    ? stats.monthlyTrend.map(t => ({ month: t._id, count: t.count, cost: t.cost }))
    : getDemoTrend();

  const maintenanceTypeData = (stats?.maintenanceTypes || getDemoData().maintenanceTypes).map((m, i) => ({
    name: m._id, value: m.count, color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.name}. Here's your maintenance intelligence summary.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">System Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Train} label="Total Equipment" value={kpis.totalEquipment || 10} trend="+2 this month" color="amber" />
        <KPICard icon={CheckCircle} label="Operational" value={kpis.operational || 7} trend={`${Math.round((kpis.operational || 7) / (kpis.totalEquipment || 10) * 100)}% uptime`} color="emerald" />
        <KPICard icon={Wrench} label="Under Maintenance" value={kpis.underMaintenance || 2} trend={`${kpis.scheduled || 1} scheduled`} color="blue" />
        <KPICard icon={AlertTriangle} label="Critical Alerts" value={kpis.criticalAlerts || 2} trend={`${kpis.unresolvedAlerts || 5} unresolved`} color="red" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Status Pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Equipment Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Trend */}
        <div className="glass-card p-6 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Maintenance Trend (12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#colorCount)" name="Maintenance Count" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Types */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> Equipment by Type
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {typeData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Types */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" /> Maintenance Types Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={maintenanceTypeData} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} stroke="none">
                {maintenanceTypeData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risk Equipment */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" /> Top Risk Equipment
          </h3>
          <div className="space-y-3">
            {(stats?.topRiskEquipment || getDemoRiskEquipment()).map((eq, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/20 transition-colors min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${eq.riskScore >= 70 ? 'bg-red-400 animate-pulse' : eq.riskScore >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate" title={eq.equipmentName || eq.name}>{eq.equipmentName || eq.name}</p>
                    <p className="text-xs text-slate-500 truncate">{eq.equipmentId || eq.id} • {eq.type}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${eq.riskScore >= 70 ? 'text-red-400' : eq.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {eq.riskScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{eq.predictedMaintenance || 'assessed'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Recent Alerts
          </h3>
          <div className="space-y-3">
            {(stats?.recentAlerts || getDemoAlerts()).slice(0, 5).map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-400 animate-pulse' : alert.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 line-clamp-2">{alert.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {alert.equipment?.equipmentName || 'Equipment'} • {new Date(alert.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${alert.severity === 'critical' ? 'bg-red-500/15 text-red-400' : alert.severity === 'warning' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, trend, color }) {
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };
  const c = colorMap[color] || colorMap.amber;

  return (
    <div className={`glass-card p-5 border ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className={`text-xs ${c.text} font-medium`}>{trend}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-72 skeleton" />
        <div className="h-72 skeleton col-span-2" />
      </div>
    </div>
  );
}

// Demo data fallbacks
function getDemoData() {
  return {
    kpis: { totalEquipment: 10, operational: 7, underMaintenance: 2, critical: 1, decommissioned: 0, totalMaintenance: 6, scheduled: 1, inProgress: 1, completed: 4, unresolvedAlerts: 5, criticalAlerts: 2, totalUsers: 4 },
    typeDistribution: [
      { _id: 'Locomotive Engine', count: 2 }, { _id: 'Brake System', count: 2 },
      { _id: 'Electrical System', count: 1 }, { _id: 'HVAC System', count: 1 },
      { _id: 'Signaling', count: 1 }, { _id: 'Other', count: 3 },
    ],
    maintenanceTypes: [
      { _id: 'preventive', count: 2 }, { _id: 'corrective', count: 1 },
      { _id: 'emergency', count: 1 }, { _id: 'predictive', count: 1 }, { _id: 'routine', count: 1 },
    ],
  };
}

function getDemoTrend() {
  return ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
    .map(m => ({ month: m, count: Math.floor(Math.random() * 8) + 2, cost: Math.floor(Math.random() * 50000) + 10000 }));
}

function getDemoRiskEquipment() {
  return [
    { name: 'ETCS Level-2 Signaling', id: 'SIG-006', type: 'Signaling', riskScore: 88, predictedMaintenance: 'critical' },
    { name: '25kV Power Transformer', id: 'PWR-009', type: 'Power Transformer', riskScore: 78, predictedMaintenance: 'high' },
    { name: 'DAKO Brake System', id: 'BRK-003', type: 'Brake System', riskScore: 62, predictedMaintenance: 'high' },
    { name: 'Rail Grinding Machine', id: 'TRK-007', type: 'Track Equipment', riskScore: 45, predictedMaintenance: 'medium' },
    { name: 'WAP-7 Locomotive', id: 'LOC-001', type: 'Locomotive Engine', riskScore: 38, predictedMaintenance: 'medium' },
  ];
}

function getDemoAlerts() {
  return [
    { severity: 'critical', message: 'ETCS Level-2 Signaling (SIG-006) has 12 recorded failures. Immediate attention required.', equipment: { equipmentName: 'ETCS Signaling' }, createdAt: new Date() },
    { severity: 'critical', message: '25kV Power Transformer (PWR-009) temperature at 102°C — exceeds safe limit.', equipment: { equipmentName: 'Power Transformer' }, createdAt: new Date() },
    { severity: 'warning', message: 'DAKO Brake System (BRK-003) maintenance is overdue by 15 days.', equipment: { equipmentName: 'Brake System' }, createdAt: new Date() },
    { severity: 'warning', message: 'WAP-7 Locomotive (LOC-001) approaching 15,000 hour service interval.', equipment: { equipmentName: 'WAP-7 Locomotive' }, createdAt: new Date() },
    { severity: 'info', message: 'ML prediction: Rail Grinding Machine (TRK-007) may need maintenance within 30 days.', equipment: { equipmentName: 'Rail Grinding Machine' }, createdAt: new Date() },
  ];
}
