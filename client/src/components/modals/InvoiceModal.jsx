import React from 'react';
import Modal from '../common/Modal';
import { Printer, CheckCircle, Pill } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const InvoiceModal = ({ isOpen, onClose, transaction }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const medicine = transaction.medicine || {};
  const user = transaction.user || {};
  const isSale = transaction.transactionType === 'SALE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSale ? 'Customer Sales Receipt' : 'Purchase Order Receipt'}
      subtitle={`Transaction ID: ${transaction.transactionId}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Printable Area */}
        <div
          id="printable-receipt"
          className="printable-area p-6 bg-white border border-slate-200 rounded-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Apex MediCare Pharmacy
                </h4>
                <p className="text-[11px] text-slate-500">
                  104 Healthcare Blvd, Medical District, NY 10001
                </p>
                <p className="text-[10px] text-slate-400">
                  Tel: +1 (555) 234-5678 | Email: support@apexmedicare.com
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                PAID & CLEARED
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">
                {transaction.transactionId}
              </p>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                {isSale ? 'Billed To:' : 'Supplier / Vendor:'}
              </p>
              <p className="font-bold text-slate-800 mt-0.5">
                {isSale
                  ? transaction.customerName || 'Walk-in Patient'
                  : transaction.supplier?.supplierName || 'Wholesale Supplier'}
              </p>
              {transaction.customerPhone && (
                <p className="text-slate-500">{transaction.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Date & Time:
              </p>
              <p className="font-medium text-slate-700 mt-0.5">
                {formatDateTime(transaction.transactionDate)}
              </p>
              <p className="text-[11px] text-slate-500">
                Staff: {user.name || 'Staff User'}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Item Description</th>
                  <th className="px-3 py-2 text-center">Batch #</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">
                    {medicine.medicineName || 'Pharmaceutical Item'}
                    {medicine.dosageForm && (
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({medicine.dosageForm})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-500">
                    {medicine.batchNumber || 'N/A'}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                    {transaction.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {formatCurrency(transaction.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total calculation breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-48 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-600">
                  {formatCurrency(transaction.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
            <p>Thank you for choosing Apex MediCare Pharmacy!</p>
            <p>Please store medicines at recommended temperatures.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt / PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
