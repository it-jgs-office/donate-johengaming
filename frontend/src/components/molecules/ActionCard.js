import React from 'react';
import Card from '../atoms/Card';

export default function ActionCard({ title, subtitle = 'Klik untuk lihat', icon = '🔔', gradientClass = 'bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]', onClick }) {
  return (
    <Card as="button" className="cursor-pointer hover:bg-[#2563EB]/10 transition-all p-0" onClick={onClick}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 ${gradientClass} rounded-full flex items-center justify-center shadow-neon`}>
              <span className="text-[#0F2A5F] text-xl font-extrabold">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="text-sm font-medium text-[#2563EB] truncate font-mono">{title}</div>
            <div className="text-xl font-bold text-[#2563EB] font-mono">{subtitle}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
