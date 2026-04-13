import React, { useState } from 'react';
import { Card } from './ui/card';
import { Send, Activity, FlaskConical, AlertCircle } from 'lucide-react';
import { getGeneralTrainingFeedback } from '../services/coachAI/aiCoachService';
import { A2ARichReport } from './A2ARichReport';

export const HormoneSpecialistChat: React.FC<{ profile: any }> = ({ profile }) => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Bem-vindo ao canal de Endocrinologia Esportiva de Elite. Sou sua inteligência especializada em fisiologia hormonal e sinergia farmacológica. \n\nComo posso analisar seu protocolo hoje do ponto de vista da homeostase e performance?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  const thinkingMessages = [
    "Engenheiro de Bioengenharia Química analisando sinergias...",
    "Especialista em Endocrinologia mapeando homeostase...",
    "Consultando base de dados de farmacodinâmica de elite...",
    "Bioquímico Esportivo sintetizando veredito fisiológico...",
    "Sincronizando modelos de performance Ironside Lab..."
  ];

  React.useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setStatusIdx(prev => (prev + 1) % thinkingMessages.length);
      }, 1800);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const specializedQuery = `[FOCO: FISIOLOGIA E ENDOCRINOLOGIA ESPORTIVA] Analise o seguinte cenário conforme os padrões de alto rendimento da federação: ${input}`;
      const response = await getGeneralTrainingFeedback([], specializedQuery, profile);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ [SISTEMA] Falha na comunicação com o especialista. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black/40 border-gold/20 p-4 space-y-4">
      <div className="flex items-center gap-3 border-b border-gold/10 pb-3">
        <FlaskConical className="w-6 h-6 text-gold animate-pulse" />
        <div>
          <h3 className="text-gold font-bold uppercase tracking-widest text-sm">Consultoria Fisiológica</h3>
          <p className="text-gray-500 text-xs">Especialista em Endocrinologia Esportiva</p>
        </div>
      </div>

      <div className="h-[600px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gold/40 scrollbar-track-transparent">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gold/20 text-gold border border-gold/30 p-3 font-bold' 
                : 'bg-black/60 text-gray-200 border border-white/10 p-4 shadow-2xl'
            }`}>
              {msg.role === 'assistant' ? (
                <A2ARichReport rawText={msg.content} />
              ) : (
                msg.content.split('\n').map((line: string, j: number) => (
                  <p key={j} className={line.trim() === '' ? 'h-2' : ''}>{line}</p>
                ))
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-xl border border-gold/30 animate-pulse flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gold animate-bounce" />
              <span className="text-gold text-[10px] font-black uppercase tracking-widest leading-none">
                {thinkingMessages[statusIdx]}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ex: Qual o impacto da Boldenona no hematócrito?"
          className="flex-1 bg-black/60 border border-gold/30 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-gold hover:bg-gold/80 text-black p-2 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-start gap-2 bg-yellow-900/10 border border-yellow-700/20 p-2 rounded text-[10px] text-yellow-600/60 italic">
        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
        <span>Esta análise é exclusivamente teórica baseada em dados de alto rendimento. Sempre consulte um médico endocrinologista antes de alterações biomecânicas ou químicas.</span>
      </div>
    </Card>
  );
};
