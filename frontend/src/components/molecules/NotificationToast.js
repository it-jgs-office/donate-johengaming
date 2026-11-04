import React from 'react';
import Text from '../atoms/Text';

const NotificationToast = ({ message, detail, time, progress }) => {
  return (
    <div className="fixed top-6 right-6 z-50 bg-[#2563EB] text-white px-6 py-4 rounded-xl border border-[#1D4ED8] shadow-[0_16px_32px_rgba(15,42,95,0.22)] flex flex-col gap-1" style={{ minWidth: 320 }}>
      <Text variant="h4" weight="bold" color="white">{message}</Text>
      {detail && <Text variant="small" color="white">Pesan: {detail}</Text>}
      <Text variant="xs" color="white" className="opacity-80">{time}</Text>
      <div className="w-full h-2 bg-[#0F2A5F]/30 rounded mt-2 overflow-hidden">
        <div 
          className="h-2 bg-white" 
          style={{ 
            width: `${progress}%`,
            transition: 'width 0.05s linear'
          }}
        ></div>
      </div>
    </div>
  );
};

export default NotificationToast;
