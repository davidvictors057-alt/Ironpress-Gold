import React from 'react';

interface A2AStatusIndicatorsProps {
  status: 'idle' | 'loading' | 'success' | 'fail' | 'checking';
  activeModel?: 'GEMINI' | 'CLAUDE' | 'CLAUDE_SONNET' | 'BOTH' | 'GEMINI_RESERVE';
}

export const A2AStatusIndicators: React.FC<A2AStatusIndicatorsProps> = ({ status, activeModel }) => {
  const getDotStyle = (model: 'GEMINI' | 'CLAUDE') => {
    if (status === 'checking') {
      return 'bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]';
    }
    
    if (status === 'idle' || status === 'loading' || !activeModel) {
      return 'bg-gray-700 shadow-none';
    }
    
    const isMatched = activeModel === 'BOTH' || 
                     (model === 'GEMINI' && (activeModel === 'GEMINI' || activeModel === 'GEMINI_RESERVE')) ||
                     (model === 'CLAUDE' && (activeModel === 'CLAUDE' || activeModel === 'CLAUDE_SONNET'));
    
    if (isMatched) {
      if (model === 'CLAUDE' && activeModel === 'GEMINI_RESERVE') {
        return 'bg-orange-500 shadow-[0_0_10px_#f97316]';
      }
      return 'bg-green-500 shadow-[0_0_10px_#22c55e]';
    } else {
      return 'bg-red-500/40 shadow-none';
    }
  };

  const getLabelStyle = (model: 'GEMINI' | 'CLAUDE') => {
    if (status === 'checking') {
      return 'text-amber-500 animate-pulse';
    }
    if (status === 'idle' || status === 'loading' || !activeModel) {
      return 'text-gray-600';
    }
    const isMatched = activeModel === 'BOTH' || 
                     (model === 'GEMINI' && activeModel === 'GEMINI') ||
                     (model === 'CLAUDE' && (activeModel === 'CLAUDE' || activeModel === 'CLAUDE_SONNET'));
    return isMatched ? 'text-gray-300' : 'text-red-500/40';
  };

  return (
    <div className="flex items-center gap-4 bg-black/40 p-2 px-4 rounded-full border border-white/5 w-fit">
      <div className="flex flex-col items-center gap-1">
        <div className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${getDotStyle('CLAUDE')}`} />
        <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors duration-700 ${getLabelStyle('CLAUDE')}`}>OPUS-3.5</span>
      </div>
      
      <div className="w-[1px] h-4 bg-white/10 self-center" />
      
      <div className="flex flex-col items-center gap-1">
        <div className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${getDotStyle('GEMINI')}`} />
        <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors duration-700 ${getLabelStyle('GEMINI')}`}>G-3.1 PRO</span>
      </div>

      <div className="hidden sm:block ml-2 pl-4 border-l border-white/10">
        <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest italic animate-pulse">
          {status === 'loading' ? 'Sincronizando Neural Bridge...' : 
           status === 'checking' ? 'Auditando Sistema Neural...' : 
           status === 'idle' ? 'Aguardando Comando...' : 
           'Neural Link Estável'}
        </span>
      </div>
    </div>
  );
};
