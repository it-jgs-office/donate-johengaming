import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ value, onChange, options = [], placeholder = 'Pilih...', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || '';

  return (
    <div ref={ref} className={`relative ${className}`} tabIndex={0}>
      <button
        type="button"
        className="jd-input w-full px-4 py-2.5 text-[#10264D] text-sm font-semibold flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={selectedLabel ? 'font-bold' : 'text-[#64748B]'}>
            {selectedLabel || placeholder || 'Semua tanggal'}
          </span>
        </span>
        <svg className={`w-3.5 h-3.5 text-[#526987] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          className="absolute z-30 mt-2 w-full bg-white border border-[#e1e7ef] rounded-xl shadow-[0_16px_34px_rgba(15,42,95,0.12)] max-h-60 overflow-auto divide-y divide-[#e8edf2]"
          role="listbox"
        >
          <li
            className={`px-4 py-2.5 cursor-pointer text-xs font-bold transition-colors ${
              !value ? 'bg-[#EFF6FF] text-[#0F2A5F]' : 'text-[#526987] hover:bg-[#f7fcff]'
            }`}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Semua tanggal
          </li>
          {options.map((option) => (
            <li
              key={option.value}
              className={`px-4 py-2.5 cursor-pointer text-xs font-semibold transition-colors ${
                value === option.value ? 'bg-[#EFF6FF] font-extrabold text-[#0F2A5F]' : 'text-[#0F2A5F] hover:bg-[#f7fcff]'
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
