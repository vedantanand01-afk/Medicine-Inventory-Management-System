import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

const Navbar = ({ onToggleSidebar, onQuickSale, onQuickStockIn }) => {
  const navigate = useNavigate();
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts/summary');
        if (res.data && res.data.success) {
          setAlertsSummary(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch alerts summary:', err.message);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const totalAlerts = alertsSummary?.totalAlerts || 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Online</span>
          <span className="text-slate-300">|</span>
          <Clock className="w-3.5 h-3.5" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Right side: Quick Actions & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Sale Button */}
        <button
          onClick={onQuickSale}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">New Sale</span>
        </button>

        {/* Quick Stock-In Button */}
        <button
          onClick={onQuickStockIn}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Stock In</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Inventory Alerts
                </p>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  {totalAlerts} Attention Items
                </span>
              </div>

              <div className="p-3 space-y-2">
                {alertsSummary?.outOfStockCount > 0 && (
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-semibold text-rose-800">
                        Out of Stock Medicines
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-700">
                      {alertsSummary.outOfStockCount}
                    </span>
                  </div>
                )}

                {alertsSummary?.lowStockCount > 0 && (
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">
                        Low Stock Items
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-700">
                      {alertsSummary.lowStockCount}
                    </span>
                  </div>
                )}

                {alertsSummary?.expiredCount > 0 && (
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between cursor-pointer hover:bg-red-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-semibold text-red-800">
                        Expired Medicines
                      </span>
                    </div>
                    <span className="text-xs font-bold text-red-700">
                      {alertsSummary.expiredCount}
                    </span>
                  </div>
                )}

                {alertsSummary?.nearExpiryCount > 0 && (
                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                    className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between cursor-pointer hover:bg-orange-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-800">
                        Near Expiry (&lt;30 days)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-orange-700">
                      {alertsSummary.nearExpiryCount}
                    </span>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    All inventory levels and expiry dates are optimal!
                  </div>
                )}
              </div>

              <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/alerts');
                  }}
                  className="w-full py-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 text-center flex items-center justify-center gap-1 hover:underline"
                >
                  <span>View All Alerts</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
