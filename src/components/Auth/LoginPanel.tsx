import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Store,
  Building2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface LoginPanelProps {
  onSuccess?: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onSuccess }) => {
  const { loginWithUsername, activeSection } = useAuth();
  const { sections } = useStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(activeSection || (sections[0]?.name ?? 'Store Sales'));
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginWithUsername(username, password, selectedBranch);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Login failed. Please check your username and password.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        
        {/* Brand Banner Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Store className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            ApexSaaS ERP & POS
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Billing, Multi-Queue POS, Inventory & Accounting
          </p>
        </div>

        {/* Title Bar */}
        <div className="px-6 pt-5 pb-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Sign In to System
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter your operator credentials to access the terminal
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 pt-3">

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Branch Selection field */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Branch / Terminal
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-purple-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="login-branch-select"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all cursor-pointer appearance-none"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.name} className="text-slate-900 font-medium">
                      {sec.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Username field */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password field - with no restriction indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 italic">
                  Any password accepted (no word limits)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-purple-700 focus:ring-purple-500 border-slate-300"
                />
                <span>Remember my session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Enter ApexSaaS ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

