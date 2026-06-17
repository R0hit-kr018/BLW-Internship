import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login as loginAPI } from '../services/api.js';
import { Train, Mail, Lock, ArrowRight, Shield, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await loginAPI({ email, password });
      loginUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    const creds = {
      admin: { email: 'admin@railguard.in', password: 'admin123' },
      engineer: { email: 'engineer@railguard.in', password: 'engineer123' },
      technician: { email: 'tech1@railguard.in', password: 'tech123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20 animate-pulse-glow">
            <Train className="w-12 h-12 text-slate-900" />
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent mb-4">RailGuard AI</h1>
          <p className="text-xl text-slate-400 mb-2 font-light">Intelligent Railway Maintenance</p>
          <p className="text-sm text-slate-500 mb-12">AI-Powered Equipment Maintenance Prediction System</p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Shield, label: 'Predictive Safety', desc: 'ML-powered alerts' },
              { icon: Wrench, label: 'Smart Scheduling', desc: 'Automated plans' },
              { icon: AlertTriangle, label: 'Risk Analysis', desc: 'Granite AI insights' },
            ].map((f, i) => (
              <div key={i} className="glass-card p-4 text-center !rounded-xl" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-slate-300">{f.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Train className="w-6 h-6 text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">RailGuard AI</h1>
          </div>

          <div className="glass-card p-8 !rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
            <p className="text-slate-400 text-sm mb-8">Sign in to access the maintenance dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rail-input pl-10" placeholder="admin@railguard.in" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rail-input pl-10" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 !text-base disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6">
              <p className="text-xs text-slate-500 text-center mb-3">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'engineer', 'technician'].map(role => (
                  <button key={role} onClick={() => quickLogin(role)} className="btn-secondary !py-2 !px-3 !text-xs capitalize !rounded-lg">
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            © 2025 RailGuard AI • Railway Maintenance Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}
