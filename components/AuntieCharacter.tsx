
import React from 'react';

interface AuntieCharacterProps {
  message: string;
  isVisible: boolean;
}

const AuntieCharacter: React.FC<AuntieCharacterProps> = ({ message, isVisible }) => {
  return (
    <div className={`fixed bottom-0 right-4 z-40 transition-all duration-500 flex flex-col items-end
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
      
      {/* Speech Bubble */}
      <div className="relative mb-4 mr-8 bg-white text-gray-900 px-4 py-2 rounded-2xl border-2 border-amber-500 shadow-xl max-w-[200px]">
        <p className="text-sm font-bold italic leading-tight">{message}</p>
        {/* Tail */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-amber-500 rotate-45"></div>
      </div>

      {/* Auntie Visual Representation */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-rose-200 rounded-full border-4 border-amber-900 overflow-hidden relative shadow-2xl animate-bounce">
           {/* Hair */}
           <div className="absolute top-0 left-0 w-full h-8 bg-gray-800 rounded-b-full"></div>
           {/* Eyes/Glasses */}
           <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-4 h-4 border-2 border-black rounded-full"></div>
              <div className="w-4 h-4 border-2 border-black rounded-full"></div>
           </div>
           {/* Smile */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-red-500 rounded-full"></div>
        </div>
        <div className="bg-red-600 px-3 py-1 rounded-t-lg border-x-2 border-t-2 border-amber-900 text-[10px] font-black text-white uppercase tracking-tighter">
           Market Boss
        </div>
      </div>
    </div>
  );
};

export default AuntieCharacter;
