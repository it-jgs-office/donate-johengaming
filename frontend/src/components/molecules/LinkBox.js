import React from 'react';
import Card from '../atoms/Card';
import toast from 'react-hot-toast';

export default function LinkBox({ title, icon, url, description, field }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url || '');
      toast.success('Link berhasil disalin!');
    } catch (e) {
      toast.error('Gagal menyalin link');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate">
              <div className="text-sm font-bold text-[#2563EB]">{title}</div>
              {description && <div className="text-xs text-[#2563EB]/70 truncate">{description}</div>}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <a href={url} target="_blank" rel="noreferrer" className="text-sm text-[#2563EB] hover:underline">Buka</a>
              <button onClick={handleCopy} className="text-sm px-3 py-1 bg-[#0F2A5F] border border-[#60A5FA] rounded text-[#DBEAFE] hover:bg-[#2563EB] hover:text-white">Salin</button>
            </div>
          </div>
          <div className="mt-2">
            <input readOnly value={url} className="w-full bg-transparent text-xs text-[#2563EB] truncate" onClick={e => e.target.select()} />
          </div>
        </div>
      </div>
    </Card>
  );
}
