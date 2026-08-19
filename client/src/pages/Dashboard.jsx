import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  CategoryBarChart,
  StockStatusDoughnut,
} from '../components/charts/StockOverviewChart';
import SalesTrendLineChart from '../components/charts/SalesTrendChart';
import AddMedicineModal from '../components/modals/AddMedicineModal';
import StockInModal from '../components/modals/StockInModal';
import CreateSaleModal from '../components/modals/CreateSaleModal';
import AddSupplierModal from '../components/modals/AddSupplierModal';
import InvoiceModal from '../components/modals/InvoiceModal';
import {
  Pill,
  Boxes,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  ShoppingBag,
  Truck,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stockOverview, setStockOverview] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, stockRes, trendRes, txnsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/stock-overview'),
        api.get('/dashboard/sales-trend'),
        api.get('/dashboard/recent-transactions'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (stockRes.data.success) setStockOverview(stockRes.data.data);
      if (trendRes.data.success) setSalesTrend(trendRes.data.data);
      if (txnsRes.data.success) setRecentTransactions(txnsRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-emerald-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
            Central Pharmacy Management
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inventory & Sales Dashboard
          </h2>
          <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
            Real-time monitoring of pharmaceutical stock levels, expiry timelines, and dispensary transactions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setSaleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Create Sale</span>
          </button>
          <button
            onClick={() => setStockInOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Stock In</span>
          </button>
          <button
            onClick={() => setAddMedOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all"
          >
            <Pill className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
          <button
            onClick={() => setAddSupplierOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banner (if low stock or expired medicines exist) */}
      {(stats?.lowStockItems > 0 || stats?.expiredItems > 0) && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Action Required: Inventory Warnings Detected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {stats?.expiredItems > 0 && (
                  <span className="font-semibold text-rose-700 mr-2">
                    &bull; {stats.expiredItems} Expired Medicine(s)
                  </span>
                )}
                {stats?.lowStockItems > 0 && (
                  <span className="font-semibold text-amber-800">
                    &bull; {stats.lowStockItems} Item(s) Below Reorder Level
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            <span>Review Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-time KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Medicines"
          value={stats?.totalMedicines || 0}
          subtitle="Cataloged active products"
          icon={Pill}
          colorScheme="emerald"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Total Stock Units"
          value={stats?.totalStock?.toLocaleString() || 0}
          subtitle="Available inventory across shelves"
          icon={Boxes}
          colorScheme="blue"
          onClick={() => navigate('/stock')}
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          subtitle="Items below reorder threshold"
          icon={AlertTriangle}
          colorScheme="amber"
          onClick={() => navigate('/alerts')}
        />
        <StatCard
          title="Expired / Near Expiry"
          value={`${stats?.expiredItems || 0} / ${stats?.nearExpiryItems || 0}`}
          subtitle="Expired / within 30 days"
          icon={Clock}
          colorScheme="rose"
          onClick={() => navigate('/alerts')}
        />
      </div>

      {/* Secondary Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <h4 className="text-xl font-extrabold text-slate-800 mt-1">
              {formatCurrency(stats?.salesToday || 0)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <h4 className="text-xl font-extrabold text-slate-800 mt-1">
              {formatCurrency(stats?.totalSalesRevenue || 0)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Suppliers
            </span>
            <h4 className="text-xl font-extrabold text-slate-800 mt-1">
              {stats?.totalSuppliers || 0} Vendors
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Stock Breakdown by Category
              </h3>
              <p className="text-xs text-slate-400">
                Quantity distribution across therapeutic groups
              </p>
            </div>
            <button
              onClick={() => navigate('/medicines')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CategoryBarChart
            data={stockOverview?.categoryDistribution || []}
          />
        </div>

        {/* Stock Status Doughnut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Inventory Health Ratio
            </h3>
            <p className="text-xs text-slate-400">
              Optimal vs Low vs Out of stock
            </p>
          </div>
          <div className="my-2">
            <StockStatusDoughnut
              statusData={stockOverview?.stockStatusDistribution || []}
            />
          </div>
          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            Keep out-of-stock items at 0 by restocking in advance.
          </div>
        </div>
      </div>

      {/* Sales Trend Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue & Purchase Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                7-Day Cash Flow Movement
              </h3>
              <p className="text-xs text-slate-400">
                Daily dispensary sales vs supplier restocking expenditure
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Detailed Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <SalesTrendLineChart trendData={salesTrend} />
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Recent Transactions
              </h3>
              <p className="text-xs text-slate-400">Latest ledger activity</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No recent transactions recorded.
              </p>
            ) : (
              recentTransactions.map((txn) => (
                <div
                  key={txn._id}
                  onClick={() => setSelectedInvoice(txn)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusBadge status={txn.transactionType} size="sm" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {txn.medicine?.medicineName || 'Medicine'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(txn.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-800 block">
                      {formatCurrency(txn.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {txn.quantity} units
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMedicineModal
        isOpen={addMedOpen}
        onClose={() => setAddMedOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <StockInModal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <CreateSaleModal
        isOpen={saleOpen}
        onClose={() => setSaleOpen(false)}
        onSuccess={fetchDashboardData}
        onOpenInvoice={(txn) => setSelectedInvoice(txn)}
      />
      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        transaction={selectedInvoice}
      />
    </div>
  );
};

export default Dashboard;
