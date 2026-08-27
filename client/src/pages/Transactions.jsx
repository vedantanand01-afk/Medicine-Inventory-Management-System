import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import CreateSaleModal from '../components/modals/CreateSaleModal';
import InvoiceModal from '../components/modals/InvoiceModal';
import { useNotification } from '../context/NotificationContext';
import {
  ArrowLeftRight,
  Search,
  Plus,
  ShoppingBag,
  Printer,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';

const Transactions = () => {
  const { showSuccess, showError } = useNotification();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (search) params.search = search;
      if (typeFilter !== 'All') params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.data);
        setTotalCount(res.data.total);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      showError('Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, startDate, endDate, currentPage, showError]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Type',
      'Medicine Name',
      'Medicine ID',
      'Quantity',
      'Unit Price (₹)',
      'Total Amount (₹)',
      'Customer / Supplier',
      'Recorded By',
      'Notes',
    ];

    const rows = transactions.map((t) => [
      t.transactionId,
      t.transactionDate ? formatDateTime(t.transactionDate) : '',
      t.transactionType,
      t.medicine?.medicineName || '',
      t.medicine?.medicineId || '',
      t.quantity,
      t.unitPrice,
      t.totalAmount,
      t.transactionType === 'SALE'
        ? t.customerName || 'Walk-in'
        : t.supplier?.supplierName || 'Vendor',
      t.user?.name || '',
      t.notes || '',
    ]);

    exportToCSV('transactions_ledger', headers, rows);
    showSuccess('Exported transactions ledger to CSV!');
  };

  const columns = [
    {
      header: 'Transaction ID & Date',
      key: 'transactionId',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 block">
            {row.transactionId}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatDateTime(row.transactionDate)}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'transactionType',
      render: (row) => <StatusBadge status={row.transactionType} size="sm" />,
    },
    {
      header: 'Medicine',
      key: 'medicine',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">
            {row.medicine?.medicineName || 'Medicine'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {row.medicine?.medicineId} &bull; Batch: {row.medicine?.batchNumber || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Qty',
      key: 'quantity',
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          {row.quantity} Units
        </span>
      ),
    },
    {
      header: 'Amount',
      key: 'totalAmount',
      render: (row) => (
        <div>
          <span
            className={`text-sm font-extrabold ${
              row.transactionType === 'SALE'
                ? 'text-emerald-600'
                : row.transactionType === 'PURCHASE'
                ? 'text-blue-600'
                : 'text-purple-600'
            }`}
          >
            {formatCurrency(row.totalAmount)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            @{formatCurrency(row.unitPrice)}/ea
          </span>
        </div>
      ),
    },
    {
      header: 'Party / Reference',
      key: 'party',
      render: (row) => (
        <div className="text-xs text-slate-600">
          {row.transactionType === 'SALE' ? (
            <div>
              <p className="font-semibold text-slate-800">
                {row.customerName || 'Walk-in Patient'}
              </p>
              {row.customerPhone && (
                <p className="text-[10px] text-slate-400">{row.customerPhone}</p>
              )}
            </div>
          ) : (
            <p className="font-semibold text-slate-800">
              {row.supplier?.supplierName || 'Direct Vendor'}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Recorded By',
      key: 'user',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.user?.name || 'Staff'}
        </span>
      ),
    },
    {
      header: 'Receipt',
      key: 'receipt',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          onClick={() => setSelectedInvoice(row)}
          title="View & Print Receipt"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 text-xs font-bold transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Receipt</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & Transaction Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of sales dispensements, restock purchases, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setSaleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filtered Sales Revenue
            </span>
            <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(summary?.totalSalesAmount || 0)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Restocking Expenses
            </span>
            <h4 className="text-2xl font-extrabold text-blue-600 mt-1">
              {formatCurrency(summary?.totalPurchaseAmount || 0)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Transactions Logged
            </span>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
              {totalCount} Records
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, medicine, patient, staff..."
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Transaction Types</option>
              <option value="SALE">Sales (Dispensed)</option>
              <option value="PURCHASE">Purchases (Restock)</option>
              <option value="ADJUSTMENT">Adjustments / Reductions</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {(search || typeFilter !== 'All' || startDate || endDate) && (
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Date & Type Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        data={transactions}
        isLoading={loading}
        emptyMessage="No transactions match your search filters"
        emptySubMessage="Try clearing date range or creating a new sale"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Sale Modal */}
      <CreateSaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSuccess={fetchTransactions}
        onOpenInvoice={(txn) => setSelectedInvoice(txn)}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        transaction={selectedInvoice}
      />
    </div>
  );
};

export default Transactions;
