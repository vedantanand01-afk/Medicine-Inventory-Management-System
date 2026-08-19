import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { useNotification } from '../context/NotificationContext';
import {
  BarChart3,
  Download,
  Printer,
  Boxes,
  TrendingUp,
  ArrowLeftRight,
  Clock,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../utils/formatters';
import { exportToCSV, triggerPrint } from '../utils/exportUtils';

const Reports = () => {
  const { showSuccess, showError } = useNotification();
  const [activeReport, setActiveReport] = useState('inventory'); // 'inventory' | 'sales' | 'movement' | 'expiry'
  const [loading, setLoading] = useState(true);

  const [inventoryData, setInventoryData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [movementData, setMovementData] = useState(null);
  const [expiryData, setExpiryData] = useState(null);

  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'inventory') {
        const res = await api.get('/reports/inventory');
        if (res.data.success) setInventoryData(res.data.data);
      } else if (activeReport === 'sales') {
        const params = {};
        if (salesStartDate) params.startDate = salesStartDate;
        if (salesEndDate) params.endDate = salesEndDate;
        const res = await api.get('/reports/sales', { params });
        if (res.data.success) setSalesData(res.data.data);
      } else if (activeReport === 'movement') {
        const res = await api.get('/reports/movement');
        if (res.data.success) setMovementData(res.data.data);
      } else if (activeReport === 'expiry') {
        const res = await api.get('/reports/expiry');
        if (res.data.success) setExpiryData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      showError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, salesStartDate, salesEndDate]);

  // CSV Exporter for each report type
  const handleExportCSV = () => {
    if (activeReport === 'inventory' && inventoryData) {
      const headers = [
        'Medicine ID',
        'Medicine Name',
        'Category',
        'Supplier',
        'Batch #',
        'Quantity',
        'Unit Price ($)',
        'Cost Price ($)',
        'Total Valuation ($)',
        'Status',
      ];
      const rows = inventoryData.items.map((i) => [
        i.medicineId,
        i.medicineName,
        i.category,
        i.supplierName,
        i.batchNumber,
        i.quantity,
        i.unitPrice,
        i.costPrice || '',
        i.totalValue,
        i.status,
      ]);
      exportToCSV('inventory_report', headers, rows);
    } else if (activeReport === 'sales' && salesData) {
      const headers = [
        'Transaction ID',
        'Date & Time',
        'Medicine Name',
        'Quantity Sold',
        'Unit Price ($)',
        'Total Revenue ($)',
        'Customer Name',
        'Staff User',
      ];
      const rows = salesData.transactions.map((t) => [
        t.transactionId,
        t.transactionDate ? formatDateTime(t.transactionDate) : '',
        t.medicine?.medicineName || '',
        t.quantity,
        t.unitPrice,
        t.totalAmount,
        t.customerName || 'Walk-in',
        t.user?.name || '',
      ]);
      exportToCSV('sales_dispensary_report', headers, rows);
    } else if (activeReport === 'movement' && movementData) {
      const headers = [
        'Transaction ID',
        'Date',
        'Movement Type',
        'Medicine Name',
        'Quantity',
        'Unit Price ($)',
        'Total Value ($)',
        'Party',
      ];
      const rows = movementData.transactions.map((t) => [
        t.transactionId,
        t.transactionDate ? formatDateTime(t.transactionDate) : '',
        t.transactionType,
        t.medicine?.medicineName || '',
        t.quantity,
        t.unitPrice,
        t.totalAmount,
        t.transactionType === 'SALE'
          ? t.customerName || 'Customer'
          : t.supplier?.supplierName || 'Supplier',
      ]);
      exportToCSV('stock_movement_report', headers, rows);
    } else if (activeReport === 'expiry' && expiryData) {
      const headers = [
        'Medicine ID',
        'Medicine Name',
        'Batch #',
        'Expiry Date',
        'Units in Stock',
        'Unit Price ($)',
        'Valuation at Risk ($)',
        'Days Remaining',
      ];
      const rows = [
        ...expiryData.expired,
        ...expiryData.expiringIn30Days,
        ...expiryData.expiringIn60Days,
      ].map((m) => [
        m.medicineId,
        m.medicineName,
        m.batchNumber,
        m.expiryDate ? formatDate(m.expiryDate) : '',
        m.quantity,
        m.unitPrice,
        m.totalVal,
        m.daysUntilExpiry,
      ]);
      exportToCSV('expiry_risk_report', headers, rows);
    }
    showSuccess('Exported report to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial & Inventory Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable audit summaries, asset valuations, sales figures, and risk analysis
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeReport === 'inventory'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory Valuation</span>
        </button>

        <button
          onClick={() => setActiveReport('sales')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeReport === 'sales'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Revenue</span>
        </button>

        <button
          onClick={() => setActiveReport('movement')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeReport === 'movement'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Stock Movement (In vs Out)</span>
        </button>

        <button
          onClick={() => setActiveReport('expiry')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeReport === 'expiry'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Expiry Risk Forecast</span>
        </button>
      </div>

      {/* Printable Area Wrapper */}
      <div className="printable-area space-y-6">
        {/* REPORT 1: INVENTORY VALUATION */}
        {activeReport === 'inventory' && inventoryData && (
          <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Inventory Assets
                </span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
                  {formatCurrency(inventoryData.summary.totalRetailValue)}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Retail Value across {inventoryData.summary.totalStockUnits} units
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Acquisition Cost
                </span>
                <h4 className="text-2xl font-extrabold text-blue-600 mt-1">
                  {formatCurrency(inventoryData.summary.totalCostValue)}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Total Wholesale Purchase Cost
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estimated Gross Margin
                </span>
                <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {formatCurrency(inventoryData.summary.estimatedMargin)}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Projected Gross Profit Margin
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Stock Health Flagged
                </span>
                <h4 className="text-2xl font-extrabold text-amber-600 mt-1">
                  {inventoryData.summary.lowStockCount + inventoryData.summary.outOfStockCount} Items
                </h4>
                <p className="text-[10px] text-rose-600 mt-0.5">
                  {inventoryData.summary.expiredCount} Expired
                </p>
              </div>
            </div>

            {/* Inventory Detail Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Itemized Stock Asset Valuation
                </h3>
                <span className="text-xs text-slate-400">
                  {inventoryData.items.length} Medicines Cataloged
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Medicine & Category</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3 text-center">Batch #</th>
                      <th className="px-4 py-3 text-center">Stock</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Cost Price</th>
                      <th className="px-4 py-3 text-right">Total Valuation</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryData.items.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.medicineName}
                          <span className="block text-[10px] text-slate-400">
                            {item.medicineId} &bull; {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.supplierName}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          {item.batchNumber}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {formatCurrency(item.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          {formatCurrency(item.totalValue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 2: SALES & REVENUE */}
        {activeReport === 'sales' && salesData && (
          <div className="space-y-6">
            {/* Date Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 no-print">
              <span className="text-xs font-bold text-slate-600">
                Filter Date Period:
              </span>
              <input
                type="date"
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200"
              />
            </div>

            {/* Sales KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Sales Revenue
                </span>
                <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {formatCurrency(salesData.summary.totalSalesAmount)}
                </h4>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Units Dispensed
                </span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
                  {salesData.summary.totalUnitsSold} Units
                </h4>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sales Transactions
                </span>
                <h4 className="text-2xl font-extrabold text-blue-600 mt-1">
                  {salesData.summary.totalTransactions} Invoices
                </h4>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Average Order Value
                </span>
                <h4 className="text-2xl font-extrabold text-teal-600 mt-1">
                  {formatCurrency(salesData.summary.averageOrderValue)}
                </h4>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Top Performing Medications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {salesData.topSellingMedicines?.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.medicineName}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60"
                  >
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Rank #{idx + 1}
                    </span>
                    <h5 className="font-bold text-sm text-slate-800 mt-1.5 truncate">
                      {item.medicineName}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {item.totalUnits} Units Sold
                      </span>
                      <span className="font-extrabold text-emerald-600">
                        {formatCurrency(item.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPORT 3: STOCK MOVEMENT */}
        {activeReport === 'movement' && movementData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Received (Stock In)
                </span>
                <h4 className="text-2xl font-extrabold text-blue-600 mt-1">
                  +{movementData.summary.totalStockReceivedUnits} Units
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Cost: {formatCurrency(movementData.summary.totalStockReceivedAmount)}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Dispensed (Stock Out)
                </span>
                <h4 className="text-2xl font-extrabold text-emerald-600 mt-1">
                  -{movementData.summary.totalStockIssuedUnits} Units
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Revenue: {formatCurrency(movementData.summary.totalStockIssuedAmount)}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net Movement Delta
                </span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
                  {movementData.summary.netUnitMovement > 0 ? '+' : ''}
                  {movementData.summary.netUnitMovement} Units
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Current Net Inventory Change
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 4: EXPIRY RISK FORECAST */}
        {activeReport === 'expiry' && expiryData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Expired Value Lost
                </span>
                <h4 className="text-2xl font-extrabold text-rose-900 mt-1">
                  {formatCurrency(expiryData.summary.expiredValueLost)}
                </h4>
                <p className="text-[10px] text-rose-700 mt-0.5">
                  {expiryData.summary.expiredCount} Batches already expired
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
                  30-Day Risk Valuation
                </span>
                <h4 className="text-2xl font-extrabold text-orange-900 mt-1">
                  {formatCurrency(expiryData.summary.nearExpiryValueAtRisk)}
                </h4>
                <p className="text-[10px] text-orange-700 mt-0.5">
                  {expiryData.summary.expiringIn30DaysCount} Batches expiring in &le;30d
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  60-Day Expiry Horizon
                </span>
                <h4 className="text-2xl font-extrabold text-amber-900 mt-1">
                  {expiryData.summary.expiringIn60DaysCount} Batches
                </h4>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Approaching in next 2 months
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  90-Day Expiry Horizon
                </span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">
                  {expiryData.summary.expiringIn90DaysCount} Batches
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Approaching in next 3 months
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
