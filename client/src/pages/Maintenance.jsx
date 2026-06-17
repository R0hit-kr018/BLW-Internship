import { useState, useEffect } from 'react';
import { getMaintenanceRecords, createMaintenance, updateMaintenance, deleteMaintenance, getEquipment } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Search, X, Wrench, Calendar, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES = ['preventive', 'corrective', 'predictive', 'emergency', 'routine-inspection'];
const STATUSES = ['scheduled', 'in-progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function Maintenance() {
  const { hasRole, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({ equipment: '', maintenanceDate: '', maintenanceType: 'preventive', technician: '', remarks: '', nextMaintenanceDate: '', status: 'scheduled', priority: 'medium', cost: 0, duration: 0 });

  useEffect(() => { fetchRecords(); fetchEquipment(); }, [statusFilter]);

  const fetchRecords = async () => {
    try {
      const { data } = await getMaintenanceRecords({ status: statusFilter });
      setRecords(data.records);
    } catch {
      setRecords(getDemoRecords());
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data } = await getEquipment({ limit: 100 });
      setEquipmentList(data.equipment);
    } catch { setEquipmentList([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateMaintenance(editItem._id, formData);
        toast.success('Record updated');
      } else {
        await createMaintenance({ ...formData, technician: formData.technician || user._id });
        toast.success('Maintenance scheduled');
      }
      setShowModal(false); setEditItem(null); fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await deleteMaintenance(id); toast.success('Deleted'); fetchRecords(); } catch { toast.error('Failed'); }
  };

  const statusColor = (s) => ({ 'scheduled': 'bg-blue-500/15 text-blue-400', 'in-progress': 'bg-amber-500/15 text-amber-400', 'completed': 'bg-emerald-500/15 text-emerald-400', 'cancelled': 'bg-slate-500/15 text-slate-400' }[s] || 'bg-slate-500/15 text-slate-400');
  const priorityColor = (p) => ({ 'low': 'priority-low', 'medium': 'priority-medium', 'high': 'priority-high', 'critical': 'priority-critical' }[p] || '');

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Records</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage all maintenance activities</p>
        </div>
        {hasRole('admin', 'engineer') && (
          <button onClick={() => { setEditItem(null); setFormData({ equipment: '', maintenanceDate: new Date().toISOString().split('T')[0], maintenanceType: 'preventive', technician: '', remarks: '', nextMaintenanceDate: '', status: 'scheduled', priority: 'medium', cost: 0, duration: 0 }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Schedule Maintenance</button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:border-slate-600'}`}>
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="rail-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Type</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Technician</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => <tr key={i}><td colSpan={9}><div className="h-6 skeleton w-full" /></td></tr>)
              ) : records.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-500 py-12">No maintenance records found</td></tr>
              ) : records.map(r => (
                <tr key={r._id || Math.random()}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{r.equipment?.equipmentName || 'Equipment'}</p>
                        <p className="text-xs text-slate-500">{r.equipment?.equipmentId || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="capitalize text-xs">{r.maintenanceType?.replace('-', ' ')}</span></td>
                  <td><span className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.maintenanceDate).toLocaleDateString()}</span></td>
                  <td><span className={`${priorityColor(r.priority)} text-xs px-2 py-1 rounded-lg capitalize font-medium`}>{r.priority}</span></td>
                  <td><span className={`${statusColor(r.status)} text-xs px-2 py-1 rounded-lg capitalize font-medium`}>{r.status?.replace('-', ' ')}</span></td>
                  <td><span className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{r.duration || 0}h</span></td>
                  <td><span className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" />₹{(r.cost || 0).toLocaleString()}</span></td>
                  <td><span className="text-xs text-slate-400">{r.technician?.name || 'Unassigned'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      {(hasRole('admin', 'engineer') || (hasRole('technician') && r.status !== 'completed')) && (
                        <button onClick={() => { setEditItem(r); setFormData({ equipment: r.equipment?._id || '', maintenanceDate: r.maintenanceDate?.split('T')[0] || '', maintenanceType: r.maintenanceType, technician: r.technician?._id || '', remarks: r.remarks || '', nextMaintenanceDate: r.nextMaintenanceDate?.split('T')[0] || '', status: r.status, priority: r.priority, cost: r.cost || 0, duration: r.duration || 0 }); setShowModal(true); }} className="btn-secondary !py-1 !px-2 !text-xs">Edit</button>
                      )}
                      {hasRole('admin') && (
                        <button onClick={() => handleDelete(r._id)} className="btn-danger !py-1 !px-2 !text-xs">Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto !rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Update Maintenance' : 'Schedule Maintenance'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700/30"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Equipment</label>
                  <select className="rail-input" value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})} required>
                    <option value="">Select...</option>
                    {equipmentList.map(eq => <option key={eq._id} value={eq._id}>{eq.equipmentId} - {eq.equipmentName}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Type</label><select className="rail-input" value={formData.maintenanceType} onChange={e => setFormData({...formData, maintenanceType: e.target.value})}>{TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Date</label><input type="date" className="rail-input" value={formData.maintenanceDate} onChange={e => setFormData({...formData, maintenanceDate: e.target.value})} required /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Next Maintenance</label><input type="date" className="rail-input" value={formData.nextMaintenanceDate} onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})} /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Priority</label><select className="rail-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Status</label><select className="rail-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Cost (₹)</label><input type="number" className="rail-input" value={formData.cost} onChange={e => setFormData({...formData, cost: +e.target.value})} /></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Duration (hrs)</label><input type="number" className="rail-input" value={formData.duration} onChange={e => setFormData({...formData, duration: +e.target.value})} /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1 font-medium">Remarks</label><textarea className="rail-input h-20 resize-none" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Schedule'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getDemoRecords() {
  return [
    { _id: '1', equipment: { equipmentName: 'WAP-7 Locomotive', equipmentId: 'LOC-001' }, maintenanceType: 'preventive', maintenanceDate: '2024-12-01', priority: 'medium', status: 'completed', duration: 8, cost: 15000, technician: { name: 'Amit Singh' } },
    { _id: '2', equipment: { equipmentName: 'DAKO Brake System', equipmentId: 'BRK-003' }, maintenanceType: 'corrective', maintenanceDate: '2025-01-15', priority: 'high', status: 'completed', duration: 12, cost: 28000, technician: { name: 'Vikram Patel' } },
    { _id: '3', equipment: { equipmentName: 'ETCS Signaling', equipmentId: 'SIG-006' }, maintenanceType: 'emergency', maintenanceDate: '2025-02-20', priority: 'critical', status: 'completed', duration: 6, cost: 45000, technician: { name: 'Amit Singh' } },
    { _id: '4', equipment: { equipmentName: 'Power Transformer', equipmentId: 'PWR-009' }, maintenanceType: 'predictive', maintenanceDate: '2025-03-10', priority: 'high', status: 'in-progress', duration: 16, cost: 35000, technician: { name: 'Vikram Patel' } },
    { _id: '5', equipment: { equipmentName: 'LHB Bogie Frame', equipmentId: 'BOG-002' }, maintenanceType: 'routine-inspection', maintenanceDate: '2025-04-05', priority: 'low', status: 'scheduled', duration: 4, cost: 5000, technician: { name: 'Amit Singh' } },
  ];
}
