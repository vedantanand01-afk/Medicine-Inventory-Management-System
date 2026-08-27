import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AddMedicineModal from '../components/modals/AddMedicineModal';
import StockInModal from '../components/modals/StockInModal';
import MedicineDetailModal from '../components/modals/MedicineDetailModal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Pill,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  Download,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';

const Medicines = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('All');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [detailMedicineId, setDetailMedicineId] = useState(null);
  const [restockMedicine, setRestockMedicine] = useState(null);
  const [deleteDialogMedicine, setDeleteDialogMedicine] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: sortBy,
      };

      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedSupplier !== 'All') params.supplier = selectedSupplier;
      if (selectedStockStatus !== 'All') params.stockStatus = selectedStockStatus;
      if (selectedExpiryStatus !== 'All') params.expiryStatus = selectedExpiryStatus;

      const res = await api.get('/medicines', { params });
      if (res.data.success) {
        setMedicines(res.data.data);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
      showError('Failed to fetch medicines catalog');
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedCategory,
    selectedSupplier,
    selectedStockStatus,
    selectedExpiryStatus,
    sortBy,
    currentPage,
    showError,
  ]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, supsRes] = await Promise.all([
          api.get('/medicines/categories'),
          api.get('/suppliers'),
        ]);
        if (catsRes.data.success) setCategories(catsRes.data.data);
        if (supsRes.data.success) setSuppliers(supsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedSupplier('All');
    setSelectedStockStatus('All');
    setSelectedExpiryStatus('All');
    setSortBy('-createdAt');
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteDialogMedicine) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/medicines/${deleteDialogMedicine._id}`);
      if (res.data.success) {
        showSuccess(`Medicine '${deleteDialogMedicine.medicineName}' deleted successfully.`);
        setDeleteDialogMedicine(null);
        fetchMedicines();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete medicine.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Medicine ID',
      'Medicine Name',
      'Generic Name',
      'Category',
      'Dosage Form',
      'Supplier',
      'Batch Number',
      'Current Stock',
      'Unit Price (₹)',
      'Cost Price (₹)',
      'Expiry Date',
      'Stock Status',
      'Expiry Status',
      'Location',
    ];

    const rows = medicines.map((m) => [
      m.medicineId,
      m.medicineName,
      m.genericName || '',
      m.category,
      m.dosageForm || 'Tablet',
      m.supplier?.supplierName || '',
      m.batchNumber,
      m.currentStock,
      m.unitPrice,
      m.costPrice || '',
      m.expiryDate ? m.expiryDate.split('T')[0] : '',
      m.stockStatus,
      m.expiryStatus,
      m.location || '',
    ]);

    exportToCSV('medicines_inventory', headers, rows);
    showSuccess('Exported medicines to CSV successfully!');
  };

  const columns = [
    {
      header: 'Medicine Info',
      key: 'medicineName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 hover:text-emerald-600 block">
              {row.medicineName}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-mono">{row.medicineId}</span>
              <span>&bull;</span>
              <span>{row.dosageForm || 'Tablet'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category & Supplier',
      key: 'category',
      render: (row) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
            {row.category}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[140px]">
            {row.supplier?.supplierName || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      header: 'Batch #',
      key: 'batchNumber',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          {row.batchNumber}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      key: 'currentStock',
      render: (row) => (
        <div>
          <span
            className={`text-sm font-extrabold ${
              row.currentStock <= 0
                ? 'text-rose-600'
                : row.currentStock <= row.reorderLevel
                ? 'text-amber-600'
                : 'text-slate-800'
            }`}
          >
            {row.currentStock} Units
          </span>
          <div className="mt-1">
            <StatusBadge status={row.stockStatus} size="sm" />
          </div>
        </div>
      ),
    },
    {
      header: 'Unit Price',
      key: 'unitPrice',
      render: (row) => (
        <div>
          <span className="font-extrabold text-sm text-slate-800">
            {formatCurrency(row.unitPrice)}
          </span>
          {row.costPrice > 0 && (
            <span className="text-[10px] text-slate-400 block">
              Cost: {formatCurrency(row.costPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700 block">
            {formatDate(row.expiryDate)}
          </span>
          <div className="mt-1">
            <StatusBadge status={row.expiryStatus} size="sm" />
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setDetailMedicineId(row._id)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRestockMedicine(row)}
            title="Restock / Stock In"
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingMedicine(row);
              setAddModalOpen(true);
            }}
            title="Edit Medicine"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setDeleteDialogMedicine(row)}
              title="Delete Medicine"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Medicine Catalog & Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage pharmaceutical stock, unit pricing, batches, and safety thresholds
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
            onClick={() => {
              setEditingMedicine(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, batch, category..."
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Expiry Status Filter */}
          <div>
            <select
              value={selectedExpiryStatus}
              onChange={(e) => {
                setSelectedExpiryStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="All">All Expiry Statuses</option>
              <option value="valid">Valid / Safe</option>
              <option value="near_expiry">Near Expiry (&lt;30d)</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Secondary row: Sorting & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 bg-transparent border-0 font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="-createdAt">Newest First</option>
              <option value="medicineName">Name (A-Z)</option>
              <option value="-unitPrice">Price: High to Low</option>
              <option value="unitPrice">Price: Low to High</option>
              <option value="expiryDate">Expiry Date: Soonest</option>
            </select>
          </div>

          {(search ||
            selectedCategory !== 'All' ||
            selectedSupplier !== 'All' ||
            selectedStockStatus !== 'All' ||
            selectedExpiryStatus !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Medicine Table */}
      <DataTable
        columns={columns}
        data={medicines}
        isLoading={loading}
        emptyMessage="No medicines match your search criteria"
        emptySubMessage="Try resetting filters or adding a new medicine to inventory"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Modals & Dialogs */}
      <AddMedicineModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingMedicine(null);
        }}
        editMedicine={editingMedicine}
        onSuccess={fetchMedicines}
      />

      <StockInModal
        isOpen={!!restockMedicine}
        onClose={() => setRestockMedicine(null)}
        preselectedMedicine={restockMedicine}
        onSuccess={fetchMedicines}
      />

      <MedicineDetailModal
        isOpen={!!detailMedicineId}
        onClose={() => setDetailMedicineId(null)}
        medicineId={detailMedicineId}
        onEdit={(med) => {
          setEditingMedicine(med);
          setAddModalOpen(true);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteDialogMedicine}
        onClose={() => setDeleteDialogMedicine(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to permanently remove '${deleteDialogMedicine?.medicineName}' and its associated stock records from the database? This action cannot be reversed.`}
        confirmText="Delete Medicine"
        isLoading={deleting}
      />
    </div>
  );
};

export default Medicines;
