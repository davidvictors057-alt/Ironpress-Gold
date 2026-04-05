import { useState } from "react";
import { Brain, TrendingUp, Plus, Edit2, Trash2, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { runRuleEngine } from "../services/coachAI/ruleEngine";

const RAW_KEY = "ironside_trainings_raw";
const EQ_KEY = "ironside_trainings_equipped";

export interface TrainingRecord {
  id: number;
  date: string;
  target: number;
  actual: number;
  rpe: number;
  modality: "raw" | "equipped";
}

const DEFAULT_RAW: TrainingRecord[] = [
  { id: 1, date: "26/03/2025", target: 185, actual: 185, rpe: 8, modality: "raw" },
  { id: 2, date: "28/03/2025", target: 187, actual: 186, rpe: 8.5, modality: "raw" },
  { id: 3, date: "30/03/2025", target: 185, actual: 185, rpe: 7.5, modality: "raw" },
  { id: 4, date: "01/04/2025", target: 188, actual: 187, rpe: 8, modality: "raw" },
  { id: 5, date: "02/04/2025", target: 190, actual: 190, rpe: 9, modality: "raw" },
  { id: 6, date: "03/04/2025", target: 185, actual: 183, rpe: 8, modality: "raw" },
  { id: 7, date: "04/04/2025", target: 187, actual: 187, rpe: 8, modality: "raw" },
];

const DEFAULT_EQ: TrainingRecord[] = [
  { id: 1, date: "25/03/2025", target: 270, actual: 270, rpe: 8, modality: "equipped" },
  { id: 2, date: "27/03/2025", target: 275, actual: 274, rpe: 8.5, modality: "equipped" },
  { id: 3, date: "29/03/2025", target: 270, actual: 268, rpe: 8, modality: "equipped" },
  { id: 4, date: "31/03/2025", target: 278, actual: 278, rpe: 9, modality: "equipped" },
  { id: 5, date: "02/04/2025", target: 280, actual: 280, rpe: 9.5, modality: "equipped" },
  { id: 6, date: "03/04/2025", target: 275, actual: 272, rpe: 8, modality: "equipped" },
  { id: 7, date: "04/04/2025", target: 278, actual: 277, rpe: 8.5, modality: "equipped" },
];

function loadTrainings(mode: "raw" | "equipped"): TrainingRecord[] {
  try {
    const key = mode === "raw" ? RAW_KEY : EQ_KEY;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : (mode === "raw" ? DEFAULT_RAW : DEFAULT_EQ);
  } catch { return mode === "raw" ? DEFAULT_RAW : DEFAULT_EQ; }
}

function saveTrainings(mode: "raw" | "equipped", trainings: TrainingRecord[]) {
  localStorage.setItem(mode === "raw" ? RAW_KEY : EQ_KEY, JSON.stringify(trainings));
}

function getBarColor(pct: number) {
  if (pct >= 99) return "#F5B700";
  if (pct >= 95) return "#E6A800";
  return "#FF8C00";
}

function getBarLabel(pct: number) {
  if (pct >= 99) return "text-[#F5B700]";
  if (pct >= 95) return "text-yellow-600";
  return "text-orange-500";
}

interface TrainingFormProps {
  initial?: Partial<TrainingRecord>;
  mode: "raw" | "equipped";
  onSave: (t: TrainingRecord) => void;
  onClose: () => void;
}

function TrainingFormModal({ initial, mode, onSave, onClose }: TrainingFormProps) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [target, setTarget] = useState(initial?.target?.toString() ?? "");
  const [actual, setActual] = useState(initial?.actual?.toString() ?? "");
  const [rpe, setRpe] = useState(initial?.rpe?.toString() ?? "8");

  function handle() {
    if (!date.trim() || !target || !actual) return;
    onSave({
      id: initial?.id ?? Date.now(),
      date: date.trim(),
      target: parseFloat(target),
      actual: parseFloat(actual),
      rpe: parseFloat(rpe),
      modality: mode,
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
          <div className="flex gap-2">
            <input type="number" className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Alvo (kg)" value={target} onChange={e => setTarget(e.target.value)} data-testid="input-training-target" />
            <input type="number" className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Realizado (kg)" value={actual} onChange={e => setActual(e.target.value)} data-testid="input-training-actual" />
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
  const [mode, setMode] = useState<"raw" | "equipped">("equipped");
  const [trainings, setTrainings] = useState<TrainingRecord[]>(() => loadTrainings("equipped"));
  const [rawTrainings, setRawTrainings] = useState<TrainingRecord[]>(() => loadTrainings("raw"));
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<TrainingRecord | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiQuery, setAiQuery] = useState("");

  const active = mode === "equipped" ? trainings : rawTrainings;

  function setActive(updated: TrainingRecord[]) {
    if (mode === "equipped") { setTrainings(updated); saveTrainings("equipped", updated); }
    else { setRawTrainings(updated); saveTrainings("raw", updated); }
  }

  function addTraining(t: TrainingRecord) { setActive([...active, t]); }
  function updateTraining(t: TrainingRecord) { setActive(active.map(x => x.id === t.id ? t : x)); }
  function deleteTraining(id: number) { setActive(active.filter(x => x.id !== id)); }

  const pcts = active.map(t => Math.round((t.actual / t.target) * 100));
  const highPct = pcts.filter(p => p >= 99).length;

  const chartData = active.map(t => ({
    date: t.date.slice(0, 5),
    alvo: t.target,
    realizado: t.actual,
    pct: Math.round((t.actual / t.target) * 100),
  }));

  function askAI() {
    const resp = runRuleEngine(aiQuery || "como estou");
    setAiResponse(resp);
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

      {/* Mode Selector — F8 primeiro */}
      <div className="mx-4 flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A]" data-testid="selector-mode">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "equipped" ? "btn-gold" : "text-gray-400"}`}
          onClick={() => setMode("equipped")}
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

      {/* Chart */}
      {active.length > 0 && (
        <div className="mx-4 card-dark p-4 border border-[#2A2A2A]" data-testid="chart-trainings">
          <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">Alvo vs Realizado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="date" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }} labelStyle={{ color: "#F5B700" }} itemStyle={{ color: "#fff" }} />
              <Legend formatter={(v) => <span style={{ color: "#B0B0B0", fontSize: 11 }}>{v === "alvo" ? "Alvo" : "Realizado"}</span>} />
              <Bar dataKey="alvo" fill="#2A2A2A" name="alvo" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="realizado" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={getBarColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insight */}
      {active.length > 0 && (
        <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/40 rounded-xl p-4" data-testid="card-insight">
          <div className="flex items-start gap-2">
            <span className="text-[#F5B700] text-xl">⚡</span>
            <div>
              <p className="text-[#F5B700] font-bold text-sm">Insight do Coach IA</p>
              <p className="text-gray-200 text-sm mt-1">
                {mode === "equipped"
                  ? `Você atingiu 99%+ em ${highPct} dos ${active.length} últimos treinos F8. Consistência de bicampeão!`
                  : `Seus treinos RAW mostram evolução contínua para a meta de 210kg.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mx-4">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-2">
          Treinos — {mode === "equipped" ? "Equipado F8" : "RAW"}
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

      {/* AI Button */}
      <div className="mx-4">
        <button className="btn-gold-outline w-full py-3 flex items-center justify-center gap-2 font-semibold" data-testid="button-ask-ai" onClick={() => setShowAIModal(true)}>
          <Brain size={18} className="text-[#F5B700]" />
          Perguntar ao Coach IA Ironside
        </button>
      </div>

      {/* Forms */}
      {showForm && <TrainingFormModal mode={mode} onSave={addTraining} onClose={() => setShowForm(false)} />}
      {editRow && <TrainingFormModal initial={editRow} mode={mode} onSave={updateTraining} onClose={() => setEditRow(null)} />}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setShowAIModal(false)}>
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#F5B700] font-black text-lg">Coach IA Ironside</h3>
              <button onClick={() => setShowAIModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-gray-500 text-xs mb-3">Motor de regras local — futuramente substituído por Gemini API</p>
            {aiResponse && (
              <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#F5B700]/20 mb-3">
                <p className="text-gray-200 text-sm leading-relaxed">{aiResponse}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
                placeholder="Ex: como estou, abertura recomendada, protocolo..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askAI()}
                data-testid="input-ai-query"
              />
              <button className="btn-gold px-4 py-2.5 font-bold text-sm rounded-xl" onClick={askAI} data-testid="button-ask-ai-send">Enviar</button>
            </div>
            <p className="text-gray-600 text-xs mt-2 text-center">Tente: "como estou", "abertura recomendada", "protocolo hormonal"</p>
          </div>
        </div>
      )}
    </div>
  );
}
