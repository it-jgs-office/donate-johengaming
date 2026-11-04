import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  onClick, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'min-h-11 font-bold transition-all rounded-xl border cursor-pointer inline-flex items-center justify-center gap-2 select-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/20';
  
  const variants = {
    primary: 'text-white border-transparent bg-gradient-to-br from-[#1D4ED8] to-[#1E3A8A] shadow-[0_8px_20px_rgba(15,42,95,0.14)] hover:brightness-105 hover:shadow-[0_12px_24px_rgba(15,42,95,0.18)]',
    secondary: 'bg-white text-[#10264D] border-[#e1e7ef] shadow-sm hover:border-[#2563EB]/50 hover:bg-[#F0F7FF]',
    accent: 'bg-[#2563EB] text-white border-transparent shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:bg-[#1D4ED8]',
    danger: 'bg-red-600 text-white border-transparent shadow-sm hover:bg-red-700',
    success: 'bg-emerald-600 text-white border-transparent shadow-sm hover:bg-emerald-700'
  };
  
  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-5 py-2.5 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none shadow-none' : '';
  
  const buttonClasses = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.medium} ${disabledClasses} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
