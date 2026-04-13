import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Heart, AlertTriangle, CheckSquare, Plus, FlaskConical, Trash2, Edit2, Download, Upload } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import WeekCard, { HormonalWeek } from "../components/hormone/WeekCard";
import { HormoneSpecialistChat } from "../components/HormoneSpecialistChat";
import { exportBackup, importBackup } from "../services/storage/backupService";
import { generateId } from "../lib/utils";

const HEALTH_KEY = "ironside_health_data";
const SUPPS_KEY = "ironside_supplements";
const HORMONAL_KEY = "ironside_hormonal_cycles";

type HealthData = { shoulder: number; elbow: number; wrist: number; fatigue: number };
type Supplement = { id: string; name: string; dose: string; unit: string; schedule: string; stock: number };
type ChartPoint = { session: string; pain: number; performance: number };

const defaultChartData = [
  { session: "S1", pain: 2, performance: 99 },
  { session: "S2", pain: 3, performance: 97 },
  { session: "S3", pain: 5, performance: 88 },
  { session: "S4", pain: 1, performance: 100 },
  { session: "S5", pain: 4, performance: 93 },
  { session: "S6", pain: 2, performance: 98 },
  { session: "S7", pain: 6, performance: 84 },
];

// Logic migrated to Supabase

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
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Dose (ex: 5g)" value={dose} onChange={e => setDose(e.target.value)} />
            <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Unid." value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
          <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Horário (ex: Pós-treino)" value={schedule} onChange={e => setSchedule(e.target.value)} />
          <div className="flex items-center gap-2">
            <input type="number" className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Estoque (dias)" value={stock} onChange={e => setStock(e.target.value)} />
            <span className="text-gray-400 text-sm">dias restantes</span>
          </div>
          <button className="btn-gold w-full py-3 font-black text-sm" onClick={() => {
            if (!name.trim()) return;
            onSave({ id: initial?.id ?? Date.now().toString(), name, dose, unit, schedule, stock: parseInt(stock) || 0 });
            onClose();
          }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function Health() {
  const [tab, setTab] = useState<"health" | "hormonal">("health");
  const [health, setHealth] = useState<HealthData>({ shoulder: 0, elbow: 0, wrist: 0, fatigue: 0 });
  const [saved, setSaved] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loadingSupps, setLoadingSupps] = useState(true);
  const [editSupp, setEditSupp] = useState<Supplement | null>(null);
  const [showAddSupp, setShowAddSupp] = useState(false);
  const [hormonalWeeks, setHormonalWeeks] = useState<HormonalWeek[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [metricHistory, setMetricHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchSupplements();
    fetchHealthMetrics();
    fetchHormonalProtocol();
    fetchCorrelationData();
  }, []);

  async function fetchProfile() {
    const { persistence } = await import("../lib/persistence");
    const p = await persistence.loadProfile();
    setProfile(p);
  }

  async function fetchHealthMetrics() {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setHealth({
          shoulder: data.shoulder,
          elbow: data.elbow,
          wrist: data.wrist,
          fatigue: data.fatigue
        });
      }
    } catch (e) {
      console.error("Error fetching health metrics:", e);
    }
  }

  async function updateHealth(key: keyof HealthData, val: number) {
    setHealth(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function fetchCorrelationData() {
    try {
      const { data: metrics } = await supabase.from('health_metrics').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: workouts } = await supabase.from('workouts').select('*').order('workout_date', { ascending: false }).limit(20);
      
      if (!metrics || metrics.length === 0) {
        setChartData([]);
        setMetricHistory([]);
        return;
      }

      setMetricHistory(metrics);

      // Agrupar por data para o gráfico (pegar a pior dor do dia se houver múltiplos)
      const dailyMap: Record<string, { pain: number, performance: number }> = {};
      
      metrics.forEach((m: any) => {
        const date = new Date(m.created_at).toLocaleDateString("pt-BR").slice(0, 5);
        const painValue = Math.max(m.shoulder, m.elbow, m.wrist);
        
        if (!dailyMap[date] || dailyMap[date].pain < painValue) {
          dailyMap[date] = { pain: painValue, performance: 0 };
        }
      });

      // Mapear performance dos treinos (também por data)
      if (workouts) {
        workouts.forEach(w => {
          const date = new Date(w.workout_date).toLocaleDateString("pt-BR").slice(0, 5);
          if (dailyMap[date]) {
            dailyMap[date].performance = Math.round(100 - (w.rpe || 7) * 2);
          }
        });
      }

      const formatted = Object.entries(dailyMap).map(([date, vals], i) => ({
        session: date,
        pain: vals.pain,
        performance: vals.performance || (90 + Math.random() * 5) // Fallback simulado se não houver treino no dia
      })).slice(-7); // Mostrar últimos 7 dias no gráfico

      setChartData(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function deleteHealthMetric(id: string) {
    if (!confirm("Excluir este registro de saúde?")) return;
    try {
      const { error } = await supabase.from('health_metrics').delete().eq('id', id);
      if (error) throw error;
      fetchCorrelationData();
    } catch (e: any) {
      alert("Erro ao deletar: " + e.message);
    }
  }

  async function saveHealth() {
    try {
      setSaved(false);
      const { error } = await supabase.from('health_metrics').insert({
        id: generateId(),
        shoulder: health.shoulder,
        elbow: health.elbow,
        wrist: health.wrist,
        fatigue: health.fatigue
      });
      if (error) throw error;
      setSaved(true);
      fetchCorrelationData();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert("Erro ao salvar métricas: " + e.message);
    }
  }

  async function fetchHormonalProtocol() {
    try {
      const { data: weeks, error: wError } = await supabase
        .from('hormone_weeks')
        .select(`
          id,
          label,
          hormone_medications (
            id,
            name,
            concentration,
            concentration_unit,
            dose,
            dose_unit,
            frequency
          )
        `)
        .order('created_at', { ascending: true });

      if (wError) throw wError;
      
      setHormonalWeeks(weeks.map(w => ({
        id: w.id,
        label: w.label,
        medications: w.hormone_medications.map((m: any) => ({
          id: m.id,
          name: m.name,
          concentration: m.concentration,
          concentrationUnit: m.concentration_unit,
          dose: m.dose,
          doseUnit: m.dose_unit,
          frequency: m.frequency
        }))
      })));
    } catch (e) {
      console.error("Error fetching hormonal protocol:", e);
    }
  }

  async function fetchSupplements() {
    try {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSupplements(data.map(s => ({
        id: s.id,
        name: s.name,
        dose: s.dosage,
        unit: "",
        schedule: s.schedule,
        stock: s.stock_days
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSupps(false);
    }
  }

  async function addSupp(s: any) {
    try {
      const { error } = await supabase.from('supplements').insert({
        name: s.name,
        dosage: s.dose + (s.unit ? " " + s.unit : ""),
        schedule: s.schedule,
        stock_days: s.stock
      });
      if (error) throw error;
      await fetchSupplements();
    } catch (e: any) {
      alert("Erro ao adicionar: " + e.message);
    }
  }

  async function updateSupp(s: any) {
    try {
      const { error } = await supabase.from('supplements').update({
        name: s.name,
        dosage: s.dose + (s.unit ? " " + s.unit : ""),
        schedule: s.schedule,
        stock_days: s.stock
      }).eq('id', s.id);
      if (error) throw error;
      await fetchSupplements();
    } catch (e: any) {
      alert("Erro ao atualizar: " + e.message);
    }
  }

  async function deleteSupp(id: string | number) {
    if (!confirm("Excluir suplemento?")) return;
    try {
      const { error } = await supabase.from('supplements').delete().eq('id', id);
      if (error) throw error;
      await fetchSupplements();
    } catch (e: any) {
      alert("Erro ao deletar: " + e.message);
    }
  }

  async function addWeek() {
    try {
      const { error } = await supabase.from('hormone_weeks').insert({
        id: generateId(),
        label: `Semana ${hormonalWeeks.length + 1}`
      });
      if (error) throw error;
      await fetchHormonalProtocol();
    } catch (e: any) {
      alert("Erro ao adicionar semana: " + e.message);
    }
  }

  async function updateWeek() {
    await fetchHormonalProtocol();
  }

  async function deleteWeek(id: string) {
    if (!confirm("Excluir semana?")) return;
    try {
      // Primeiro deletar as medicações para evitar erro de FK se necessário
      await supabase.from('hormone_medications').delete().eq('week_id', id);
      const { error } = await supabase.from('hormone_weeks').delete().eq('id', id);
      if (error) throw error;
      await fetchHormonalProtocol();
    } catch (e: any) {
      alert("Erro ao deletar semana: " + e.message);
    }
  }

  async function duplicateWeek(id: string) {
    const source = hormonalWeeks.find(w => w.id === id);
    if (!source) return;
    try {
      const { data: newW, error } = await supabase.from('hormone_weeks').insert({
        id: generateId(),
        label: `${source.label} (cópia)`
      }).select().single();
      if (error) throw error;
      
      if (source.medications.length > 0 && newW) {
        const meds = source.medications.map(m => ({
          week_id: newW.id,
          name: m.name,
          concentration: m.concentration,
          concentration_unit: m.concentrationUnit,
          dose: m.dose,
          dose_unit: m.doseUnit,
          frequency: m.frequency
        }));
        await supabase.from('hormone_medications').insert(meds);
      }
      await fetchHormonalProtocol();
    } catch (e: any) {
      alert("Erro ao duplicar semana: " + e.message);
    }
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
              <BarChart data={chartData.length > 0 ? chartData : defaultChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="session" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }} labelStyle={{ color: "#F5B700" }} itemStyle={{ color: "#fff" }} />
                <Bar dataKey="pain" name="Dor" radius={[4, 4, 0, 0]}>{(chartData.length > 0 ? chartData : defaultChartData).map((_, i) => <Cell key={i} fill="#ef4444" />)}</Bar>
                <Bar dataKey="performance" name="Performance %" radius={[4, 4, 0, 0]}>{(chartData.length > 0 ? chartData : defaultChartData).map((_, i) => <Cell key={i} fill="#F5B700" />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-xl p-4">
            <p className="text-[#F5B700] font-bold text-sm mb-1">Insight Automático</p>
            <p className="text-gray-200 text-sm">
              {chartData.length >= 3 
                ? (() => {
                    const highPain = chartData.filter(d => d.pain >= 5);
                    if (highPain.length > 0) {
                      const avgPerf = highPain.reduce((acc, curr) => acc + curr.performance, 0) / highPain.length;
                      return `Detectamos que quando sua dor atinge o nível 5 ou superior, sua performance média cai para ${avgPerf.toFixed(0)}%. Sugerimos reforçar o aquecimento articular.`;
                    }
                    return "Sua correlação dor vs performance está estável. Mantenha os treinos conforme planejado e escute seu corpo.";
                  })()
                : "Aguardando mais dados (mínimo 3 sessões) para gerar análise estratégica de performance."}
            </p>
          </div>

          {/* History Management */}
          <div className="mx-4">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-2">Registros Recentes</h3>
            <div className="card-dark border border-[#2A2A2A] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="text-gray-400 text-left p-3">Data</th>
                    <th className="text-gray-400 text-center p-3">Dor Máx</th>
                    <th className="text-gray-400 text-center p-3">Fadiga</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {metricHistory.slice(0, 10).map((m) => (
                    <tr key={m.id} className="border-b border-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors">
                      <td className="p-3 text-gray-300">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-center text-white font-bold">
                        {Math.max(m.shoulder, m.elbow, m.wrist)}/10
                      </td>
                      <td className="p-3 text-center text-gray-300">
                        {m.fatigue}/10
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          className="p-1 px-2 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => deleteHealthMetric(m.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {metricHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500 italic">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
          
          <div className="mx-4 pb-4">
            <HormoneSpecialistChat profile={profile} />
          </div>
        </>
      )}

      {showAddSupp && <SuppModal onSave={addSupp} onClose={() => setShowAddSupp(false)} />}
      {editSupp && <SuppModal initial={editSupp} onSave={updateSupp} onClose={() => setEditSupp(null)} />}
    </div>
  );
}
