import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Pill, Lock, Mail, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showSuccess(`Welcome back, ${res.user.name}!`);
        const destination = location.state?.from?.pathname || '/';
        navigate(destination, { replace: true });
      } else {
        showError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      showError(
        err.response?.data?.message ||
          'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 text-white shadow-xl shadow-emerald-500/25 mb-4 animate-bounce duration-1000">
            <Pill className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Medi<span className="text-emerald-400">Core</span> ERP
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 font-medium">
            Medicine Inventory & Pharmacy Management System
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your authorized staff or administrator credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medinventory.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('admin@medinventory.com', 'Admin@123')
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin User</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  admin@medinventory.com
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickFill('pharmacist@medinventory.com', 'Pharm@123')
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Pharmacist</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  pharmacist@medinventory.com
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Apex MediCare Healthcare ERP &bull; Production Demonstration System
        </p>
      </div>
    </div>
  );
};

export default Login;
