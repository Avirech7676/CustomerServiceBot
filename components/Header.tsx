import React from 'react';
import { Headset, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-orange-200 shadow-lg">
          <Headset size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg">TechSanju Support</h1>
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Sanju is Online</span>
          </div>
        </div>
      </div>

      <button 
        onClick={onReset}
        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
        title="Reset Conversation"
      >
        <RefreshCw size={20} />
      </button>
    </header>
  );
};