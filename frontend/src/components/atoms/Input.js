import React from 'react';

const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  error = false,
  ...props 
}) => {
  const baseClasses = 'jd-input w-full px-3.5 py-2.5 text-[#10264D] font-medium text-sm focus:outline-none transition-all placeholder:text-[#94A3B8]';
  
  const stateClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
    : '';
    
  const disabledClasses = disabled 
    ? 'border-[#0F2A5F]/30 bg-gray-100 text-[#0F2A5F]/50 cursor-not-allowed shadow-none' 
    : '';
  
  const inputClasses = `${baseClasses} ${stateClasses} ${disabledClasses} ${className}`;
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={inputClasses}
      {...props}
    />
  );
};

export default Input;
