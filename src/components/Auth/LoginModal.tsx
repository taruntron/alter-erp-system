import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Authentication & RBAC Portal</h3>
              <p className="text-[11px] text-slate-400">Role-Based Access Control</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 bg-rose-950/80 border border-rose-800 text-rose-300 rounded text-[11px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-bold mb-1">Firebase Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-black text-white bg-purple-700 hover:bg-purple-600 shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Connecting to Firebase...' : 'Sign In to Firebase Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
