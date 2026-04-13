import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Crown, ChevronDown, ChevronUp, MessageSquare, X, Activity, Brain } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getGeneralTrainingFeedback, getChampionshipSimulatorInsight, testAIConnection } from "../services/coachAI/aiCoachService";
import { A2ARichReport } from "../components/A2ARichReport";
import { A2AStatusIndicators } from "../components/A2AStatusIndicators";
import { IronsideVoiceRecorder, AudioPayload } from "../components/IronsideVoiceRecorder";

function AIStatusMonitor() {
  const [status, setStatus] = useState({ gemini: false, claude: false });
  
  useEffect(() => {
    async function check() {
      const res = await testAIConnection();
      setStatus({ gemini: res.gemini, claude: res.claude });
    }
    check();
  }, []);

  return (
    <div className="flex items-center justify-between px-1 mb-2">
       <div className="flex items-center gap-3">
         <div className="flex items-center gap-1.5">
           <div className={`h-1.5 w-1.5 rounded-full ${status.claude ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
           <span className={`text-[7px] font-black uppercase tracking-widest ${status.claude ? 'text-gray-300' : 'text-red-500'}`}>Claude Opus</span>
         </div>
         <div className="flex items-center gap-1.5">
           <div className={`h-1.5 w-1.5 rounded-full ${status.gemini ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
           <span className={`text-[7px] font-black uppercase tracking-widest ${status.gemini ? 'text-gray-300' : 'text-red-500'}`}>Gemini 3.1 Pro</span>
         </div>
       </div>
       <span className="text-gray-700 text-[7px] font-bold uppercase tracking-tighter">Ironside Neural Hub v2.1</span>
    </div>
  );
}

function SimulatorCard({ comp }: { comp: any }) {
  const goal = comp.goal_weight || 200;
  const [opening, setOpening] = useState(goal - 15 + "");
  const [second, setSecond] = useState(goal - 8 + "");
  const [third, setThird] = useState(goal + "");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  const thinkingMessages = [
    "Estrategista GPC 2026 analisando histórico...",
    "Coordenador validando RPE para abertura v5.0...",
    "Simulando variáveis de fadiga (Motor 3.1)...",
    "Engenheiro avaliando torque estimado...",
    "Sintetizando plano de jogo Nível Doutorado..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setStatusIdx(prev => (prev + 1) % thinkingMessages.length);
      }, 1500);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  async function simulate() {
    setLoading(true);
    setResult(null);
    try {
      const { persistence } = await import("../lib/persistence");
      const profile = await persistence.loadProfile();
      const { data: history } = await supabase.from('workouts').select('*').order('date', { ascending: false }).limit(20);
      
      const connection = await testAIConnection();
      const insight = await getChampionshipSimulatorInsight(
        history || [],
        comp,
        profile,
        [parseFloat(opening), parseFloat(second), parseFloat(third)]
      );
      
      const formattedResult = `[TREINADOR CHEFE] STATUS_GREEN: ESTRATÉGIA DE TENTATIVAS - ${comp.name}\n\nProbabilidade de sucesso calculada: ${insight.probability}%\n\nPARECER TÉCNICO:\n${insight.comment}`;
      setResult(formattedResult);
    } catch (err) {
      setResult("Erro na simulação neural. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-dark border border-[#2A2A2A] p-4 mt-3">
      <h4 className="text-[#F5B700] font-bold text-sm mb-3 uppercase tracking-wider">
        Simulador de Tentativas
      </h4>
      <div className="space-y-2 mb-3">
        {[
          { label: "1ª Tentativa (Abertura)", value: opening, set: setOpening },
          { label: "2ª Tentativa", value: second, set: setSecond },
          { label: "3ª Tentativa", value: third, set: setThird },
        ].map(({ label, value, set }, i) => (
          <div key={i} className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-20 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-lg px-2 py-1.5 text-white font-bold text-center text-sm focus:outline-none focus:border-[#F5B700] transition-all"
                value={value}
                onChange={e => set(e.target.value)}
              />
              <span className="text-[#F5B700]/60 text-[10px] font-black w-4">kg</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className={`w-full py-2 text-sm font-bold mb-3 rounded-lg transition-all ${
          (parseFloat(opening) > parseFloat(second) || parseFloat(second) > parseFloat(third))
          ? "bg-red-500/20 text-red-500 border border-red-500/30 cursor-not-allowed"
          : "btn-gold"
        }`}
        disabled={parseFloat(opening) > parseFloat(second) || parseFloat(second) > parseFloat(third)}
        onClick={simulate}
        data-testid="button-simulate"
      >
        {(parseFloat(opening) > parseFloat(second) || parseFloat(second) > parseFloat(third)) 
          ? "Violação de Regra GPC (Pesos)" 
          : "Simular Tentativas"}
      </button>
      {loading && (
        <div className="bg-black/40 p-4 rounded-xl border border-[#F5B700]/30 animate-pulse flex items-center gap-3 mt-3">
          <div className="w-2 h-2 rounded-full bg-[#F5B700] animate-bounce" />
          <span className="text-[#F5B700] text-[10px] font-black uppercase tracking-widest leading-none">
            {thinkingMessages[statusIdx]}
          </span>
        </div>
      )}

      {result && !loading && (
        <div className="mt-3">
          <A2ARichReport rawText={result} />
        </div>
      )}
    </div>
  );
}

function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Olá Ironside! Sou sua IA de campeonato. Como posso ajudar na sua preparação estratégica ou análise de pedidas?" }
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [neuralStatus, setNeuralStatus] = useState<'idle' | 'checking' | 'success' | 'fail' | 'loading'>('idle');
  const [lastModel, setLastModel] = useState<'GEMINI' | 'CLAUDE' | 'CLAUDE_SONNET' | 'BOTH' | undefined>(undefined);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    performNeuralCheck();
  }, []);

  async function performNeuralCheck() {
    setNeuralStatus('checking');
    try {
      const result = await testAIConnection();
      if (result.claude && result.gemini) setLastModel('BOTH');
      else if (result.claude) setLastModel('CLAUDE_SONNET');
      else if (result.gemini) setLastModel('GEMINI');
      setNeuralStatus('success');
    } catch (e) {
      setNeuralStatus('fail');
    }
  }

  async function handleSend(audioPayload?: AudioPayload) {
    const text = audioPayload?.text || query;
    if (!text.trim() && !audioPayload) return;

    const userMsg = { role: "user" as const, text };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);
    setNeuralStatus('loading');

    try {
      const { data: history } = await supabase.from('training_records').select('*').order('date', { ascending: false }).limit(20);
      
      const audioData = audioPayload?.audioBase64 && audioPayload?.mimeType 
        ? { data: audioPayload.audioBase64, mimeType: audioPayload.mimeType } 
        : undefined;

      const resp = await getGeneralTrainingFeedback(history || [], text, "CHAMPIONSHIP", audioData);
      setMessages(prev => [...prev, { role: "ai", text: resp }]);
      setNeuralStatus('success');
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", text: `ERRO CRÍTICO NA CONEXÃO: ${err.message || "Falha na rede neural"}` }]);
      setNeuralStatus('fail');
    } finally {
      setLoading(false);
    }
  }

  const thinkingMessages = [
    "Estrategista GPC 2026 analisando rede neural...",
    "Processando Áudio Profundo (Banca Examinadora v5.0)...",
    "Sintonizando Biomecânica de Elite 3.1...",
    "Psicólogo Esportivo sintetizando intenção técnica...",
    "Árbitro GPC validando regras 2026..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setStatusIdx(prev => (prev + 1) % thinkingMessages.length);
      }, 1500);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex justify-end p-4">
        <button onClick={onClose} data-testid="button-close-ai">
          <X size={24} className="text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-[#F5B700]/40 scrollbar-track-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl text-sm ${
              m.role === "user"
                ? "bg-[#F5B700]/20 text-[#F5B700] border border-[#F5B700]/30 p-3 font-bold"
                : "bg-white/5 text-gray-200 border border-white/10 p-4"
            }`}>
              {m.role === "ai" ? (
                <A2ARichReport rawText={m.text} />
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-xl border border-[#F5B700]/30 animate-pulse flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#F5B700] animate-bounce" />
              <span className="text-[#F5B700] text-[10px] font-black uppercase tracking-widest leading-none">
                {thinkingMessages[statusIdx]}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-[#2A2A2A] space-y-3">
        <A2AStatusIndicators 
          status={neuralStatus} 
          activeModel={lastModel} 
        />
        <div className="flex gap-2 items-center">
          <IronsideVoiceRecorder 
            onTranscription={(payload) => handleSend(payload)} 
            isLoading={loading}
          />
          <input
            className="flex-1 bg-[#2A2A2A] border border-[#F5B700]/30 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#F5B700]"
            placeholder="Digite sua dúvida estratégica..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button className="btn-gold p-2 rounded-xl" onClick={() => handleSend()}>
            <MessageSquare size={18} />
          </button>
        </div>
        <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest mt-2 text-center opacity-50">Ironside Neural Engine v5.0.0.1 • GPC Rulebook 2026</p>
      </div>
    </div>
  );
}

function CompetitionCard({ comp, progressData = [], extra }: {
  comp: any;
  progressData?: { week: string; real: number; meta: number }[];
  extra?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="mx-4 card-dark border border-[#F5B700]/40" data-testid={`card-competition-${comp.id}`}>
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-${comp.id}`}
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-[#F5B700]" size={18} />
            <span className="text-white font-black">{comp.name}</span>
          </div>
          <p className="text-gray-400 text-xs">{new Date(comp.comp_date).toLocaleDateString("pt-BR")} — {comp.modality}</p>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <span className="text-gray-500 text-xs">Meta: </span>
              <span className="text-[#F5B700] font-black">{comp.goal_weight}kg</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Atual: </span>
              <span className="text-white font-bold">{comp.current_estimate}kg</span>
            </div>
          </div>
        </div>
        <div>
          {expanded ? <ChevronUp className="text-[#F5B700]" size={20} /> : <ChevronDown className="text-[#F5B700]" size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2A2A2A] pt-4 space-y-3">
          {/* Progress Chart - Oculto se não houver dados */}
          {progressData.length > 0 && (
            <div>
              <h4 className="text-[#F5B700] font-bold text-sm mb-2 uppercase tracking-wider">Progressão</h4>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={progressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="week" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
                    labelStyle={{ color: "#F5B700" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="real" stroke="#F5B700" strokeWidth={2.5} dot={{ fill: "#F5B700", r: 3 }} name="Real" />
                  <Line type="monotone" dataKey="meta" stroke="#FF8C00" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Meta" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Simulator */}
          <SimulatorCard comp={comp} />

          {/* Extra Badge */}
          {extra}

          {/* AI Button */}
          <button
            className="btn-gold w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm"
            onClick={() => setShowAI(true)}
            data-testid="button-ai-championship"
          >
            <MessageSquare size={16} />
            IA do Campeonato
          </button>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAI && <AIChat onClose={() => setShowAI(false)} />}
    </div>
  );
}

export default function Championships() {
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComps();
  }, []);

  async function fetchComps() {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('comp_date', { ascending: true });
      if (error) throw error;
      setComps(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            CAMPEONATOS
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Preparação e estratégia para competições</p>
      </div>

      {loading ? (
        <div className="px-4 text-gray-500 text-sm">Carregando campeonatos...</div>
      ) : (
        comps.map(comp => (
          <CompetitionCard 
            key={comp.id} 
            comp={comp} 
          />
        ))
      )}

      {comps.length === 0 && !loading && (
        <div className="px-4 text-gray-500 text-sm">Nenhum campeonato agendado.</div>
      )}
    </div>
  );
}
