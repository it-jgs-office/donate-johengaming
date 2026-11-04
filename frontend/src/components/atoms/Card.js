import React from 'react';

export default function Card({ children, className = '', as: Component = 'div', ...props }) {
  const base = 'jd-surface text-[#10264D]';
  return (
    <Component className={`${base} ${className}`} {...props}>
      {children}
    </Component>
  );
}
