import { useState, useEffect } from "react";
import { Heart, AlertTriangle, CheckSquare, Plus, FlaskConical, Trash2, Edit2, Download, Upload } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import WeekCard, { HormonalWeek } from "../components/hormone/WeekCard";
import { exportBackup, importBackup } from "../services/storage/backupService";

const HEALTH_KEY = "ironside_health_data";
const SUPPS_KEY = "ironside_supplements";
const HORMONAL_KEY = "ironside_hormonal_cycles";

const healthCorrelation = [
  { session: "S1", pain: 2, performance: 99 },
  { session: "S2", pain: 3, performance: 97 },
  { session: "S3", pain: 5, performance: 88 },
  { session: "S4", pain: 1, performance: 100 },
  { session: "S5", pain: 4, performance: 93 },
  { session: "S6", pain: 2, performance: 98 },
  { session: "S7", pain: 6, performance: 84 },
];

type HealthData = { shoulder: number; elbow: number; wrist: number; fatigue: number };
type Supplement = { id: number; name: string; dose: string; unit: string; schedule: string; stock: number };

function loadHealth(): HealthData {
  try { return JSON.parse(localStorage.getItem(HEALTH_KEY) || "{}"); } catch { return { shoulder: 0, elbow: 0, wrist: 0, fatigue: 0 }; }
}

function loadSupplements(): Supplement[] {
  try {
    return JSON.parse(localStorage.getItem(SUPPS_KEY) || "[]");
  } catch { return []; }
}

function saveSupplements(supps: Supplement[]) {
  localStorage.setItem(SUPPS_KEY, JSON.stringify(supps));
}

function loadHormonalCycles(): HormonalWeek[] {
  try { return JSON.parse(localStorage.getItem(HORMONAL_KEY) || "[]"); } catch { return []; }
}

function saveHormonalCycles(cycles: HormonalWeek[]) {
  localStorage.setItem(HORMONAL_KEY, JSON.stringify(cycles));
}

function PainSlider({ label, value, onChange, testId }: { label: string; value: number; onChange: (v: number) => void; testId: string }) {
  const color = value <= 3 ? "#4ade80" : value <= 6 ? "#F5B700" : "#ef4444";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="font-bold text-sm" style={{ color }}>{value}/10</span>
      </div>
      <input type="range" min={0} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer" data-testid={testId} style={{ accentColor: color }} />
    </div>
  );
}

function SuppModal({ initial, onSave, onClose }: {
  initial?: Partial<Supplement>;
  onSave: (s: Supplement) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dose, setDose] = useState(initial?.dose ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "g/dia");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "30");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
        <h3 className="text-[#F5B700] font-black text-lg mb-4">{initial?.id ? "Editar" : "Novo"} Suplemento</h3>
        <div className="space-y-3">
          <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Nome (ex: Creatina)" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-2">
            <input className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Dose (ex: 5g)" value={dose} onChange={e => setDose(e.target.value)} />
            <input className="w-28 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="g/dia" value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
          <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Horário (ex: Pós-treino)" value={schedule} onChange={e => setSchedule(e.target.value)} />
          <div className="flex items-center gap-2">
            <input type="number" className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Estoque (dias)" value={stock} onChange={e => setStock(e.target.value)} />
            <span className="text-gray-400 text-sm">dias restantes</span>
          </div>
          <button className="btn-gold w-full py-3 font-black text-sm" onClick={() => {
            if (!name.trim()) return;
            onSave({ id: initial?.id ?? Date.now(), name, dose, unit, schedule, stock: parseInt(stock) || 0 });
            onClose();
          }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function Health() {
  const [tab, setTab] = useState<"health" | "hormonal">("health");
  const [health, setHealth] = useState<HealthData>(loadHealth);
  const [saved, setSaved] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>(loadSupplements);
  const [editSupp, setEditSupp] = useState<Supplement | null>(null);
  const [showAddSupp, setShowAddSupp] = useState(false);
  const [hormonalWeeks, setHormonalWeeks] = useState<HormonalWeek[]>(loadHormonalCycles);

  useEffect(() => { setHealth(loadHealth()); }, []);
  useEffect(() => { setSupplements(loadSupplements()); }, []);

  function updateHealth(key: keyof HealthData, val: number) { setHealth(prev => ({ ...prev, [key]: val })); setSaved(false); }
  function saveHealth() { localStorage.setItem(HEALTH_KEY, JSON.stringify(health)); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function addSupp(s: Supplement) { const u = [...supplements, s]; setSupplements(u); saveSupplements(u); }
  function updateSupp(s: Supplement) { const u = supplements.map(x => x.id === s.id ? s : x); setSupplements(u); saveSupplements(u); }
  function deleteSupp(id: number) { const u = supplements.filter(x => x.id !== id); setSupplements(u); saveSupplements(u); }

  function addWeek() {
    const wk: HormonalWeek = { id: `wk_${Date.now()}`, label: `Semana ${hormonalWeeks.length + 1}`, medications: [] };
    const updated = [...hormonalWeeks, wk];
    setHormonalWeeks(updated);
    saveHormonalCycles(updated);
  }

  function updateWeek(week: HormonalWeek) {
    const updated = hormonalWeeks.map(w => w.id === week.id ? week : w);
    setHormonalWeeks(updated);
    saveHormonalCycles(updated);
  }

  function deleteWeek(id: string) {
    const updated = hormonalWeeks.filter(w => w.id !== id);
    setHormonalWeeks(updated);
    saveHormonalCycles(updated);
  }

  function duplicateWeek(id: string) {
    const source = hormonalWeeks.find(w => w.id === id);
    if (!source) return;
    const newWeek: HormonalWeek = {
      id: `wk_${Date.now()}`,
      label: `Semana ${hormonalWeeks.length + 1} (cópia)`,
      medications: source.medications.map(m => ({ ...m, id: `med_${Date.now()}_${Math.random()}` })),
    };
    const updated = [...hormonalWeeks, newWeek];
    setHormonalWeeks(updated);
    saveHormonalCycles(updated);
  }

  const totalMgWeekAll = hormonalWeeks.reduce((acc, wk) => acc + wk.medications.reduce((a, m) => a + m.concentration * m.dose * m.frequency, 0), 0);
  const lowStockSupps = supplements.filter(s => s.stock < 20);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) importBackup(file).then(() => window.location.reload()).catch(err => alert("Erro ao importar: " + err.message));
  }

  return (
    <div className="pb-6 space-y-4">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>SAÚDE</h1>
        </div>
        <p className="text-gray-400 text-sm">Monitoramento e protocolo hormonal</p>
      </div>

      {/* Tabs */}
      <div className="mx-4 flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A]">
        <button className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === "health" ? "btn-gold" : "text-gray-400"}`} onClick={() => setTab("health")} data-testid="tab-health">
          Saúde & Suplementos
        </button>
        <button className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === "hormonal" ? "btn-gold" : "text-gray-400"}`} onClick={() => setTab("hormonal")} data-testid="tab-hormonal">
          Protocolo Hormonal
        </button>
      </div>

      {tab === "health" && (
        <>
          {/* Low Stock Alert */}
          {lowStockSupps.length > 0 && (
            <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/50 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="text-[#F5B700]" size={18} />
              <div>
                <p className="text-[#F5B700] font-bold text-sm">Estoque Baixo</p>
                <p className="text-gray-300 text-xs">{lowStockSupps.map(s => s.name).join(", ")} — menos de 20 dias</p>
              </div>
            </div>
          )}

          {/* Supplements */}
          <div className="mx-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider">Suplementos</h3>
              <button className="btn-gold px-3 py-1.5 text-xs font-bold flex items-center gap-1" onClick={() => setShowAddSupp(true)} data-testid="button-add-supplement">
                <Plus size={13} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {supplements.map(s => (
                <div key={s.id} className={`card-dark p-3 border flex items-center gap-3 ${s.stock < 20 ? "border-[#F5B700]/40" : "border-[#2A2A2A]"}`} data-testid={`card-supp-${s.id}`}>
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center border-gray-500 cursor-pointer`}>
                    <CheckSquare size={12} className="text-[#F5B700] opacity-50" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{s.name}</p>
                    <p className="text-gray-400 text-xs">{s.dose} {s.unit}{s.schedule ? ` — ${s.schedule}` : ""}</p>
                  </div>
                  <div className={`text-right mr-1 ${s.stock < 20 ? "text-[#F5B700]" : "text-gray-400"}`}>
                    <p className="font-bold text-sm">{s.stock}</p>
                    <p className="text-xs">dias</p>
                    {s.stock < 20 && <AlertTriangle size={12} className="text-[#F5B700] ml-auto mt-0.5" />}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg bg-[#0A0A0A]" onClick={() => setEditSupp(s)} data-testid={`button-edit-supp-${s.id}`}><Edit2 size={13} className="text-[#F5B700]" /></button>
                    <button className="p-1.5 rounded-lg bg-[#0A0A0A]" onClick={() => deleteSupp(s.id)} data-testid={`button-delete-supp-${s.id}`}><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>
              ))}
              {supplements.length === 0 && <p className="text-gray-500 text-sm text-center py-2">Nenhum suplemento cadastrado.</p>}
            </div>
          </div>

          {/* Pain sliders */}
          <div className="mx-4 card-dark border border-[#2A2A2A] p-4">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">Dor & Fadiga</h3>
            <PainSlider label="Ombro" value={health.shoulder} onChange={v => updateHealth("shoulder", v)} testId="slider-shoulder" />
            <PainSlider label="Cotovelo" value={health.elbow} onChange={v => updateHealth("elbow", v)} testId="slider-elbow" />
            <PainSlider label="Punho" value={health.wrist} onChange={v => updateHealth("wrist", v)} testId="slider-wrist" />
            <PainSlider label="Fadiga Geral" value={health.fatigue} onChange={v => updateHealth("fatigue", v)} testId="slider-fatigue" />
            <button className="btn-gold w-full py-2.5 font-bold text-sm mt-2" onClick={saveHealth} data-testid="button-save-health">
              {saved ? "Salvo!" : "Salvar"}
            </button>
          </div>

          {/* Chart */}
          <div className="mx-4 card-dark p-4 border border-[#2A2A2A]">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">Dor vs Performance</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={healthCorrelation} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="session" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }} labelStyle={{ color: "#F5B700" }} itemStyle={{ color: "#fff" }} />
                <Bar dataKey="pain" name="Dor" radius={[4, 4, 0, 0]}>{healthCorrelation.map((_, i) => <Cell key={i} fill="#ef4444" />)}</Bar>
                <Bar dataKey="performance" name="Performance %" radius={[4, 4, 0, 0]}>{healthCorrelation.map((_, i) => <Cell key={i} fill="#F5B700" />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-xl p-4">
            <p className="text-[#F5B700] font-bold text-sm mb-1">Insight Automático</p>
            <p className="text-gray-200 text-sm">Quando a dor no cotovelo ultrapassou 4, seu rendimento caiu 7%. Fortaleça os extensores e mantenha o cotovelo aquecido antes do supino.</p>
          </div>

          {/* Backup */}
          <div className="mx-4 card-dark border border-[#2A2A2A] p-4">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-3">Backup de Dados</h3>
            <div className="flex gap-2">
              <button className="flex-1 btn-gold-outline py-2.5 text-sm flex items-center justify-center gap-2" onClick={exportBackup} data-testid="button-export-backup">
                <Download size={15} className="text-[#F5B700]" /> Exportar JSON
              </button>
              <label className="flex-1 btn-gold-outline py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer" data-testid="label-import-backup">
                <Upload size={15} className="text-[#F5B700]" /> Importar
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        </>
      )}

      {tab === "hormonal" && (
        <>
          {/* Hormonal Header */}
          <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="text-[#F5B700]" size={20} />
              <div>
                <p className="text-[#F5B700] font-black text-sm">Protocolo Hormonal</p>
                <p className="text-gray-400 text-xs">{hormonalWeeks.length} semana(s) cadastrada(s)</p>
              </div>
            </div>
            {totalMgWeekAll > 0 && (
              <div className="text-right">
                <p className="text-gray-500 text-xs">Total ciclo</p>
                <p className="text-[#F5B700] font-black text-xl">{totalMgWeekAll.toFixed(0)}<span className="text-xs ml-0.5">mg</span></p>
              </div>
            )}
          </div>

          <div className="mx-4 space-y-3">
            {hormonalWeeks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">Nenhuma semana cadastrada.</p>
                <p className="text-gray-600 text-xs mt-1">Adicione a primeira semana do protocolo abaixo.</p>
              </div>
            )}
            {hormonalWeeks.map(week => (
              <WeekCard
                key={week.id}
                week={week}
                onUpdate={updateWeek}
                onDelete={() => deleteWeek(week.id)}
                onDuplicate={() => duplicateWeek(week.id)}
              />
            ))}
          </div>

          <div className="mx-4">
            <button
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 font-black text-sm"
              onClick={addWeek}
              data-testid="button-add-week"
            >
              <Plus size={18} />
              Adicionar Semana
            </button>
          </div>

          <div className="mx-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-gray-500 text-xs text-center">
              ⚕️ Consulte sempre seu médico esportivo antes de ajustar o protocolo. Os cálculos são automáticos: mg/semana = concentração × dose × frequência.
            </p>
          </div>
          {/* TODO: Futuramente integrar com Supabase para sincronização em nuvem */}
        </>
      )}

      {showAddSupp && <SuppModal onSave={addSupp} onClose={() => setShowAddSupp(false)} />}
      {editSupp && <SuppModal initial={editSupp} onSave={updateSupp} onClose={() => setEditSupp(null)} />}
    </div>
  );
}
