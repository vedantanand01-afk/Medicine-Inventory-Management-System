import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import StockInModal from '../components/modals/StockInModal';
import StockOutModal from '../components/modals/StockOutModal';
import { useNotification } from '../context/NotificationContext';
import {
  Boxes,
  Search,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  MapPin,
  Clock,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';

const Stock = () => {
  const { showSuccess, showError } = useNotification();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [selectedStockMed, setSelectedStockMed] = useState(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await api.get('/stock', { params });
      if (res.data.success) {
        setStocks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stock list:', err);
      showError('Failed to fetch stock records');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showError]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const totalUnits = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const lowStockCount = stocks.filter((s) => s.status === 'low_stock').length;
  const outOfStockCount = stocks.filter((s) => s.status === 'out_of_stock').length;

  const handleExportCSV = () => {
    const headers = [
      'Stock ID',
      'Medicine Name',
      'Medicine ID',
      'Batch Number',
      'Category',
      'Quantity',
      'Reorder Level',
      'Status',
      'Location',
      'Last Updated',
    ];

    const rows = stocks.map((s) => [
      s.stockId,
      s.medicine?.medicineName || '',
      s.medicine?.medicineId || '',
      s.medicine?.batchNumber || '',
      s.medicine?.category || '',
      s.quantity,
      s.reorderLevel,
      s.status,
      s.location || '',
      s.lastUpdated ? formatDateTime(s.lastUpdated) : '',
    ]);

    exportToCSV('stock_inventory_status', headers, rows);
    showSuccess('Exported stock data to CSV!');
  };

  const columns = [
    {
      header: 'Stock / Medicine',
      key: 'medicineName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">
              {row.medicine?.medicineName}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{row.stockId}</span>
              <span>&bull;</span>
              <span>{row.medicine?.medicineId}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Batch & Category',
      key: 'batchNumber',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 block">
            {row.medicine?.batchNumber}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.medicine?.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Shelf / Location',
      key: 'location',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.location || 'Shelf A1'}</span>
        </div>
      ),
    },
    {
      header: 'Quantity In Hand',
      key: 'quantity',
      render: (row) => (
        <div>
          <span
            className={`text-base font-black ${
              row.quantity === 0
                ? 'text-rose-600'
                : row.quantity <= row.reorderLevel
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {row.quantity} Units
          </span>
          <p className="text-[10px] text-slate-400">
            Reorder at: {row.reorderLevel} units
          </p>
        </div>
      ),
    },
    {
      header: 'Stock Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Last Updated',
      key: 'lastUpdated',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(row.lastUpdated)}
        </span>
      ),
    },
    {
      header: 'Quick Action',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setSelectedStockMed(row.medicine);
              setStockInOpen(true);
            }}
            title="Stock In / Purchase Intake"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Stock In</span>
          </button>
          <button
            onClick={() => {
              setSelectedStockMed(row.medicine);
              setStockOutOpen(true);
            }}
            disabled={row.quantity <= 0}
            title="Stock Out / Adjustment"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Stock Out</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Stock Inventory & Storage
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of medicine quantities, restock deliveries, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Stock CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedStockMed(null);
              setStockInOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Receive Stock In</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Units On Hand
            </span>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
              {totalUnits.toLocaleString()}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <h4 className="text-2xl font-extrabold text-amber-600 mt-1">
              {lowStockCount} Items
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Out of Stock (Zero Units)
            </span>
            <h4 className="text-2xl font-extrabold text-rose-600 mt-1">
              {outOfStockCount} Items
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <MinusCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock by medicine name, ID, batch, location..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="All">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (Needs Reorder)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <DataTable
        columns={columns}
        data={stocks}
        isLoading={loading}
        emptyMessage="No stock records match your filters"
        emptySubMessage="Try resetting filters or receiving a restock delivery"
      />

      {/* Modals */}
      <StockInModal
        isOpen={stockInOpen}
        onClose={() => {
          setStockInOpen(false);
          setSelectedStockMed(null);
        }}
        preselectedMedicine={selectedStockMed}
        onSuccess={fetchStocks}
      />

      <StockOutModal
        isOpen={stockOutOpen}
        onClose={() => {
          setStockOutOpen(false);
          setSelectedStockMed(null);
        }}
        preselectedMedicine={selectedStockMed}
        onSuccess={fetchStocks}
      />
    </div>
  );
};

export default Stock;
