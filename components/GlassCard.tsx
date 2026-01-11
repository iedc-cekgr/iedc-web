
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
        bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        transition-all duration-100 ease-in-out
        ${hoverEffect ? 'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
