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
        bg-white dark:bg-slate-900 border-[4px] border-slate-200 dark:border-slate-700 rounded-[40px] shadow-m overflow-hidden
        transition-all duration-200 ease-in-out
        ${hoverEffect ? 'hover:shadow-md hover:border-yellow-300 hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;