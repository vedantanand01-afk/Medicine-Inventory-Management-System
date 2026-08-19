import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const DEFAULT_CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Antipyretics',
  'Antihistamines',
  'Antidiabetic',
  'Cardiovascular',
  'Gastrointestinal',
  'Respiratory',
  'Dermatology',
  'Vitamins & Supplements',
  'Neurology',
  'Ophthalmology',
  'Other',
];

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Inhaler',
  'Suspension',
];

const AddMedicineModal = ({
  isOpen,
  onClose,
  onSuccess,
  editMedicine = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    medicineId: '',
    medicineName: '',
    genericName: '',
    category: 'Analgesics',
    dosageForm: 'Tablet',
    supplier: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    unitPrice: '',
    costPrice: '',
    reorderLevel: '20',
    description: '',
    location: 'Shelf A1',
    initialQuantity: '0',
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const res = await api.get('/suppliers');
        if (res.data && res.data.success) {
          setSuppliers(res.data.data);
          if (!editMedicine && res.data.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              supplier: res.data.data[0]._id,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen, editMedicine]);

  useEffect(() => {
    if (editMedicine) {
      setFormData({
        medicineId: editMedicine.medicineId || '',
        medicineName: editMedicine.medicineName || '',
        genericName: editMedicine.genericName || '',
        category: editMedicine.category || 'Analgesics',
        dosageForm: editMedicine.dosageForm || 'Tablet',
        supplier: editMedicine.supplier?._id || editMedicine.supplier || '',
        batchNumber: editMedicine.batchNumber || '',
        manufacturingDate: editMedicine.manufacturingDate
          ? editMedicine.manufacturingDate.split('T')[0]
          : '',
        expiryDate: editMedicine.expiryDate
          ? editMedicine.expiryDate.split('T')[0]
          : '',
        unitPrice: editMedicine.unitPrice?.toString() || '',
        costPrice: editMedicine.costPrice?.toString() || '',
        reorderLevel: editMedicine.reorderLevel?.toString() || '20',
        description: editMedicine.description || '',
        location: editMedicine.location || 'Shelf A1',
        initialQuantity: editMedicine.currentStock?.toString() || '0',
      });
    } else {
      setFormData({
        medicineId: '',
        medicineName: '',
        genericName: '',
        category: 'Analgesics',
        dosageForm: 'Tablet',
        supplier: suppliers.length > 0 ? suppliers[0]._id : '',
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        unitPrice: '',
        costPrice: '',
        reorderLevel: '20',
        description: '',
        location: 'Shelf A1',
        initialQuantity: '0',
      });
    }
  }, [editMedicine, isOpen, suppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.medicineName ||
      !formData.batchNumber ||
      !formData.manufacturingDate ||
      !formData.expiryDate ||
      !formData.unitPrice ||
      !formData.supplier
    ) {
      showError('Please fill in all mandatory fields.');
      return;
    }

    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      showError('Expiry date must be after the manufacturing date.');
      return;
    }

    if (Number(formData.unitPrice) < 0 || Number(formData.initialQuantity) < 0) {
      showError('Price and quantity cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      if (editMedicine) {
        const res = await api.put(`/medicines/${editMedicine._id}`, formData);
        if (res.data.success) {
          showSuccess('Medicine updated successfully!');
          onSuccess(res.data.data);
          onClose();
        }
      } else {
        const res = await api.post('/medicines', formData);
        if (res.data.success) {
          showSuccess('Medicine added to inventory successfully!');
          onSuccess(res.data.data);
          onClose();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save medicine.';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMedicine ? 'Edit Medicine' : 'Add New Medicine'}
      subtitle={
        editMedicine
          ? `Updating details for ${editMedicine.medicineName}`
          : 'Register a new medicine item and initialize stock records'
      }
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              name="medicineName"
              value={formData.medicineName}
              onChange={handleChange}
              placeholder="e.g. Paracetamol 500mg"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Generic Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Generic Name
            </label>
            <input
              type="text"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
              placeholder="e.g. Acetaminophen"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dosage Form */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dosage Form *
            </label>
            <select
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {DOSAGE_FORMS.map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Supplier *
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              required
              disabled={loadingSuppliers}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select a Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.supplierName} ({s.supplierId})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Batch Number *
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BATCH-PCM-102"
              required
              className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Manufacturing Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Manufacturing Date *
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Unit Selling Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unit Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              placeholder="0.00"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cost / Purchase Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Low Stock Reorder Level
            </label>
            <input
              type="number"
              min="0"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              placeholder="20"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Initial Quantity (Only if adding new) */}
          {!editMedicine ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                name="initialQuantity"
                value={formData.initialQuantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Storage Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Shelf A1, Rack 2"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Description & Notes
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            placeholder="Usage instructions, side-effects, storage conditions..."
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
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            )}
            {editMedicine ? 'Save Changes' : 'Add Medicine'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMedicineModal;
