import React from 'react';
import { AlertTriangle, Trash2, ShieldCheck, X } from 'lucide-react';

interface RethinkModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RethinkModal: React.FC<RethinkModalProps> = ({
  isOpen,
  title = "Rethink Before Deleting",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmText = "Yes, Delete Permanently",
  cancelText = "Keep Item",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">Please review before taking action</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {itemName && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Target Item</span>
              <p className="font-bold text-sm text-slate-900 break-words mt-0.5">"{itemName}"</p>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={16} className="text-slate-500" />
            <span>{cancelText}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RethinkModal;
