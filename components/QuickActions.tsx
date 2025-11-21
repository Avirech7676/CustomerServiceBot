import React from 'react';
import { QuickAction } from '../types';
import { Sparkles } from 'lucide-react';

interface QuickActionsProps {
  actions: QuickAction[];
  onSelect: (query: string) => void;
  disabled: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onSelect, disabled }) => {
  return (
    <div className="px-4 pb-4 pt-2 flex space-x-2 overflow-x-auto scrollbar-hide">
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full text-amber-500">
        <Sparkles size={14} />
      </div>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onSelect(action.query)}
          disabled={disabled}
          className="flex-shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 text-xs font-medium rounded-full transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
