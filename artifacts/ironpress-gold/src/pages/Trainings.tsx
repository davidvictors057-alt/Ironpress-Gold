import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, Plus, Edit2, Trash2, X, Cpu, Calculator, ChevronDown, Share2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { getGeneralTrainingFeedback, testAIConnection } from "../services/coachAI/aiCoachService";
import { A2ARichReport } from "../components/A2ARichReport";
import { A2AStatusIndicators } from "../components/A2AStatusIndicators";
import { IronsideVoiceRecorder, AudioPayload } from "../components/IronsideVoiceRecorder";
import { supabase } from "../lib/supabase";
import { cleanTextForSharing, openWhatsApp } from "../lib/utils";

export interface TrainingRecord {
  id: string;
  date: string;
  target: number;
  actual: number;
  rpe: number;
  modality: "soft" | "raw" | "f8";
}

function getBarColor(pct: number) {
  if (pct >= 98) return "#F5B700"; // Ouro (Elite)
  if (pct >= 90) return "#E6A800"; // Amarelo (Forte)
  return "#FF8C00"; // Laranja (Ajuste Necessário)
}

function getBarLabel(pct: number) {
  if (pct >= 98) return "text-[#F5B700]";
  if (pct >= 90) return "text-yellow-600";
  return "text-orange-500";
}

interface TrainingFormProps {
  initial?: Partial<TrainingRecord>;
  mode: "raw" | "f8" | "soft";
  onSave: (t: any) => void;
  onClose: () => void;
}

function TrainingFormModal({ initial, mode, onSave, onClose }: TrainingFormProps) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [target, setTarget] = useState(initial?.target?.toString() ?? "");
  const [actual, setActual] = useState(initial?.actual?.toString() ?? "");
  const [rpe, setRpe] = useState(initial?.rpe?.toString() ?? "8");

  function handle() {
    if (!date.trim() || !target || !actual) return;
    
    let formattedDate = date.trim();
    if (formattedDate.length === 8 && !formattedDate.includes('/')) {
        formattedDate = `${formattedDate.slice(0,2)}/${formattedDate.slice(2,4)}/${formattedDate.slice(4,8)}`;
    }

    onSave({
      workout_date: formattedDate.split('/').reverse().join('-'),
      target_weight: parseFloat(target),
      actual_weight: parseFloat(actual),
      rpe: parseFloat(rpe),
      modality: mode.toUpperCase(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30"
        onClick={e => e.stopPropagation()}
        data-testid="modal-training-form"
      >
        <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
        <h3 className="text-[#F5B700] font-black text-lg mb-4">{initial?.id ? "Editar" : "Novo"} Treino — {mode === "raw" ? "RAW" : "EQUIPADO F8"}</h3>
        <div className="space-y-3">
          <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Data (DD/MM/AAAA)" value={date} onChange={e => setDate(e.target.value)} data-testid="input-training-date" />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <label className="text-[9px] text-gray-500 uppercase font-black mb-1 ml-1">Alvo</label>
              <input type="number" className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Alvo (kg)" value={target} onChange={e => setTarget(e.target.value)} data-testid="input-training-target" />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] text-gray-500 uppercase font-black mb-1 ml-1">Realizado</label>
              <input type="number" className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Real (kg)" value={actual} onChange={e => setActual(e.target.value)} data-testid="input-training-actual" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-10">RPE</span>
            <input type="range" min={1} max={10} step={0.5} value={rpe} onChange={e => setRpe(e.target.value)} className="flex-1" style={{ accentColor: "#F5B700" }} />
            <span className="text-[#F5B700] font-bold w-8">{rpe}</span>
          </div>
          <button className="btn-gold w-full py-3 font-black text-sm" onClick={handle} data-testid="button-save-training">Salvar Treino</button>
        </div>
      </div>
    </div>
  );
}

export default function Trainings() {
  const [mode, setMode] = useState<"raw" | "f8" | "soft">("f8");
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<TrainingRecord | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [aiQuery, setAiQuery] = useState("");
  const [lastModel, setLastModel] = useState<'GEMINI' | 'CLAUDE' | 'CLAUDE_SONNET' | 'BOTH' | undefined>(undefined);
  const [neuralStatus, setNeuralStatus] = useState<'idle' | 'checking' | 'success' | 'fail' | 'loading'>('idle');
  const [calcTarget, setCalcTarget] = useState("300");
  const [calcPct, setCalcPct] = useState("80");
  const [isCalcExpanded, setIsCalcExpanded] = useState(false);


  useEffect(() => {
    if (showAIModal) {
      performNeuralCheck();
    }
  }, [showAIModal]);

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

  const thinkingMessages = [
    "Estrategista GPC analisando rede neural...",
    "Processando Áudio Profundo (Banca Examinadora)...",
    "Sintonizando Biomecânica de Elite v4.0...",
    "Psicólogo Esportivo sintetizando intenção técnica...",
    "Árbitro validando regras 2024/2025..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAiLoading) {
      interval = setInterval(() => {
        setStatusIdx(prev => (prev + 1) % thinkingMessages.length);
      }, 1800);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchTrainings();
  }, []);

  async function fetchProfile() {
    const { persistence } = await import("../lib/persistence");
    const p = await persistence.loadProfile();
    setProfile(p);
  }

  async function fetchTrainings() {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('workout_date', { ascending: false });

      if (error) throw error;

      setTrainings(data.map(w => ({
        id: w.id,
        date: new Date(w.workout_date).toLocaleDateString("pt-BR"),
        target: w.target_weight,
        actual: w.actual_weight,
        rpe: w.rpe,
        modality: w.modality.toUpperCase()
      })));
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addTraining(t: any) {
    try {
      const { error } = await supabase.from('workouts').insert(t);
      if (error) throw error;
      fetchTrainings();
    } catch (error: any) {
      alert("Erro ao salvar treino: " + error.message);
    }
  }

  async function updateTraining(t: any) {
    try {
      const { error } = await supabase.from('workouts').update(t).eq('id', editRow?.id);
      if (error) throw error;
      fetchTrainings();
    } catch (error: any) {
      alert("Erro ao atualizar treino: " + error.message);
    }
  }

  async function deleteTraining(id: string) {
    if (!confirm("Excluir este treino?")) return;
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
      fetchTrainings();
    } catch (error: any) {
      alert("Erro ao deletar treino: " + error.message);
    }
  }

  const active = trainings.filter(t => t.modality === mode.toUpperCase());
  const pcts = active.map(t => Math.round((t.actual / t.target) * 100));
  const highPct = pcts.filter(p => p >= 99).length;

  const chartData = [...active].reverse().map(t => ({
    date: t.date.slice(0, 5),
    alvo: t.target,
    realizado: t.actual,
    pct: Math.round((t.actual / t.target) * 100),
  }));

  const askAI = async (audioPayload?: AudioPayload) => {
    const query = audioPayload?.text || aiQuery;
    if (!query.trim() && !audioPayload) return;
    
    setAiQuery("");
    setIsAiLoading(true);
    setNeuralStatus('loading');
    setAiResponse("");
    setLastModel(undefined);
    
    try {
      const audioData = audioPayload?.audioBase64 && audioPayload?.mimeType 
        ? { data: audioPayload.audioBase64, mimeType: audioPayload.mimeType } 
        : undefined;

      const resp = await getGeneralTrainingFeedback(active, query, profile, audioData);
      setAiResponse(resp);
      setNeuralStatus('success');
      if (resp.includes("CLAUDE_SONNET") || resp.includes("CLAUDE_OPUS")) {
        setLastModel("CLAUDE_SONNET");
      } else if (resp.includes("GEMINI_ACTIVE")) {
        setLastModel("GEMINI");
      }
    } catch (err: any) {
      setAiResponse(`
        [⚠️ FALHA NA REDE NEURAL]
        MOTIVO: ${err.message || 'Erro de Sincronia'}
        
        SUGESTÃO: Verifique sua conexão ou reduza o tempo de voz. Se o erro persistir, reporte o código acima ao suporte Ironside.
      `);
      setNeuralStatus('fail');
    } finally {
      setIsAiLoading(false);
    }
  }

  return (
    <div className="pb-6 space-y-4">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#F5B700]" size={22} />
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>TREINOS</h1>
          </div>
          <button
            className="btn-gold px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            onClick={() => setShowForm(true)}
            data-testid="button-add-training"
          >
            <Plus size={13} /> Novo
          </button>
        </div>
        <p className="text-gray-400 text-sm">Histórico e evolução de cargas</p>
      </div>

      <div className="mx-4 flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A]" data-testid="selector-mode">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "f8" ? "btn-gold" : "text-gray-400"}`}
          onClick={() => setMode("f8")}
          data-testid="button-mode-equipped"
        >
          EQUIPADO F8
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "raw" ? "btn-gold" : "text-gray-400"}`}
          onClick={() => setMode("raw")}
          data-testid="button-mode-raw"
        >
          RAW
        </button>
      </div>

      {active.length > 0 && (
        <div className="mx-4 card-dark p-4 border border-[#2A2A2A]" data-testid="chart-trainings">
          <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">Alvo vs Realizado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="date" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} domain={[(dataMin: number) => Math.floor(dataMin * 0.9), "auto"]} />
              <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }} labelStyle={{ color: "#F5B700" }} itemStyle={{ color: "#fff" }} />
              <Legend formatter={(v) => <span style={{ color: "#B0B0B0", fontSize: 11 }}>{v.toLowerCase() === "alvo" ? "Alvo" : "Realizado"}</span>} />
              <Bar dataKey="alvo" fill="#2A2A2A" name="Alvo" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="#F5B700" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={getBarColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {active.length > 0 && (
        <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/40 rounded-xl p-4" data-testid="card-insight">
          <div className="flex items-start gap-2">
            <span className="text-[#F5B700] text-xl">⚡</span>
            <div>
              <p className="text-[#F5B700] font-bold text-sm">Insight do Coach IA</p>
              <p className="text-gray-200 text-sm mt-1">
                {active.length > 0 ? (
                  mode === "f8"
                    ? `Volume registrado: Você completou ${active.length} sessões F8. ${highPct > 0 ? `Excelente! ${highPct} delas atingiram nível de elite (98%+).` : 'Foco técnico: o objetivo atual é aproximar a carga real à meta (98%+) para consolidar o nível de elite.'}`
                    : `Progresso RAW: Média de ${Math.round(active.reduce((acc, t) => acc + t.actual, 0) / active.length)}kg nos últimos registros. Meta final: ${profile?.raw_goal_bench || 210}kg.`
                ) : (
                  "Inicie seus registros para receber análise biomecânica em tempo real."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-4">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-2">
          Treinos — {mode === "f8" ? "EQUIPADO F8" : "RAW"}
        </h3>
        <div className="card-dark border border-[#2A2A2A] overflow-hidden" data-testid="table-trainings">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-gray-400 text-left p-3">Data</th>
                <th className="text-gray-400 text-center p-3">Alvo</th>
                <th className="text-gray-400 text-center p-3">Real</th>
                <th className="text-gray-400 text-center p-3">%</th>
                <th className="text-gray-400 text-center p-3">RPE</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {active.map((t) => {
                const pct = Math.round((t.actual / t.target) * 100);
                return (
                  <tr key={t.id} className="border-b border-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors" data-testid={`row-training-${t.id}`}>
                    <td className="p-3 text-gray-300">{t.date}</td>
                    <td className="p-3 text-center text-gray-300">{t.target}kg</td>
                    <td className="p-3 text-center text-white font-semibold">{t.actual}kg</td>
                    <td className={`p-3 text-center font-bold ${getBarLabel(pct)}`}>{pct}%</td>
                    <td className="p-3 text-center text-gray-300">{t.rpe}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <button className="p-1 rounded bg-[#0A0A0A]" onClick={() => setEditRow(t)} data-testid={`button-edit-training-${t.id}`}><Edit2 size={11} className="text-[#F5B700]" /></button>
                        <button className="p-1 rounded bg-[#0A0A0A]" onClick={() => deleteTraining(t.id)} data-testid={`button-delete-training-${t.id}`}><Trash2 size={11} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {active.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum treino cadastrado.</p>
          )}
        </div>
      </div>

      <div className="mx-4">
        <button 
          onClick={() => setIsCalcExpanded(!isCalcExpanded)}
          className={`w-full py-4 px-5 rounded-2xl border transition-all flex items-center justify-between group ${isCalcExpanded ? 'border-[#F5B700] bg-[#F5B700]/5' : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#F5B700]/30'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isCalcExpanded ? 'bg-[#F5B700] text-black' : 'bg-[#0A0A0A] text-[#F5B700]'}`}>
              <Calculator size={18} />
            </div>
            <div className="text-left">
              <span className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isCalcExpanded ? 'text-[#F5B700]' : 'text-gray-500'}`}>Ferramentas Ironside</span>
              <span className="block text-sm font-bold text-white uppercase tracking-tighter">Quanto eu coloco na barra?</span>
            </div>
          </div>
          <ChevronDown 
            size={20} 
            className={`text-gray-500 transition-transform duration-300 ${isCalcExpanded ? 'rotate-180 text-[#F5B700]' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isCalcExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 card-dark border border-[#F5B700]/30 p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Calculator size={48} className="text-[#F5B700]" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 block">Carga Alvo (kg)</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:border-[#F5B700] outline-none transition-all"
                      value={calcTarget}
                      onChange={e => setCalcTarget(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 block">Porcentagem (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:border-[#F5B700] outline-none transition-all"
                      value={calcPct}
                      onChange={e => setCalcPct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between relative z-10">
                  <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">Resultado Ironside</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#F5B700] drop-shadow-[0_0_8px_rgba(245,183,0,0.3)]">
                      {Math.round(parseFloat(calcTarget || "0") * (parseFloat(calcPct || "0") / 100))}
                    </span>
                    <span className="text-[#F5B700] font-bold text-xs ml-1">kg</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-4 mt-2">
        <button className="btn-gold-outline w-full py-3 flex items-center justify-center gap-2 font-semibold uppercase tracking-tighter" data-testid="button-ask-ai" onClick={() => setShowAIModal(true)}>
          <Brain size={18} className="text-[#F5B700]" />
          Perguntar ao Coach IA de Biomecânica Analítica
        </button>
      </div>

      {showForm && <TrainingFormModal mode={mode} onSave={addTraining} onClose={() => setShowForm(false)} />}
      {editRow && <TrainingFormModal initial={editRow} mode={mode} onSave={updateTraining} onClose={() => setEditRow(null)} />}

      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setShowAIModal(false)}>
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-[#F5B700]" />
                <h3 className="text-[#F5B700] font-black text-sm uppercase tracking-widest">Coach IA Analítica</h3>
              </div>
              <button onClick={() => setShowAIModal(false)} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            
            {aiResponse && (
              <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#F5B700]/20 mb-3 max-h-[60vh] overflow-y-auto custom-scrollbar flex-1">
                <A2ARichReport rawText={aiResponse} />
              </div>
            )}

            {isAiLoading && (
              <div className="bg-black/40 p-4 rounded-xl border border-[#F5B700]/30 animate-pulse flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#F5B700] animate-bounce" />
                <span className="text-[#F5B700] text-[10px] font-black uppercase tracking-widest leading-none">
                  {thinkingMessages[statusIdx]}
                </span>
              </div>
            )}
            
            <div className="flex gap-2 mb-3 items-center">
              <IronsideVoiceRecorder 
                onTranscription={(text) => askAI(text)} 
                isLoading={isAiLoading}
              />
              <div className="flex-1 flex gap-1 items-center bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-2">
                <input
                  className="flex-1 bg-transparent py-2.5 text-white text-sm focus:outline-none"
                  placeholder="Ex: como estou..."
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askAI()}
                  data-testid="input-ai-query"
                />
                <button className="text-[#F5B700] hover:text-[#FF8C00] px-2 py-2 font-black text-xs uppercase" onClick={() => askAI()} data-testid="button-ask-ai-send">Enviar</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <A2AStatusIndicators 
                  status={neuralStatus} 
                  activeModel={lastModel} 
                />
                {aiResponse && (
                  <button 
                    onClick={() => openWhatsApp(cleanTextForSharing(aiResponse))}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#25D366]/10 border border-[#25D366]/30 rounded-full text-[#25D366] text-[8px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all ml-2"
                  >
                    <Share2 size={10} /> Compartilhar
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-[9px] uppercase font-black tracking-widest italic">Engine v5.0.0.1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
