import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Truck } from 'lucide-react';

const AddSupplierModal = ({
  isOpen,
  onClose,
  onSuccess,
  editSupplier = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (editSupplier) {
      setFormData({
        supplierId: editSupplier.supplierId || '',
        supplierName: editSupplier.supplierName || '',
        contactPerson: editSupplier.contactPerson || '',
        phone: editSupplier.phone || '',
        email: editSupplier.email || '',
        address: editSupplier.address || '',
      });
    } else {
      setFormData({
        supplierId: '',
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
      });
    }
  }, [editSupplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.supplierName ||
      !formData.phone ||
      !formData.email ||
      !formData.address
    ) {
      showError('Please fill in all mandatory supplier details.');
      return;
    }

    setSubmitting(true);
    try {
      if (editSupplier) {
        const res = await api.put(`/suppliers/${editSupplier._id}`, formData);
        if (res.data.success) {
          showSuccess('Supplier updated successfully!');
          onSuccess(res.data.data);
          onClose();
        }
      } else {
        const res = await api.post('/suppliers', formData);
        if (res.data.success) {
          showSuccess('Supplier added successfully!');
          onSuccess(res.data.data);
          onClose();
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      subtitle={
        editSupplier
          ? `Modify details for ${editSupplier.supplierName}`
          : 'Register a pharmaceutical vendor or distributor'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Supplier / Company Name *
          </label>
          <input
            type="text"
            name="supplierName"
            value={formData.supplierName}
            onChange={handleChange}
            placeholder="e.g. Pfizer Wholesale Corp"
            required
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Contact Representative Name
          </label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="e.g. David Miller"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 019-2834"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. orders@supplier.com"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Physical / Warehouse Address *
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="2"
            placeholder="e.g. 235 East 42nd St, New York, NY 10017"
            required
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
            <Truck className="w-4 h-4" />
            <span>{editSupplier ? 'Save Supplier' : 'Create Supplier'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSupplierModal;
