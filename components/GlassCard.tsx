import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", hoverEffect = true }) => {
  return (
    <div 
      className={`
        bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden
        transition-all duration-200 ease-in-out
        ${hoverEffect ? 'hover:shadow-md hover:border-blue-100 hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;