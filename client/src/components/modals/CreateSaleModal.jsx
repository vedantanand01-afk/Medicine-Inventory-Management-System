import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { ShoppingBag, AlertTriangle, CheckCircle2, User, Phone } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CreateSaleModal = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenInvoice,
  preselectedMedicine = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Patient');
  const [customerPhone, setCustomerPhone] = useState('');
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
            setCustomPrice(preselectedMedicine.unitPrice?.toString() || '');
          } else if (res.data.data.length > 0) {
            // Default to first valid, in-stock medicine
            const valid = res.data.data.find(
              (m) => m.expiryStatus !== 'expired' && m.currentStock > 0
            );
            const target = valid || res.data.data[0];
            setSelectedMedicineId(target._id);
            setCustomPrice(target.unitPrice?.toString() || '');
          }
        }
      } catch (err) {
        console.error('Failed to load medicines for sale:', err);
      }
    };

    if (isOpen) {
      loadMeds();
      setQuantity('1');
      setCustomerName('Walk-in Patient');
      setCustomerPhone('');
      setNotes('');
    }
  }, [isOpen, preselectedMedicine]);

  const handleMedicineChange = (e) => {
    const medId = e.target.value;
    setSelectedMedicineId(medId);
    const med = medicines.find((m) => m._id === medId);
    if (med) {
      setCustomPrice(med.unitPrice?.toString() || '');
    }
  };

  const selectedMed = medicines.find((m) => m._id === selectedMedicineId);
  const isExpired = selectedMed?.expiryStatus === 'expired';
  const isOutOfStock = (selectedMed?.currentStock || 0) <= 0;

  const unitPriceNum = Number(customPrice) || selectedMed?.unitPrice || 0;
  const qtyNum = Number(quantity) || 0;
  const totalAmount = unitPriceNum * qtyNum;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMedicineId || qtyNum <= 0) {
      showError('Please select a medicine and enter a valid quantity.');
      return;
    }

    if (isExpired) {
      showError('Cannot sell expired medicines. System security policy blocked this sale.');
      return;
    }

    if (selectedMed && qtyNum > selectedMed.currentStock) {
      showError(
        `Quantity (${qtyNum}) exceeds available stock (${selectedMed.currentStock}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transactions', {
        medicineId: selectedMedicineId,
        quantity: qtyNum,
        unitPrice: unitPriceNum,
        customerName: customerName || 'Walk-in Patient',
        customerPhone,
        notes,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Sale recorded successfully!');
        const createdTxn = res.data.data.transaction;
        onSuccess(res.data.data);
        onClose();

        // Prompt to open printable invoice
        if (onOpenInvoice && createdTxn) {
          onOpenInvoice(createdTxn);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to complete sale transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Sale Transaction"
      subtitle="Dispense medication and generate patient receipt"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medicine Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select Medicine *
          </label>
          <select
            value={selectedMedicineId}
            onChange={handleMedicineChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {medicines.map((m) => (
              <option
                key={m._id}
                value={m._id}
                disabled={m.expiryStatus === 'expired' || m.currentStock <= 0}
              >
                {m.medicineName} ({m.medicineId}) - Stock: {m.currentStock} units - Exp: {formatDate(m.expiryDate)}
                {m.expiryStatus === 'expired'
                  ? ' [EXPIRED - BLOCKED]'
                  : m.currentStock <= 0
                  ? ' [OUT OF STOCK]'
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Medicine Health & Stock Status Alert */}
        {selectedMed && (
          <div>
            {isExpired ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">CRITICAL: Medicine Has Expired!</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    This batch expired on {formatDate(selectedMed.expiryDate)}.
                    System safety protocols strictly forbid selling expired
                    products.
                  </p>
                </div>
              </div>
            ) : isOutOfStock ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Out of Stock</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Current quantity is 0. Please restock before dispensing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-900">
                    {selectedMed.medicineName} ({selectedMed.category})
                  </p>
                  <p className="text-emerald-700">
                    Batch: {selectedMed.batchNumber} | Expiry: {formatDate(selectedMed.expiryDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-800 text-sm">
                    {selectedMed.currentStock} Units Available
                  </span>
                  <p className="text-[10px] text-emerald-600">In Stock</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Patient / Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Contact Phone
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Quantity & Unit Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to Dispense *
            </label>
            <input
              type="number"
              min="1"
              max={selectedMed ? selectedMed.currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isExpired || isOutOfStock}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unit Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              disabled={isExpired || isOutOfStock}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Total Price Summary Box */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Billable Amount</p>
            <p className="text-xs text-emerald-400 mt-0.5">
              {qtyNum} unit(s) @ {formatCurrency(unitPriceNum)} / unit
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black tracking-tight text-emerald-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>
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
            disabled={submitting || isExpired || isOutOfStock || qtyNum <= 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            )}
            <ShoppingBag className="w-4 h-4" />
            <span>Complete & Bill Sale</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSaleModal;
