import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">IEDC CEK</h2>
        </div>
      </div>
    </div>
  );
};

export default Loading;