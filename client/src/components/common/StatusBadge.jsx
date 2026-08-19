import React from 'react';
import { getStatusBadgeConfig } from '../../utils/formatters';

const StatusBadge = ({ status, customLabel, size = 'md' }) => {
  const config = getStatusBadgeConfig(status);
  const label = customLabel || config.label;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
