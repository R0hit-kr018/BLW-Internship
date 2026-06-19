import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutDashboard, Train, Wrench, Bell, FileText, Users, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'engineer', 'technician'] },
  { path: '/equipment', label: 'Equipment', icon: Train, roles: ['admin', 'engineer', 'technician'] },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'engineer', 'technician'] },
  { path: '/alerts', label: 'Smart Alerts', icon: Bell, roles: ['admin', 'engineer', 'technician'] },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'engineer'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();

  return (
    <aside className={`fixed lg:relative left-0 top-0 h-full lg:h-screen z-40 lg:z-0 transition-all duration-300 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] border-r border-slate-700/50 ${open ? 'translate-x-0 w-64 lg:w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 w-full justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Train className="w-5 h-5 text-slate-900" />
          </div>
          {open && (
            <div className="animate-fade-in flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">RailGuard</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">AI Maintenance</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3 flex-1">
        <div className={`${open ? 'px-3' : 'px-0 text-center'} mb-4`}>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{open ? 'Navigation' : '•••'}</span>
        </div>
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                } ${!open ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* User info - Compact avatar when collapsed */}
      <div className={`absolute bottom-16 left-3 right-3 transition-all duration-300`}>
        {open ? (
          <div className="glass-card p-3 !rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400 capitalize font-medium">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-slate-900 shadow-md" title={`${user?.name} (${user?.role})`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom toggle button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center border-t border-slate-700/30 pt-3">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-amber-500 hover:border-amber-400 transition-colors group cursor-pointer"
          title={open ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {open
            ? <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
            : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          }
        </button>
      </div>
    </aside>
  );
}
