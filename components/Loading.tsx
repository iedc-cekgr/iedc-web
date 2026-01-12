import React from 'react';
import { Rocket } from 'lucide-react';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center">
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-xl opacity-20 animate-pulse"></div>
          <div className="relative animate-float bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-500/20">
            <Rocket size={32} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">IEDC CEK</h2>
        </div>
      </div>
    </div>
  );
};

export default Loading;