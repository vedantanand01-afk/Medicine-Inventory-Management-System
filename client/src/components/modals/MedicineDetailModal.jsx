import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import api from '../../services/api';
import {
  Pill,
  Calendar,
  Layers,
  MapPin,
  DollarSign,
  Truck,
  Clock,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../utils/formatters';

const MedicineDetailModal = ({ isOpen, onClose, medicineId, onEdit }) => {
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!medicineId) return;
      setLoading(true);
      try {
        const res = await api.get(`/medicines/${medicineId}`);
        if (res.data.success) {
          setMedicine(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load medicine details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && medicineId) {
      fetchDetails();
    }
  }, [isOpen, medicineId]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine?.medicineName || 'Medicine Specification'}
      subtitle={`Medicine ID: ${medicine?.medicineId || '...'}`}
      maxWidth="max-w-2xl"
    >
      {loading || !medicine ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Card: Status & Quick Metric */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-800">
                  {medicine.medicineName}
                </h4>
                {medicine.genericName && (
                  <p className="text-xs text-slate-500 italic">
                    Generic: {medicine.genericName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={medicine.stockStatus} />
              <StatusBadge status={medicine.expiryStatus} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Available Stock
              </span>
              <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                {medicine.currentStock} Units
              </span>
              <span className="text-[10px] text-slate-500">
                Min: {medicine.reorderLevel} units
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selling Price
              </span>
              <span className="text-lg font-extrabold text-emerald-600 mt-1 block">
                {formatCurrency(medicine.unitPrice)}
              </span>
              <span className="text-[10px] text-slate-500">
                Cost: {formatCurrency(medicine.costPrice)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Expiry Date
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {formatDate(medicine.expiryDate)}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  medicine.daysUntilExpiry < 0
                    ? 'text-red-600'
                    : medicine.daysUntilExpiry <= 30
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {medicine.daysUntilExpiry < 0
                  ? 'Expired'
                  : `${medicine.daysUntilExpiry} days left`}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Storage Location
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {medicine.location || 'Shelf A1'}
              </span>
              <span className="text-[10px] text-slate-500">
                {medicine.dosageForm}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200/80">
              Technical Specifications
            </div>
            <div className="divide-y divide-slate-100 p-2">
              <div className="grid grid-cols-3 py-1.5 px-2">
                <span className="font-semibold text-slate-500">Category:</span>
                <span className="col-span-2 text-slate-800 font-medium">
                  {medicine.category}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1.5 px-2">
                <span className="font-semibold text-slate-500">Batch Number:</span>
                <span className="col-span-2 text-slate-800 font-mono font-medium">
                  {medicine.batchNumber}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1.5 px-2">
                <span className="font-semibold text-slate-500">Mfg Date:</span>
                <span className="col-span-2 text-slate-800">
                  {formatDate(medicine.manufacturingDate)}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1.5 px-2">
                <span className="font-semibold text-slate-500">Supplier:</span>
                <span className="col-span-2 text-slate-800">
                  {medicine.supplier?.supplierName} (Contact: {medicine.supplier?.phone})
                </span>
              </div>
              {medicine.description && (
                <div className="grid grid-cols-3 py-1.5 px-2">
                  <span className="font-semibold text-slate-500">Description:</span>
                  <span className="col-span-2 text-slate-700 italic">
                    {medicine.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions list */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Recent Movement Ledger
            </h5>

            <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
              {medicine.recentTransactions?.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No recorded transactions yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {medicine.recentTransactions?.map((t) => (
                    <div
                      key={t._id}
                      className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.transactionType} size="sm" />
                        <span className="font-mono text-slate-600">
                          {t.transactionId}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="font-semibold text-slate-800">
                          {t.quantity} units
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">
                          {formatCurrency(t.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {formatDate(t.transactionDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(medicine);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
              >
                Edit Medicine Details
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MedicineDetailModal;
