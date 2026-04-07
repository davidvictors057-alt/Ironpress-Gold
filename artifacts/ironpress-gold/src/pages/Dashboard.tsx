import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trophy, Crown, Flame, Camera, ChevronRight, Dumbbell, Target, X, Info, Star, Edit2, Trash2, Plus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "../lib/supabase";

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CountdownCard({ comp }: { comp: any }) {
  if (!comp) return null;
  const days = getDaysUntil(comp.date);
  return (
    <div
      className="card-dark p-4 border border-[#F5B700]/40 glow-gold"
      data-testid="card-next-competition"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-[#F5B700]" size={20} />
          <span className="text-sm font-semibold text-[#F5B700] uppercase tracking-wider">
            Próximo Campeonato
          </span>
        </div>
        <span className="text-xs text-gray-400 border border-[#F5B700]/30 px-2 py-0.5 rounded-full">
          {comp.modality}
        </span>
      </div>
      <h3 className="text-white font-bold text-lg mb-1">{comp.name}</h3>
      <p className="text-gray-400 text-sm mb-3">{comp.date.split("-").reverse().join("/")} — {comp.location}</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-black text-[#F5B700]">{days}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">dias</div>
        </div>
        <div className="h-12 w-px bg-[#F5B700]/20" />
        <div>
          <div className="text-sm text-gray-400">Meta</div>
          <div className="text-2xl font-black text-white">{comp.goal}<span className="text-lg text-[#F5B700]">kg</span></div>
        </div>
      </div>
    </div>
  );
}

function TodayTrainingCard() {
  const [, setLocation] = useLocation();
  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="card-today-training">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="text-[#F5B700]" size={20} />
        <span className="text-sm font-semibold text-[#F5B700] uppercase tracking-wider">
          Treino de Hoje
        </span>
      </div>
      <p className="text-white font-semibold mb-1">Supino Reto RAW</p>
      <p className="text-gray-300 text-sm mb-1">4x6 @ 185kg — RPE 8</p>
      <p className="text-gray-400 text-xs mb-4">
        <Target size={12} className="inline mr-1 text-[#F5B700]" />
        Alvo: 190kg
      </p>
      <button
        className="btn-gold w-full py-2 text-sm font-bold uppercase tracking-widest"
        data-testid="button-register-training"
        onClick={() => setLocation("/treinos")}
      >
        Registrar Treino
      </button>
    </div>
  );
}

function AchievementFormModal({ initial, onSave, onClose }: { initial?: any, onSave: (d: any) => void, onClose: () => void }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [date, setDate] = useState(initial?.date || "");
  const [details, setDetails] = useState(initial?.details || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1A1A1A] border border-gold w-full max-w-sm rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}>
        <h4 className="text-gold font-black text-lg mb-4 uppercase">{initial ? 'Editar' : 'Nova'} Conquista</h4>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Título</label>
            <input 
              className="w-full bg-[#0A0A0A] border border-gold/30 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none"
              placeholder="Ex: Campeão Mundial GPC"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Data/Ano</label>
            <input 
              className="w-full bg-[#0A0A0A] border border-gold/30 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none"
              placeholder="Ex: 2023"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Detalhes (PRs, Localização, etc)</label>
            <textarea 
              className="w-full bg-[#0A0A0A] border border-gold/30 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none h-24"
              placeholder="Conte como foi essa conquista..."
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 py-3 text-gray-400 font-bold" onClick={onClose}>Cancelar</button>
            <button 
              className="flex-1 btn-gold py-3 font-bold" 
              onClick={() => onSave({ label, date, details })}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvolutionChart({ data }: { data: any[] }) {
  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="chart-evolution">
      <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">
        Evolução 1RM — Últimas 8 Semanas
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="week" tick={{ fill: "#B0B0B0", fontSize: 11 }} />
          <YAxis tick={{ fill: "#B0B0B0", fontSize: 11 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
            labelStyle={{ color: "#F5B700" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#B0B0B0", fontSize: 12 }}>
                {value === "raw" ? "RAW" : "Equipado F8"}
              </span>
            )}
          />
          <Line type="monotone" dataKey="raw" stroke="#F5B700" strokeWidth={2.5} dot={{ fill: "#F5B700", r: 4 }} name="raw" />
          <Line type="monotone" dataKey="equipped" stroke="#FF8C00" strokeWidth={2.5} dot={{ fill: "#FF8C00", r: 4 }} name="equipped" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [nextComp, setNextComp] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [selectedAch, setSelectedAch] = useState<any>(null);
  const [editingAch, setEditingAch] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fileInputRef = useState<any>(null);

  useEffect(() => { 
    setMounted(true);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch Profile
      const { data: pData } = await supabase.from('profiles').select('*').limit(1).single();
      if (pData) setProfile(pData);

      // Fetch Next Comp
      const { data: cData } = await supabase.from('competitions').select('*').order('date', { ascending: true }).limit(1).single();
      if (cData) setNextComp(cData);

      // Fetch Evolution (Mocking aggregate for now from workouts)
      const { data: wData } = await supabase.from('workouts').select('*').order('created_at', { ascending: true });
      if (wData) {
        // Simple mock mapping to chart format
        const mapped = wData.slice(-8).map((w, i) => ({
          week: `S${i+1}`,
          raw: w.modality === 'RAW' ? w.load_kg : 180 + i*2,
          equipped: w.modality === 'F8' ? w.load_kg : 260 + i*3
        }));
        setEvolution(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function saveAchievements(newAchList: any[]) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ achievements: newAchList })
        .eq('id', profile?.id);
      
      if (error) throw error;
      setProfile({ ...profile, achievements: newAchList });
      setIsAdding(false);
      setEditingAch(null);
    } catch (err: any) {
      alert("Erro ao salvar história: " + err.message);
    }
  }

  function handleDeleteAch(index: number) {
    if (!confirm("Excluir essa conquista da sua história?")) return;
    const newList = profile?.achievements?.filter((_: any, i: number) => i !== index) || [];
    saveAchievements(newList);
  }

  function handleEditOrAdd(data: any) {
    const list = [...(profile?.achievements || [])];
    if (editingAch !== null) {
      list[editingAch.index] = data;
    } else {
      list.push(data);
    }
    saveAchievements(list);
  }

  return (
    <div className="pb-6 space-y-4">
      {/* Hero Header */}
      <div className="text-center py-6 px-4">
        <div 
          className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-gold flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden cursor-pointer relative group"
          onClick={() => document.getElementById('avatar-input')?.click()}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-gold font-black text-3xl" style={{ fontFamily: "Montserrat, sans-serif" }}>IR</span>
              <Camera size={14} className="text-gold/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-gold" />
          </div>
          <input 
            id="avatar-input"
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setProfile({ ...profile, avatar_url: url });
              }
            }}
          />
        </div>
        <h1 className="text-5xl font-black text-[#F5B700] tracking-tighter" style={{ fontFamily: "Montserrat, sans-serif" }}>
          IRONSIDE
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Leonardo Rodrigues
        </p>
        <div className="h-px w-12 bg-gold/30 mx-auto mb-3" />
        <p className="text-gray-300 text-sm">
          95kg | Categoria 100kg
        </p>
      </div>

      {/* Welcome Banner */}
      <div className="mx-4 card-dark border border-[#F5B700]/30 p-4" data-testid="card-welcome">
        <div className="flex items-center gap-2">
          <Crown className="text-[#F5B700]" size={22} />
          <div>
            <p className="text-white font-bold">Bem-vindo de volta, Campeão Mundial!</p>
            <p className="text-gray-400 text-xs">Hoje é dia de superação, Ironside.</p>
          </div>
        </div>
      </div>

      {/* Record Badges */}
      <div className="mx-4 space-y-3">
        <div className="card-dark border border-gold/40 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(245,183,0,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
          <div className="bg-gold/10 p-2.5 rounded-lg border border-gold/20">
            <Crown className="text-gold" size={24} />
          </div>
          <div>
            <p className="text-gold font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">Campeão e Recordista</p>
            <p className="text-white font-black text-lg leading-tight uppercase">Arnold Classic Brasil 2025</p>
          </div>
          <Flame className="text-gold/50 group-hover:text-orange-500 transition-colors ml-auto" size={22} />
        </div>

        <div className="card-dark border border-gold/20 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gold/50" />
          <div className="bg-gold/5 p-2.5 rounded-lg border border-gold/10">
            <Crown className="text-gold/70" size={24} />
          </div>
          <div>
            <p className="text-gold/70 font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">Campeão e Recordista Mundial</p>
            <p className="text-white font-black text-lg leading-tight uppercase">Camboriú — GPC Brasil</p>
          </div>
          <Flame className="text-gold/30 group-hover:text-orange-500 transition-colors ml-auto" size={22} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="card-dark p-3 text-center border border-[#2A2A2A]" data-testid="stat-raw">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Supino RAW</p>
          <p className="text-3xl font-black text-white">{profile?.raw_max_bench || 0}<span className="text-lg text-[#F5B700]">kg</span></p>
          <p className="text-gray-500 text-xs">Meta: {profile?.raw_goal_bench || 0}kg</p>
        </div>
        <div className="card-dark p-3 text-center border border-[#2A2A2A]" data-testid="stat-equipped">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Supino F8</p>
          <p className="text-3xl font-black text-white">{profile?.equipped_max_bench || 0}<span className="text-lg text-[#FF8C00]">kg</span></p>
          <p className="text-gray-500 text-xs">Meta: {profile?.equipped_goal_bench || 0}kg</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="mx-4">
        <CountdownCard comp={nextComp} />
      </div>

      {/* Today's Training */}
      <div className="mx-4">
        <TodayTrainingCard />
      </div>

      {/* Evolution Chart */}
      <div className="mx-4">
        {mounted && <EvolutionChart data={evolution} />}
      </div>

      {/* Upload Video */}
      <div className="mx-4">
        <button
          className="btn-gold-outline w-full py-3 flex items-center justify-center gap-2 font-semibold"
          data-testid="button-upload-video"
          onClick={() => setLocation("/videos")}
        >
          <Camera size={18} className="text-[#F5B700]" />
          <span>Upload de Vídeo</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Achievements Section */}
      <div className="mx-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider">Minha História</h3>
          <button 
            className="flex items-center gap-1 text-[10px] bg-gold/10 text-gold border border-gold/30 px-2 py-1 rounded-full uppercase font-bold"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={10} /> Adicionar
          </button>
        </div>
        
        {(profile?.achievements || []).map((ach: any, i: number) => (
          <div 
            key={i} 
            className="card-dark p-3 border border-[#2A2A2A] flex items-center justify-between group cursor-pointer hover:border-gold/50 transition-all" 
            data-testid={`achievement-${i}`}
          >
            <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedAch(ach)}>
              <Trophy className="text-[#F5B700]" size={18} />
              <div className="flex flex-col">
                <span className="text-gray-200 text-sm font-bold">{ach.label}</span>
                <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{ach.date}</span>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingAch({ ...ach, index: i }); }}
                className="p-1.5 rounded bg-black/40 hover:text-gold"
              >
                <Edit2 size={13} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteAch(i); }}
                className="p-1.5 rounded bg-black/40 hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
              <ChevronRight className="text-gray-600 mt-1" size={16} />
            </div>
          </div>
        ))}

        {(!profile?.achievements || profile.achievements.length === 0) && (
          <p className="text-gray-600 text-xs py-4 text-center border border-dashed border-[#2A2A2A] rounded-xl">
             Você ainda não contou sua história. Comece agora!
          </p>
        )}
      </div>

      {/* Edit/Add Modal */}
      {(isAdding || editingAch) && (
        <AchievementFormModal 
          initial={editingAch} 
          onSave={handleEditOrAdd} 
          onClose={() => { setIsAdding(false); setEditingAch(null); }} 
        />
      )}

      {/* Achievement Detail Modal */}
      {selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-gold w-full max-w-sm rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedAch(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="flex justify-center mb-4">
              <div className="bg-gold/10 p-4 rounded-full border border-gold/30">
                <Trophy className="text-gold" size={32} />
              </div>
            </div>
            <h4 className="text-xl font-bold text-white text-center mb-1">{selectedAch.label}</h4>
            <p className="text-gold text-center text-xs font-black uppercase tracking-widest mb-4">{selectedAch.date}</p>
            <div className="bg-black/40 rounded-xl p-4 border border-[#2A2A2A]">
              <p className="text-gray-300 text-sm leading-relaxed text-center">
                {selectedAch.details}
              </p>
            </div>
            <button 
              className="btn-gold w-full mt-6 py-3 font-bold"
              onClick={() => setSelectedAch(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
