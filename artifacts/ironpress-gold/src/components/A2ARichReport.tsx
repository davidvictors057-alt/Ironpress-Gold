import React from 'react';
import { 
  Activity, CheckCircle, AlertTriangle, ShieldCheck, 
  Ruler, Brain, Dna, Flame, Zap
} from 'lucide-react';

interface RichSection {
  agent: string;
  status: string;
  title: string;
  content: string[];
}

/**
 * Processador Semântico de Texto v5.5
 * Converte tags [[G]], [[R]], [[B]], [[Y]] em spans coloridas com glow.
 * v5.5: Sanitização profunda para eliminar vazamento de tags internas (STATUS_XXX).
 */
const RenderSemanticText: React.FC<{ text?: string }> = ({ text = "" }) => {
  if (!text) return null;
  
  // Limpeza de emergência: remove qualquer menção a STATUS_XXX que tenha vazado
  const sanitizedText = text.replace(/STATUS_[A-Z_Á-Ú]+/gi, '').trim();
  if (!sanitizedText) return null;

  try {
    const parts = sanitizedText.split(/(\[\[[GRBY]\]\].*?\[\[\/[GRBY]\]\])/g);
    
    return (
      <>
        {parts.map((part, idx) => {
          if (!part) return null;
          const match = part.match(/\[\[([GRBY])\]\](.*?)\[\[\/[GRBY]\]\]/);
          if (match) {
            const color = match[1];
            const content = match[2];
            
            let colorClass = "";
            let glowClass = "";
            
            switch (color) {
              case 'G': 
                colorClass = "text-emerald-400 font-black"; 
                glowClass = "shadow-[0_0_8px_rgba(52,211,153,0.4)]";
                break;
              case 'R': 
                colorClass = "text-rose-400 font-black"; 
                glowClass = "shadow-[0_0_8px_rgba(251,113,133,0.4)]";
                break;
              case 'B': 
                colorClass = "text-cyan-400 font-black italic"; 
                glowClass = "shadow-[0_0_8px_rgba(34,211,238,0.4)]";
                break;
              case 'Y': 
                colorClass = "text-amber-400 font-black"; 
                glowClass = "shadow-[0_0_8px_rgba(251,191,36,0.4)]";
                break;
            }
            
            return (
              <span key={idx} className={`${colorClass} px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 mx-0.5 inline-flex items-center gap-1`}>
                <span className={`w-1 h-1 rounded-full ${color === 'G' ? 'bg-emerald-500' : color === 'R' ? 'bg-rose-500' : color === 'B' ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                {content}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  } catch (e) {
    return <span className="opacity-50 italic">{sanitizedText}</span>;
  }
};

export const A2ARichReport: React.FC<{ rawText?: string }> = ({ rawText = "" }) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const [mainBody] = rawText.split('---');
  
  const parseReport = (text: string): RichSection[] => {
    const sections: RichSection[] = [];
    if (!text) return sections;

    const lines = text.split('\n');
    let currentSection: RichSection | null = null;

    lines.forEach(line => {
      if (!line) return;
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Regex Ultra-Resiliente v5.5 (Suporta SISTEMA e acentos)
      const agentMatch = trimmedLine.match(/^(\d+\.?\s*)?(\*\*|\[)?(COORDENADOR TÉCNICO|COORDENADOR|FISIOLOGISTA|ESPECIALISTA EM BIOMECÂNICA|ESPECIALISTA|BIOMECÂNICO|TREINADOR CHEFE|TREINADOR|COACH CHEFE|COACH|FISIOTERAPEUTA DESPORTIVO|FISIOTERAPEUTA|ENDOCRINOLOGISTA ESPORTIVO|ENDOCRINOLOGISTA|BIOQUÍMICO ESPORTIVO|BIOQUÍMICO|BIOQUIMICO|PSICÓLOGO ESPORTIVO|PSICÓLOGO|PSICOLOGO|ÁRBITRO GPC BRASIL|ÁRBITRO|ARBITRO|ENGENHEIRO|FISIOPATOLOGISTA \/ BIOMECÂNICO|BIOQUÍMICO \/ ENDOCRINOLOGISTA|SISTEMA IRONSIDE|SISTEMA|MODULAÇÃO NEURAL DIRETA|MODULAÇÃO)(\*\*|\])?[:\s-]*(STATUS_([A-Z_Á-Ú]+):?)?\s*(.*)/i);
      
      if (agentMatch) {
        if (currentSection) sections.push(currentSection);
        
        currentSection = {
          agent: (agentMatch[3] || 'AGENTE DESCONHECIDO').toUpperCase(),
          status: (agentMatch[6] || 'NEUTRAL').replace('STATUS_', ''),
          title: (agentMatch[7] || '').replace(/STATUS_[A-Z_Á-Ú]+/gi, '').replace(/[:*#]/g, '').trim(),
          content: []
        };
      } else if (trimmedLine.startsWith('STATUS_') && currentSection) {
        // Captura o status se a IA o colocar em uma linha separada
        const statusOnlyMatch = trimmedLine.match(/^STATUS_([A-Z_Á-Ú]+)(:?\s*)(.*)/i);
        if (statusOnlyMatch) {
          currentSection.status = statusOnlyMatch[1];
          const extraTitle = statusOnlyMatch[3].trim();
          if (extraTitle && !currentSection.title) {
            currentSection.title = extraTitle;
          } else if (extraTitle) {
            currentSection.content.push(extraTitle);
          }
        }
      } else if (currentSection) {
        let cleanContent = trimmedLine.replace(/STATUS_[A-Z_Á-Ú]+/gi, '').replace(/[*#_~]/g, '').trim();
        if (cleanContent.length > 30 && cleanContent === cleanContent.toUpperCase()) {
          cleanContent = cleanContent.charAt(0) + cleanContent.slice(1).toLowerCase();
        }
        if (cleanContent) currentSection.content.push(cleanContent);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const sections = parseReport(mainBody);

  const getAgentStyles = (agent: string) => {
    const a = agent.toUpperCase();
    if (a.includes('COORDENADOR') || a.includes('TREINADOR CHEFE')) {
      return { color: 'text-[#F5B700]', bg: 'bg-[#F5B700]/10', border: 'border-[#F5B700]/30', icon: Brain };
    }
    if (a.includes('FISIOLOGISTA') || a.includes('BIOQUÍMICO') || a.includes('ENDOCRINOLOGISTA') || a.includes('BIOQUIMICO')) {
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Dna };
    }
    if (a.includes('BIOMECÂNICA') || a.includes('ENGENHEIRO') || a.includes('BIOMECANICO') || a.includes('SISTEMA') || a.includes('MODULAÇÃO')) {
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Ruler };
    }
    if (a.includes('FISIOTERAPEUTA') || a.includes('PSICÓLOGO') || a.includes('PSICOLOGO')) {
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: Activity };
    }
    return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: ShieldCheck };
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('RED') || s.includes('VERMELHO')) return <Flame className="text-red-500" size={16} />;
    if (s.includes('GREEN') || s.includes('VERDE')) return <CheckCircle className="text-green-500" size={16} />;
    if (s.includes('BLUE') || s.includes('AZUL')) return <Zap className="text-blue-500" size={16} />;
    if (s.includes('YELLOW') || s.includes('AMARELO')) return <AlertTriangle className="text-yellow-500" size={16} />;
    return <CheckCircle className="text-blue-400 opacity-50" size={14} />;
  };

  // FALLBACK DE SEGURANÇA v5.5
  if (sections.length === 0 && mainBody.trim().length > 0) {
    const isError = mainBody.includes('BLOQUEADO') || mainBody.includes('ERRO');
    
    return (
      <div className="space-y-4">
        <div className={`p-5 rounded-2xl border ${isError ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.03] border-white/10'}`}>
          <p className={`text-[10px] ${isError ? 'text-red-400' : 'text-gold'} font-black uppercase tracking-widest mb-3 opacity-70 flex items-center gap-2`}>
            {isError ? <AlertTriangle size={12} /> : <Zap size={12} />} 
            {isError ? 'ALERTA DE SEGURANÇA NEURAL' : 'MODULAÇÃO NEURAL DIRETA'}
          </p>
          <div className={`${isError ? 'text-red-200' : 'text-gray-300'} text-sm leading-relaxed whitespace-pre-wrap font-medium`}>
            <RenderSemanticText text={mainBody} />
          </div>
        </div>
        <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black font-mono">Ironside Neural Engine v5.8.3 | Série 3.1</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => {
        const styles = getAgentStyles(section.agent);
        const AgentIcon = styles.icon;

        return (
          <div 
            key={idx} 
            className={`rounded-2xl border-l-4 ${styles.bg} ${styles.border} p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-xl`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${styles.bg} border ${styles.border}`}>
                  <AgentIcon className={styles.color} size={20} />
                </div>
                <div>
                  <h3 className={`font-black text-[9px] uppercase tracking-[0.2em] ${styles.color} opacity-80`}>
                    {section.agent}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(section.status)}
                    <span className="text-white font-bold text-sm tracking-tight">
                      {section.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {section.content.map((p, pIdx) => (
                <div key={pIdx} className="text-gray-200 text-sm leading-relaxed font-medium">
                  <RenderSemanticText text={p} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-white/10 flex items-center justify-between px-2 opacity-60">
        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black font-mono">
          Ironside Neural Engine v5.8.3 • Série 3.1 • Soberania
        </span>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
        </div>
      </div>
    </div>
  );
};
