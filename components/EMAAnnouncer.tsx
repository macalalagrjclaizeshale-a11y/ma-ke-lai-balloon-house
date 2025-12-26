
import React from 'react';

interface EMAAnnouncerProps {
  message: string;
  isVisible: boolean;
}

const EMAAnnouncer: React.FC<EMAAnnouncerProps> = ({ message, isVisible }) => {
  return (
    <div 
      className={`fixed top-24 left-1/2 -translate-x-1/2 transition-all duration-500 z-50 pointer-events-none
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-4'}`}
    >
      <div className="bg-indigo-600/90 backdrop-blur-md border-2 border-indigo-400 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
            <i className="fas fa-robot text-xl"></i>
          </div>
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">EMA Says:</p>
            <p className="text-white font-medium text-lg leading-tight italic">"{message}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMAAnnouncer;
