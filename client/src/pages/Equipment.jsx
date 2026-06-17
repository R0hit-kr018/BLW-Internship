import { useState, useEffect } from 'react';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, predictMaintenance, getAIAnalysis } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Search, Filter, Train, Thermometer, Clock, AlertTriangle, Cpu, X, Zap, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const EQUIPMENT_TYPES = ['Locomotive Engine', 'Bogie Assembly', 'Brake System', 'Electrical System', 'HVAC System', 'Signaling Equipment', 'Track Equipment', 'Coupling System', 'Suspension System', 'Power Transformer', 'Pantograph', 'Compressor', 'Other'];
const STATUS_OPTIONS = ['operational', 'under-maintenance', 'critical', 'decommissioned'];

export default function Equipment() {
  const { hasRole } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [predicting, setPredicting] = useState(null);
  const [formData, setFormData] = useState({ equipmentId: '', equipmentName: '', type: EQUIPMENT_TYPES[0], manufacturer: '', installationDate: '', location: '', status: 'operational', usageHours: 0, temperature: 25, failureCount: 0 });

  useEffect(() => { fetchEquipment(); }, [search, statusFilter]);

  const fetchEquipment = async () => {
    try {
      const { data } = await getEquipment({ search, status: statusFilter });
      setEquipment(data.equipment);
    } catch {
      setEquipment(getDemoEquipment());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateEquipment(editItem._id, formData);
        toast.success('Equipment updated');
      } else {
        await createEquipment(formData);
        toast.success('Equipment created');
      }
      setShowModal(false);
      setEditItem(null);
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    try {
      await deleteEquipment(id);
      toast.success('Equipment deleted');
      fetchEquipment();
    } catch (err) { toast.error('Delete failed'); }
  };

  const handlePredict = async (id) => {
    setPredicting(id);
    try {
      const { data } = await predictMaintenance(id);
      toast.success(`Risk: ${data.prediction.risk_level} (${data.prediction.risk_score}%)`);
      fetchEquipment();
    } catch {
      toast.error('Prediction service unavailable');
    } finally {
      setPredicting(null);
    }
  };

  const handleAIAnalysis = async (id) => {
    try {
      const { data } = await getAIAnalysis(id);
      setAiAnalysis(data);
    } catch {
      toast.error('AI Analysis unavailable');
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      equipmentId: item.equipmentId, equipmentName: item.equipmentName, type: item.type, manufacturer: item.manufacturer,
      installationDate: item.installationDate?.split('T')[0] || '', location: item.location, status: item.status,
      usageHours: item.usageHours, temperature: item.temperature, failureCount: item.failureCount,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({ equipmentId: '', equipmentName: '', type: EQUIPMENT_TYPES[0], manufacturer: '', installationDate: '', location: '', status: 'operational', usageHours: 0, temperature: 25, failureCount: 0 });
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Management</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor and manage all railway equipment</p>
        </div>
        {hasRole('admin') && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Equipment</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="rail-input pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rail-input w-auto">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
        </select>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map(eq => (
            <div key={eq._id || eq.equipmentId} className="glass-card p-5 group min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Train className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate" title={eq.equipmentName}>{eq.equipmentName}</h3>
                    <p className="text-xs text-slate-500 truncate">{eq.equipmentId} • {eq.type}</p>
                  </div>
                </div>
                <span className={`status-${eq.status} text-[10px] px-2 py-1 rounded-lg font-medium capitalize flex-shrink-0`}>
                  {eq.status?.replace('-', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricChip icon={Clock} label="Usage" value={`${eq.usageHours?.toLocaleString()} hrs`} />
                <MetricChip icon={Thermometer} label="Temp" value={`${eq.temperature}°C`} warn={eq.temperature > 80} />
                <MetricChip icon={AlertTriangle} label="Failures" value={eq.failureCount} warn={eq.failureCount > 5} />
                <MetricChip icon={Cpu} label="Age" value={`${eq.age?.toFixed(1) || '—'} yrs`} />
              </div>

              {eq.riskScore > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Risk Score</span>
                    <span className={`font-bold ${eq.riskScore >= 70 ? 'text-red-400' : eq.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{eq.riskScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${eq.riskScore >= 70 ? 'bg-red-400' : eq.riskScore >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${eq.riskScore}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
                {hasRole('admin', 'engineer') && (
                  <>
                    <button onClick={() => handlePredict(eq._id)} disabled={predicting === eq._id} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
                      {predicting === eq._id ? <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
                      Predict
                    </button>
                    <button onClick={() => handleAIAnalysis(eq._id)} className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
                      <Brain className="w-3 h-3" /> AI Analysis
                    </button>
                  </>
                )}
                {hasRole('admin', 'engineer') && (
                  <button onClick={() => openEdit(eq)} className="btn-secondary !py-1.5 !px-3 !text-xs ml-auto">Edit</button>
                )}
                {hasRole('admin') && (
                  <button onClick={() => handleDelete(eq._id)} className="btn-danger !py-1.5 !px-3 !text-xs">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto !rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Equipment' : 'Add New Equipment'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700/30"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Equipment ID</label><input className="rail-input" value={formData.equipmentId} onChange={e => setFormData({...formData, equipmentId: e.target.value})} required disabled={!!editItem} /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Name</label><input className="rail-input" value={formData.equipmentName} onChange={e => setFormData({...formData, equipmentName: e.target.value})} required /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Type</label><select className="rail-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>{EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Manufacturer</label><input className="rail-input" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} required /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Installation Date</label><input type="date" className="rail-input" value={formData.installationDate} onChange={e => setFormData({...formData, installationDate: e.target.value})} required /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Location</label><input className="rail-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Status</label><select className="rail-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Usage Hours</label><input type="number" className="rail-input" value={formData.usageHours} onChange={e => setFormData({...formData, usageHours: +e.target.value})} /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Temperature (°C)</label><input type="number" className="rail-input" value={formData.temperature} onChange={e => setFormData({...formData, temperature: +e.target.value})} /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Failure Count</label><input type="number" className="rail-input" value={formData.failureCount} onChange={e => setFormData({...formData, failureCount: +e.target.value})} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Create'} Equipment</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {aiAnalysis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAiAnalysis(null)}>
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto !rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Brain className="w-5 h-5 text-amber-400" /> AI Maintenance Analysis</h2>
              <button onClick={() => setAiAnalysis(null)} className="p-1 rounded-lg hover:bg-slate-700/30"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">{aiAnalysis.analysis}</div>
            <p className="text-xs text-slate-500 mt-4">Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricChip({ icon: Icon, label, value, warn }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${warn ? 'bg-red-500/5 border border-red-500/20' : 'bg-slate-800/40'}`}>
      <Icon className={`w-3.5 h-3.5 ${warn ? 'text-red-400' : 'text-slate-500'}`} />
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className={`text-xs font-semibold ${warn ? 'text-red-400' : 'text-slate-300'}`}>{value}</p>
      </div>
    </div>
  );
}

function getDemoEquipment() {
  return [
    { _id: '1', equipmentId: 'LOC-001', equipmentName: 'WAP-7 Locomotive Engine', type: 'Locomotive Engine', manufacturer: 'CLW', installationDate: '2018-03-15', location: 'Bay 1', status: 'operational', usageHours: 12500, temperature: 72, age: 7.2, failureCount: 3, riskScore: 38 },
    { _id: '2', equipmentId: 'BRK-003', equipmentName: 'DAKO Brake System', type: 'Brake System', manufacturer: 'Knorr-Bremse', installationDate: '2017-01-10', location: 'Bay 3', status: 'under-maintenance', usageHours: 18200, temperature: 88, age: 8.4, failureCount: 7, riskScore: 62 },
    { _id: '3', equipmentId: 'SIG-006', equipmentName: 'ETCS Level-2 Signaling', type: 'Signaling Equipment', manufacturer: 'Alstom', installationDate: '2016-11-25', location: 'Signal Room', status: 'critical', usageHours: 22000, temperature: 95, age: 9.1, failureCount: 12, riskScore: 88 },
    { _id: '4', equipmentId: 'ELC-004', equipmentName: 'Traction Motor Assembly', type: 'Electrical System', manufacturer: 'BHEL', installationDate: '2020-05-12', location: 'Bay 4', status: 'operational', usageHours: 5600, temperature: 55, age: 5.1, failureCount: 0, riskScore: 15 },
    { _id: '5', equipmentId: 'PWR-009', equipmentName: '25kV Power Transformer', type: 'Power Transformer', manufacturer: 'ABB India', installationDate: '2014-08-30', location: 'Sub-Station', status: 'under-maintenance', usageHours: 25000, temperature: 102, age: 10.8, failureCount: 9, riskScore: 78 },
    { _id: '6', equipmentId: 'HVC-005', equipmentName: 'Roof-Mounted AC Package', type: 'HVAC System', manufacturer: 'Stone India', installationDate: '2021-09-01', location: 'Bay 5', status: 'operational', usageHours: 3200, temperature: 38, age: 4.0, failureCount: 1, riskScore: 12 },
  ];
}
