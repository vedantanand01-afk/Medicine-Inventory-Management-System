import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { MinusCircle, AlertTriangle } from 'lucide-react';

const REASONS = [
  'Damaged / Broken Packaging',
  'Quarantine / Discard Expired Stock',
  'Inventory Count Adjustment',
  'Clinical Sample / Internal Dispensing',
  'Other',
];

const StockOutModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMedicine = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadMeds = async () => {
      try {
        const res = await api.get('/medicines');
        if (res.data.success) {
          setMedicines(res.data.data);
          if (preselectedMedicine) {
            setSelectedMedicineId(preselectedMedicine._id);
          } else if (res.data.data.length > 0) {
            setSelectedMedicineId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load medicines:', err);
      }
    };

    if (isOpen) {
      loadMeds();
      setQuantity('');
      setNotes('');
    }
  }, [isOpen, preselectedMedicine]);

  const selectedMed = medicines.find((m) => m._id === selectedMedicineId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMedicineId || !quantity || Number(quantity) <= 0) {
      showError('Please enter a valid deduction quantity.');
      return;
    }

    if (selectedMed && Number(quantity) > selectedMed.currentStock) {
      showError(
        `Requested deduction (${quantity}) exceeds current available stock (${selectedMed.currentStock}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/stock/out', {
        medicineId: selectedMedicineId,
        quantity: Number(quantity),
        reason,
        notes,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Stock updated successfully!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Out / Inventory Reduction"
      subtitle="Record damage, disposal, or manual inventory adjustments"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medicine Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Medicine *
          </label>
          <select
            value={selectedMedicineId}
            onChange={(e) => setSelectedMedicineId(e.target.value)}
            required
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.medicineName} ({m.medicineId}) - Batch: {m.batchNumber} [Available: {m.currentStock} units]
              </option>
            ))}
          </select>
        </div>

        {/* Selected preview */}
        {selectedMed && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-amber-900">
                {selectedMed.medicineName}
              </p>
              <p className="text-amber-700">
                Batch: {selectedMed.batchNumber} | Location: {selectedMed.location}
              </p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-amber-900 text-sm">
                {selectedMed.currentStock} Units
              </span>
              <p className="text-[10px] text-amber-700">Current Stock</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to Deduct *
            </label>
            <input
              type="number"
              min="1"
              max={selectedMed ? selectedMed.currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 5"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Adjustment Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Details & Incident Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            placeholder="Explain reason for manual stock reduction..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            )}
            <MinusCircle className="w-4 h-4" />
            <span>Confirm Stock Reduction</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockOutModal;
