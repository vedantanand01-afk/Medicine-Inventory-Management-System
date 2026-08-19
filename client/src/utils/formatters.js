export const formatCurrency = (amount, symbol = '$') => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diff = exp - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getStatusBadgeConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'in_stock':
    case 'in stock':
    case 'active':
    case 'valid':
      return {
        label: 'In Stock',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'low_stock':
    case 'low stock':
      return {
        label: 'Low Stock',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'out_of_stock':
    case 'out of stock':
    case 'inactive':
      return {
        label: 'Out of Stock',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'expired':
      return {
        label: 'Expired',
        bg: 'bg-red-100 text-red-800 border-red-300 font-semibold',
        dot: 'bg-red-600',
      };
    case 'near_expiry':
    case 'near expiry':
      return {
        label: 'Near Expiry',
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
      };
    case 'sale':
      return {
        label: 'Sale',
        bg: 'bg-teal-50 text-teal-700 border-teal-200',
        dot: 'bg-teal-500',
      };
    case 'purchase':
      return {
        label: 'Purchase',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'adjustment':
      return {
        label: 'Adjustment',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};
