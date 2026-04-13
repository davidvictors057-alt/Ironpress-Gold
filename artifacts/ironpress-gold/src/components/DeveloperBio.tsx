import React from 'react';
import { X, Award, Binary, Activity, Zap, BookOpen, Brain, Radio } from 'lucide-react';

interface DeveloperBioProps {
  onClose: () => void;
}

export const DeveloperBio: React.FC<DeveloperBioProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0A0A0A] border border-gold/40 w-full max-w-3xl rounded-[2.5rem] overflow-hidden relative shadow-[0_0_80px_rgba(245,183,0,0.15)] flex flex-col max-h-[92vh]">
        
        {/* Header de Prestígio */}
        <div className="h-40 bg-gradient-to-r from-gold/25 via-black to-gold/10 relative flex-shrink-0">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="absolute top-8 right-8 p-3 bg-black/60 text-gray-400 hover:text-white rounded-full backdrop-blur-md transition-all z-10 hover:border-gold/30 border border-transparent"
          >
            <X size={24} />
          </button>
          
          <div className="absolute -bottom-14 left-10 border-4 border-[#0A0A0A] rounded-[2rem] overflow-hidden shadow-2xl">
             <div className="w-28 h-28 bg-black flex items-center justify-center bg-gradient-to-br from-[#0c0c0c] to-[#1a1a1a]">
                <Zap size={48} className="text-gold animate-pulse" />
             </div>
          </div>
        </div>

        <div className="pt-20 px-10 pb-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              David Caetano Ferreira
            </h2>
            <div className="flex flex-wrap gap-3 items-center">
               <span className="text-gold font-black text-xs uppercase tracking-[0.2em] bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20">Físico (IFSP)</span>
               <span className="text-gray-300 font-black text-xs uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Arquiteto de Sistemas</span>
               <span className="text-amber-500 font-black text-xs uppercase tracking-[0.2em] bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">BioTech Specialist</span>
            </div>
          </div>

          <div className="border-l-4 border-gold/40 pl-6 py-2 mb-10 text-pretty">
             <p className="text-gray-300 text-lg leading-relaxed italic font-medium">
              "Licenciado em Física pelo IFSP, com sólida trajetória na intersecção entre ciência aplicada e tecnologia. Especialista no desenvolvimento de ecossistemas digitais que integram hardware (IoT) e análise preditiva de dados."
             </p>
          </div>

          <h3 className="text-gold font-black text-sm uppercase tracking-[0.4em] mb-6 flex items-center gap-3 border-b border-white/10 pb-3">
            <Award size={20} /> Formação Científica & Especializações
          </h3>

          <div className="space-y-6 mb-10">
            {/* 1. MBA Performance */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-gold/40 transition-all group">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gold/10 rounded-2xl group-hover:bg-gold/20 transition-colors">
                     <Activity size={24} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-2">MBA em Performance Esportiva: Da Biomecânica à Excelência Mental</h4>
                    <p className="text-gray-400 text-base leading-relaxed">
                      Consultoria técnica avançada em biomecânica e análise de movimento para softwares de alta performance, integrada à excelência psicológica e mental do atleta.
                    </p>
                  </div>
               </div>
            </div>

            {/* 2. Ciência de Dados */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-gold/40 transition-all group">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gold/10 rounded-2xl group-hover:bg-gold/20 transition-colors">
                     <Binary size={24} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-2">Pós-Graduação em Ciência de Dados e Inteligência Artificial Aplicada</h4>
                    <p className="text-gray-400 text-base leading-relaxed">
                      Desenvolvimento e arquitetura de algoritmos inteligentes de elite e processamento complexo de dados biométricos em tempo real.
                    </p>
                  </div>
               </div>
            </div>

            {/* 3. Indústria 4.0 */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-gold/40 transition-all group">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gold/10 rounded-2xl group-hover:bg-gold/20 transition-colors">
                     <Zap size={24} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-2">Pós-Graduação em Indústria 4.0 e IoT: Engenharia e Automação</h4>
                    <p className="text-gray-400 text-base leading-relaxed">
                      Integração de sensores, atuadores e sistemas de monitoramento em tempo real para dispositivos vestíveis (wearables) e ecossistemas industriais.
                    </p>
                  </div>
               </div>
            </div>

            {/* 4. Física Médica */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-gold/40 transition-all group">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gold/10 rounded-2xl group-hover:bg-gold/20 transition-colors">
                     <Radio size={24} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-2">Pós-Graduação em Física Médica Aplicada</h4>
                    <p className="text-gray-400 text-base leading-relaxed">
                      Domínio de radiação e instrumentação científica avançada. Especialista em Traumatologia, Ressonância Magnética e Diagnóstico Computadorizado.
                    </p>
                  </div>
               </div>
            </div>

            {/* 5. Bioquímica, Química e Biologia */}
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-gold/40 transition-all group">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-gold/10 rounded-2xl group-hover:bg-gold/20 transition-colors">
                     <BookOpen size={24} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-2">Pós-Graduação em Ensino de Biologia e Química</h4>
                    <p className="text-gray-400 text-base leading-relaxed">
                      Especialização nas bases bioquímicas e moleculares para modelagem de performance humana e metabolismo de elite.
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-10 bg-gold/5 border border-gold/20 rounded-[2.5rem] text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-all">
                <Brain size={120} className="text-gold" />
             </div>
             <p className="text-[12px] text-gold font-black uppercase tracking-[0.5em] mb-4">Multidisciplinaridade Científica</p>
             <p className="text-gray-300 text-base leading-relaxed relative z-10 px-6">
               "David atua em diversas frentes do conhecimento científico, onde seu trabalho é fruto de uma década de estudos contínuos para compor uma base única e transdisciplinar. Ele integra o rigor analítico da Física e da Engenharia de Dados ao entendimento profundo da Biomecânica e da Bioquímica Humana, estabelecendo uma ponte exata entre o dado técnico e a fisiologia de elite. O Ironside Neural Engine não é apenas um software; é a síntese tecnológica e a materialização desta jornada em busca da excelência na performance."
             </p>
          </div>
        </div>

        <div className="p-10 bg-black/60 border-t border-white/5 text-center flex-shrink-0">
           <p className="text-[12px] text-gray-600 uppercase font-black tracking-[0.4em]">Scientific Portfolio & Systems Architecture • David Ferreira</p>
        </div>
      </div>
    </div>
  );
};
