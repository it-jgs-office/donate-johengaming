import React from 'react';

const SelectDropdown = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Pilih...', 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-[#0F2A5F] border-2 border-[#2563EB] rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#60A5FA] transition-all appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option, idx) => (
          <option key={idx} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#BFDBFE]">
        ▼
      </div>
      <style jsx>{`
        select:focus option, select option {
          background: #0F2A5F;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default SelectDropdown;
