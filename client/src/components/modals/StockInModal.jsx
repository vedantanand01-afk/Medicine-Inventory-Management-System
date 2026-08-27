import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PlusCircle, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const StockInModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMedicine = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [medsRes, supsRes] = await Promise.all([
          api.get('/medicines'),
          api.get('/suppliers'),
        ]);

        if (medsRes.data.success) setMedicines(medsRes.data.data);
        if (supsRes.data.success) setSuppliers(supsRes.data.data);

        if (preselectedMedicine) {
          setSelectedMedicineId(preselectedMedicine._id);
          setUnitCost(preselectedMedicine.costPrice || preselectedMedicine.unitPrice || '');
          if (preselectedMedicine.supplier) {
            setSupplierId(
              preselectedMedicine.supplier._id || preselectedMedicine.supplier
            );
          }
        } else if (medsRes.data.data.length > 0) {
          const first = medsRes.data.data[0];
          setSelectedMedicineId(first._id);
          setUnitCost(first.costPrice || first.unitPrice || '');
          if (first.supplier) {
            setSupplierId(first.supplier._id || first.supplier);
          }
        }
      } catch (err) {
        console.error('Failed to load stock in data:', err);
      }
    };

    if (isOpen) {
      loadData();
      setQuantity('');
      setNotes('');
    }
  }, [isOpen, preselectedMedicine]);

  const handleMedicineChange = (e) => {
    const medId = e.target.value;
    setSelectedMedicineId(medId);
    const med = medicines.find((m) => m._id === medId);
    if (med) {
      setUnitCost(med.costPrice || med.unitPrice || '');
      if (med.supplier) {
        setSupplierId(med.supplier._id || med.supplier);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMedicineId || !quantity || Number(quantity) <= 0) {
      showError('Please select a medicine and enter a valid quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/stock/in', {
        medicineId: selectedMedicineId,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        supplierId: supplierId || undefined,
        notes,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Stock successfully added!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMed = medicines.find((m) => m._id === selectedMedicineId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock In / Restock Shipment"
      subtitle="Receive and record new medicine inventory batches"
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
            onChange={handleMedicineChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.medicineName} ({m.medicineId}) - Batch: {m.batchNumber} [Current: {m.currentStock} units]
              </option>
            ))}
          </select>
        </div>

        {/* Selected medicine preview */}
        {selectedMed && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-emerald-900">
                {selectedMed.medicineName}
              </p>
              <p className="text-emerald-700">
                Batch: {selectedMed.batchNumber} | Location: {selectedMed.location}
              </p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-emerald-800 text-sm">
                {selectedMed.currentStock} Units
              </span>
              <p className="text-[10px] text-emerald-600">Available Stock</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Quantity to Add */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to Ingest *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unit Purchase Cost (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Origin Supplier
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.supplierName} ({s.supplierId})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Receiving Notes / Shipment PO#
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. PO-8842 shipment from central distributor"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Total Cost Calculation */}
        {quantity && unitCost && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Total Shipment Value:</span>
            <span className="text-base font-extrabold text-slate-800">
              {formatCurrency(Number(quantity) * Number(unitCost))}
            </span>
          </div>
        )}

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
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            )}
            <PlusCircle className="w-4 h-4" />
            <span>Confirm Stock In</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockInModal;
