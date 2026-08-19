import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CreateSaleModal from '../modals/CreateSaleModal';
import StockInModal from '../modals/StockInModal';
import InvoiceModal from '../modals/InvoiceModal';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [quickStockInOpen, setQuickStockInOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceTransaction, setInvoiceTransaction] = useState(null);

  const handleOpenInvoice = (txn) => {
    setInvoiceTransaction(txn);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar Header */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onQuickSale={() => setQuickSaleOpen(true)}
          onQuickStockIn={() => setQuickStockInOpen(true)}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <CreateSaleModal
        isOpen={quickSaleOpen}
        onClose={() => setQuickSaleOpen(false)}
        onSuccess={() => {
          // Trigger any refresh events if needed
        }}
        onOpenInvoice={handleOpenInvoice}
      />

      <StockInModal
        isOpen={quickStockInOpen}
        onClose={() => setQuickStockInOpen(false)}
        onSuccess={() => {}}
      />

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        transaction={invoiceTransaction}
      />
    </div>
  );
};

export default AppLayout;
