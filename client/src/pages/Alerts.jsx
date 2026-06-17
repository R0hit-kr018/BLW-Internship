import { useState, useEffect } from 'react';
import { getAlerts, resolveAlert, markAlertRead } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle, Filter, Info, AlertOctagon, Thermometer } from 'lucide-react';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  critical: { icon: AlertOctagon, bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400' },
};

export default function Alerts() {
  const { hasRole } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => { fetchAlerts(); }, [severityFilter, showResolved]);

  const fetchAlerts = async () => {
    try {
      const { data } = await getAlerts({ severity: severityFilter, resolved: showResolved ? 'true' : 'false' });
      setAlerts(data.alerts);
    } catch {
      setAlerts(getDemoAlerts());
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch { toast.error('Failed to resolve'); }
  };

  const counts = { critical: alerts.filter(a => a.severity === 'critical').length, warning: alerts.filter(a => a.severity === 'warning').length, info: alerts.filter(a => a.severity === 'info').length };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-400" /> Smart Alerts
        </h1>
        <p className="text-sm text-slate-400 mt-1">AI-powered alerts and notifications for equipment health</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Critical', count: counts.critical, color: 'red', icon: AlertOctagon },
          { label: 'Warning', count: counts.warning, color: 'amber', icon: AlertTriangle },
          { label: 'Info', count: counts.info, color: 'blue', icon: Info },
        ].map(s => (
          <button key={s.label} onClick={() => setSeverityFilter(severityFilter === s.label.toLowerCase() ? '' : s.label.toLowerCase())}
            className={`glass-card p-4 flex items-center gap-4 transition-all ${severityFilter === s.label.toLowerCase() ? `border-${s.color}-500/40` : ''}`}>
            <div className={`w-12 h-12 rounded-xl bg-${s.color}-500/10 flex items-center justify-center`}>
              <s.icon className={`w-6 h-6 text-${s.color}-400`} />
            </div>
            <div className="text-left">
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.count}</p>
              <p className="text-xs text-slate-500">{s.label} Alerts</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setShowResolved(!showResolved)} className={`btn-secondary !text-xs ${showResolved ? '!bg-amber-500/20 !text-amber-400 !border-amber-500/30' : ''}`}>
          {showResolved ? 'Show Unresolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 skeleton" />)
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">All clear!</p>
            <p className="text-sm text-slate-500">No unresolved alerts at this time.</p>
          </div>
        ) : alerts.map((alert, i) => {
          const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
          const Icon = config.icon;
          return (
            <div key={alert._id || i} className={`glass-card p-5 ${config.border} animate-fade-in`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${config.badge} text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold`}>{alert.severity}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{alert.type?.replace(/-/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-slate-200 mb-1">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{alert.equipment?.equipmentName || alert.equipment?.equipmentId || 'Equipment'}</span>
                    <span>•</span>
                    <span>{new Date(alert.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
                {hasRole('admin', 'engineer') && !alert.isResolved && (
                  <button onClick={() => handleResolve(alert._id)} className="btn-primary !py-1.5 !px-3 !text-xs flex-shrink-0">
                    Resolve
                  </button>
                )}
                {alert.isResolved && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-lg font-medium flex-shrink-0">Resolved</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDemoAlerts() {
  return [
    { _id: '1', severity: 'critical', type: 'critical-failure', message: 'ETCS Level-2 Signaling (SIG-006) has 12 recorded failures. Immediate attention required.', equipment: { equipmentName: 'ETCS Signaling', equipmentId: 'SIG-006' }, createdAt: new Date(), isResolved: false },
    { _id: '2', severity: 'critical', type: 'high-temperature', message: '25kV Power Transformer (PWR-009) temperature at 102°C — exceeds safe operating limit.', equipment: { equipmentName: 'Power Transformer', equipmentId: 'PWR-009' }, createdAt: new Date(), isResolved: false },
    { _id: '3', severity: 'warning', type: 'maintenance-due', message: 'DAKO Brake System (BRK-003) maintenance is overdue by 15 days.', equipment: { equipmentName: 'Brake System', equipmentId: 'BRK-003' }, createdAt: new Date(), isResolved: false },
    { _id: '4', severity: 'warning', type: 'usage-limit', message: 'WAP-7 Locomotive (LOC-001) approaching 15,000 hour service interval.', equipment: { equipmentName: 'WAP-7 Locomotive', equipmentId: 'LOC-001' }, createdAt: new Date(), isResolved: false },
    { _id: '5', severity: 'info', type: 'prediction-alert', message: 'ML prediction suggests Rail Grinding Machine (TRK-007) may need maintenance within 30 days.', equipment: { equipmentName: 'Rail Grinding Machine', equipmentId: 'TRK-007' }, createdAt: new Date(), isResolved: false },
  ];
}
