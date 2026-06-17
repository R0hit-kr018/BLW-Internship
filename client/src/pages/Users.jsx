import { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser } from '../services/api.js';
import { register } from '../services/api.js';
import { Users as UsersIcon, Plus, Search, Shield, X, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'engineer', 'technician'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'technician', department: '', phone: '' });

  useEffect(() => { fetchUsers(); }, [search]);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers({ search });
      setUsers(data.users);
    } catch {
      setUsers(getDemoUsers());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateUser(editItem._id, formData);
        toast.success('User updated');
      } else {
        await register(formData);
        toast.success('User created');
      }
      setShowModal(false); setEditItem(null); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await deleteUser(id); toast.success('User deleted'); fetchUsers(); } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const roleColor = (r) => ({ admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30', engineer: 'bg-blue-500/15 text-blue-400 border-blue-500/30', technician: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }[r] || 'bg-slate-500/15 text-slate-400');

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><UsersIcon className="w-6 h-6 text-amber-400" /> User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage system users and access control</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormData({ name: '', email: '', password: '', role: 'technician', department: '', phone: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="rail-input pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? [1,2,3,4].map(i => <div key={i} className="h-48 skeleton" />) :
        users.map(u => (
          <div key={u._id || u.email} className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg font-bold text-slate-900">
                  {u.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{u.name}</h3>
                  <span className={`${roleColor(u.role)} text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold border inline-block mt-1`}>{u.role}</span>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${u.isActive !== false ? 'bg-emerald-400' : 'bg-red-400'}`} title={u.isActive !== false ? 'Active' : 'Inactive'} />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Mail className="w-3.5 h-3.5" /> {u.email}</div>
              {u.phone && <div className="flex items-center gap-2 text-xs text-slate-400"><Phone className="w-3.5 h-3.5" /> {u.phone}</div>}
              {u.department && <div className="flex items-center gap-2 text-xs text-slate-400"><Shield className="w-3.5 h-3.5" /> {u.department}</div>}
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
              <button onClick={() => { setEditItem(u); setFormData({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', phone: u.phone || '' }); setShowModal(true); }} className="btn-secondary !py-1.5 !px-3 !text-xs flex-1">Edit</button>
              <button onClick={() => handleToggleActive(u)} className={`!py-1.5 !px-3 !text-xs flex-1 ${u.isActive !== false ? 'btn-danger' : 'btn-primary'}`}>{u.isActive !== false ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => handleDelete(u._id)} className="btn-danger !py-1.5 !px-2 !text-xs">Del</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-md !rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit User' : 'Create User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700/30"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1 font-medium">Name</label><input className="rail-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-xs text-slate-400 mb-1 font-medium">Email</label><input type="email" className="rail-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
              {!editItem && <div><label className="block text-xs text-slate-400 mb-1 font-medium">Password</label><input type="password" className="rail-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} /></div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Role</label><select className="rail-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label className="block text-xs text-slate-400 mb-1 font-medium">Department</label><input className="rail-input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1 font-medium">Phone</label><input className="rail-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getDemoUsers() {
  return [
    { _id: '1', name: 'Rajesh Kumar', email: 'admin@railguard.in', role: 'admin', department: 'Management', phone: '9876543210', isActive: true },
    { _id: '2', name: 'Priya Sharma', email: 'engineer@railguard.in', role: 'engineer', department: 'Mechanical', phone: '9876543211', isActive: true },
    { _id: '3', name: 'Amit Singh', email: 'tech1@railguard.in', role: 'technician', department: 'Electrical', phone: '9876543212', isActive: true },
    { _id: '4', name: 'Vikram Patel', email: 'tech2@railguard.in', role: 'technician', department: 'Mechanical', phone: '9876543213', isActive: true },
  ];
}
