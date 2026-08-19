import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AddSupplierModal from '../components/modals/AddSupplierModal';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Pill,
  ExternalLink,
  Download,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';

const Suppliers = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteDialogSupplier, setDeleteDialogSupplier] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/suppliers', { params });
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      showError('Failed to fetch suppliers directory');
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenDetails = async (sup) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/suppliers/${sup._id}`);
      if (res.data.success) {
        setViewSupplier(res.data.data);
      }
    } catch (err) {
      showError('Failed to load supplier details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogSupplier) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/suppliers/${deleteDialogSupplier._id}`);
      if (res.data.success) {
        showSuccess(`Supplier '${deleteDialogSupplier.supplierName}' deleted successfully.`);
        setDeleteDialogSupplier(null);
        fetchSuppliers();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete supplier.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Supplier ID',
      'Supplier Name',
      'Contact Person',
      'Phone',
      'Email',
      'Address',
      'Associated Medicines',
    ];

    const rows = suppliers.map((s) => [
      s.supplierId,
      s.supplierName,
      s.contactPerson || '',
      s.phone,
      s.email,
      s.address,
      s.medicineCount || 0,
    ]);

    exportToCSV('pharmaceutical_suppliers', headers, rows);
    showSuccess('Exported suppliers to CSV!');
  };

  const columns = [
    {
      header: 'Supplier Information',
      key: 'supplierName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span
              onClick={() => handleOpenDetails(row)}
              className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer block"
            >
              {row.supplierName}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{row.supplierId}</span>
              {row.contactPerson && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-600 font-sans">
                    Rep: {row.contactPerson}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Details',
      key: 'contact',
      render: (row) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Address / Warehouse',
      key: 'address',
      render: (row) => (
        <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{row.address}</span>
        </div>
      ),
    },
    {
      header: 'Supplied Medicines',
      key: 'medicineCount',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
        >
          <Pill className="w-3 h-3 text-emerald-600" />
          <span>{row.medicineCount || 0} Products</span>
        </button>
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
            onClick={() => handleOpenDetails(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingSupplier(row);
              setAddModalOpen(true);
            }}
            title="Edit Supplier"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setDeleteDialogSupplier(row)}
              title="Delete Supplier"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Supplier & Vendor Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized pharmaceutical distributors, contact reps, and supply contracts
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
              setEditingSupplier(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier name, contact, phone, email..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={loading}
        emptyMessage="No suppliers found in directory"
        emptySubMessage="Click 'Add Supplier' to register a pharmaceutical vendor"
      />

      {/* Add / Edit Supplier Modal */}
      <AddSupplierModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingSupplier(null);
        }}
        editSupplier={editingSupplier}
        onSuccess={fetchSuppliers}
      />

      {/* Supplier Deep Details Modal */}
      <Modal
        isOpen={!!viewSupplier}
        onClose={() => setViewSupplier(null)}
        title={viewSupplier?.supplierName || 'Supplier Details'}
        subtitle={`Supplier ID: ${viewSupplier?.supplierId}`}
        maxWidth="max-w-2xl"
      >
        {viewSupplier && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Contact Person
                </p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {viewSupplier.contactPerson || 'Direct Support'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Phone Number
                </p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {viewSupplier.phone}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Email Address
                </p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {viewSupplier.email}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Warehouse Address
                </p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {viewSupplier.address}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                Medicines Supplied by this Vendor ({viewSupplier.medicines?.length || 0})
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                {viewSupplier.medicines?.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No medicines currently associated with this supplier.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {viewSupplier.medicines?.map((m) => (
                      <div
                        key={m._id}
                        className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {m.medicineName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {m.medicineId} &bull; Batch: {m.batchNumber} &bull; {m.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-800 block">
                            {m.stock?.quantity || 0} Units
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ${m.unitPrice?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewSupplier(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialogSupplier}
        onClose={() => setDeleteDialogSupplier(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to remove supplier '${deleteDialogSupplier?.supplierName}'? The system will verify that no active medicines depend on this vendor.`}
        confirmText="Delete Supplier"
        isLoading={deleting}
      />
    </div>
  );
};

export default Suppliers;
