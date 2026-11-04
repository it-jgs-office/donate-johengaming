import React from 'react';

// StatusBadge atom for consistent status pill styling.
const statusStyles = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNPAID: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200'
};

const StatusBadge = ({ status = 'PAID', children }) => {
  const cls = statusStyles[status] || 'bg-[#2563EB]/20 text-[#0F2A5F] border-[#2563EB]';
  return (
    <span className={`text-xs font-bold rounded-full px-2.5 py-1 border inline-block ${cls}`}>
      {children || status}
    </span>
  );
};

export default StatusBadge;
