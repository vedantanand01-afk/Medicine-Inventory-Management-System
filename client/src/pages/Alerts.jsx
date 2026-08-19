import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import StockInModal from '../components/modals/StockInModal';
import StockOutModal from '../components/modals/StockOutModal';
import { useNotification } from '../context/NotificationContext';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Boxes,
  Pill,
  PlusCircle,
  MinusCircle,
  Truck,
  MapPin,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';

const Alerts = () => {
  const { showError } = useNotification();
  const [activeTab, setActiveTab] = useState('low-stock'); // 'low-stock' | 'expiry'
  const [lowStockList, setLowStockList] = useState([]);
  const [expiryData, setExpiryData] = useState({ expired: [], nearExpiry: [] });
  const [loading, setLoading] = useState(true);

  // Modals
  const [restockMed, setRestockMed] = useState(null);
  const [quarantineMed, setQuarantineMed] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [lowRes, expRes] = await Promise.all([
        api.get('/alerts/low-stock'),
        api.get('/alerts/expiry'),
      ]);

      if (lowRes.data.success) setLowStockList(lowRes.data.data);
      if (expRes.data.success) setExpiryData(expRes.data.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      showError('Failed to fetch inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const totalLowStock = lowStockList.length;
  const totalExpired = expiryData.expired.length;
  const totalNearExpiry = expiryData.nearExpiry.length;

  // Low Stock Table Columns
  const lowStockColumns = [
    {
      header: 'Medicine',
      key: 'medicine',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">
              {row.medicine?.medicineName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {row.medicine?.medicineId} &bull; Batch: {row.medicine?.batchNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Stock / Reorder Level',
      key: 'quantity',
      render: (row) => (
        <div>
          <span
            className={`text-sm font-extrabold ${
              row.quantity === 0 ? 'text-rose-600' : 'text-amber-600'
            }`}
          >
            {row.quantity} / {row.reorderLevel} Units
          </span>
          <p className="text-[10px] text-slate-400">
            Deficit: {row.deficit} units required
          </p>
        </div>
      ),
    },
    {
      header: 'Supplier Contact',
      key: 'supplier',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">
            {row.medicine?.supplier?.supplierName || 'N/A'}
          </p>
          <p className="text-[10px] text-slate-400">
            {row.medicine?.supplier?.phone || 'No phone'}
          </p>
        </div>
      ),
    },
    {
      header: 'Storage Location',
      key: 'location',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.location || 'Shelf A1'}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          onClick={() => setRestockMed(row.medicine)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Restock</span>
        </button>
      ),
    },
  ];

  // Expiry Table Columns
  const expiryColumns = [
    {
      header: 'Medicine',
      key: 'medicineName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
              row.status === 'expired'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">
              {row.medicineName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {row.medicineId} &bull; Batch: {row.batchNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Expiry Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      render: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            {formatDate(row.expiryDate)}
          </span>
          <span
            className={`text-[10px] font-bold ${
              row.daysUntilExpiry < 0 ? 'text-red-600' : 'text-orange-600'
            }`}
          >
            {row.daysUntilExpiry < 0
              ? `Expired ${Math.abs(row.daysUntilExpiry)} days ago`
              : `${row.daysUntilExpiry} days remaining`}
          </span>
        </div>
      ),
    },
    {
      header: 'Stock Units at Risk',
      key: 'currentStock',
      render: (row) => (
        <div>
          <span className="text-sm font-extrabold text-slate-800">
            {row.currentStock} Units
          </span>
          <p className="text-[10px] text-slate-400">
            Val: {formatCurrency(row.currentStock * (row.unitPrice || 0))}
          </p>
        </div>
      ),
    },
    {
      header: 'Storage Location',
      key: 'location',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.location || 'Shelf A1'}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'expired' ? (
            <button
              onClick={() => setQuarantineMed(row)}
              disabled={row.currentStock <= 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Discard / Quarantine</span>
            </button>
          ) : (
            <button
              onClick={() => setRestockMed(row)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Order Fresh Batch</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Expiry & Low Stock Safety Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated risk monitor for depleted stocks, expired batches, and products nearing 30-day expiry
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('low-stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'low-stock'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Low & Out of Stock
              </span>
              <h4 className="text-2xl font-extrabold text-amber-900 mt-1">
                {totalLowStock} Alerts
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('expiry')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'expiry'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Expired Products
              </span>
              <h4 className="text-2xl font-extrabold text-rose-900 mt-1">
                {totalExpired} Batches
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('expiry')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'expiry'
              ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-500/20'
              : 'bg-white border-slate-200/80 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Near Expiry (&le;30 Days)
              </span>
              <h4 className="text-2xl font-extrabold text-orange-900 mt-1">
                {totalNearExpiry} Batches
              </h4>
            </div>
            <div className="p-3 rounded-xl bg-orange-100 text-orange-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('low-stock')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'low-stock'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low Stock Monitor ({totalLowStock})</span>
        </button>

        <button
          onClick={() => setActiveTab('expiry')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'expiry'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Expiry Date Tracking ({totalExpired + totalNearExpiry})</span>
        </button>
      </div>

      {/* Table Views */}
      {activeTab === 'low-stock' ? (
        <DataTable
          columns={lowStockColumns}
          data={lowStockList}
          isLoading={loading}
          emptyMessage="No medicines are currently at low stock"
          emptySubMessage="All inventory items are stocked above their reorder thresholds"
        />
      ) : (
        <DataTable
          columns={expiryColumns}
          data={[...expiryData.expired, ...expiryData.nearExpiry]}
          isLoading={loading}
          emptyMessage="No expired or near-expiry medicines found"
          emptySubMessage="All stored medicines have safe, valid expiration dates"
        />
      )}

      {/* Modals */}
      <StockInModal
        isOpen={!!restockMed}
        onClose={() => setRestockMed(null)}
        preselectedMedicine={restockMed}
        onSuccess={fetchAlerts}
      />

      <StockOutModal
        isOpen={!!quarantineMed}
        onClose={() => setQuarantineMed(null)}
        preselectedMedicine={quarantineMed}
        onSuccess={fetchAlerts}
      />
    </div>
  );
};

export default Alerts;
