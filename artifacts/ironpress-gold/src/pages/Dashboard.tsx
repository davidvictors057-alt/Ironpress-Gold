import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trophy, Crown, Flame, Camera, ChevronRight, Dumbbell, Target, X, Info, Star, Edit2, Trash2, Plus, LogOut } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { persistence, IronsideProfile } from "../lib/persistence";

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
        <span className="text-xs text-gray-400 border border-[#F5B700]/30 px-2 py-0.5 rounded-full uppercase">
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

function TodayTrainingCard({ workout }: { workout: any }) {
  const [, setLocation] = useLocation();

  if (!workout) {
    return (
      <div className="card-dark p-4 border border-[#2A2A2A] opacity-60" data-testid="card-today-training">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="text-[#F5B700]" size={20} />
          <span className="text-sm font-semibold text-[#F5B700] uppercase tracking-wider">
            Treino de Hoje
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 italic text-center py-4">
          Nenhum treino registrado recentemente.
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

  const modalityLabel = workout.modality === 'F8' ? 'EQUIPADO F8' : 'RAW';

  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="card-today-training">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="text-[#F5B700]" size={20} />
        <span className="text-sm font-semibold text-[#F5B700] uppercase tracking-wider">
          Treino de Hoje
        </span>
      </div>
      <p className="text-white font-semibold mb-1">Supino Reto {modalityLabel}</p>
      <p className="text-gray-300 text-sm mb-1">
        Meta: {workout.target_weight}kg — RPE {workout.rpe}
      </p>
      <p className="text-gray-400 text-xs mb-4">
        <Target size={12} className="inline mr-1 text-[#F5B700]" />
        Realizado: <span className="text-white font-bold">{workout.actual_weight}kg</span>
      </p>
      <button
        className="btn-gold w-full py-2 text-sm font-bold uppercase tracking-widest"
        data-testid="button-register-training"
        onClick={() => setLocation("/treinos")}
      >
        Novo Treino
      </button>
    </div>
  );
}

// AchievementFormModal removed, shifted to Coach Settings.

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
          <YAxis tick={{ fill: "#B0B0B0", fontSize: 11 }} domain={[(dataMin: number) => Math.floor(dataMin * 0.9), "auto"]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
            labelStyle={{ color: "#F5B700" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#B0B0B0", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
                {value === "RAW" ? "RAW" : "EQUIPADO F8"}
              </span>
            )}
          />
          <Line type="monotone" dataKey="RAW" stroke="#F5B700" strokeWidth={2.5} dot={{ fill: "#F5B700", r: 4 }} name="RAW" connectNulls={true} />
          <Line type="monotone" dataKey="EQUIPADO_F8" stroke="#FF8C00" strokeWidth={2.5} dot={{ fill: "#FF8C00", r: 4 }} name="EQUIPADO_F8" connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [nextComp, setNextComp] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [selectedAch, setSelectedAch] = useState<any>(null);
  const [editingAch, setEditingAch] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { 
    setMounted(true);
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch Profile via Persistence Engine (Resiliente: Cloud + Local Fallback)
      const pData = await persistence.loadProfile();
      if (pData) setProfile(pData);

      // Fetch Next Comp
      const { data: cData } = await supabase.from('competitions').select('*').order('date', { ascending: true }).limit(1).single();
      if (cData) setNextComp(cData);

      // Fetch Evolution and Latest Workout (Real Data from Workouts)
      const { data: wData } = await supabase
        .from('workouts')
        .select('*')
        .order('workout_date', { ascending: true });

      if (wData && wData.length > 0) {
        // Set latest workout for the Today's Training card
        setLatestWorkout(wData[wData.length - 1]);

        // Group by date and modality to show last 8 data points
        const allDates = [...new Set(wData.map(d => d.workout_date))].sort().slice(-8);
        const mapped = allDates.map((date, i) => {
          const raw = wData.find(d => d.workout_date === date && d.modality === 'RAW')?.actual_weight;
          const eq = wData.find(d => d.workout_date === date && d.modality === 'F8')?.actual_weight;
          return {
            week: `S${i+1}`,
            date: new Date(date).toLocaleDateString("pt-BR").slice(0, 5),
            RAW: raw || null,
            EQUIPADO_F8: eq || null
          };
        });
        setEvolution(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview Immediate (Cultura Ironside: Velocidade)
    const previewUrl = URL.createObjectURL(file);
    const updatedProfile = { ...profile, avatar_url: previewUrl };
    setProfile(updatedProfile);
    persistence.saveProfile(updatedProfile); // Salva localmente imediatamente

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'avatars' bucket
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) {
        console.warn("Storage fallida, mantendo local:", error.message);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Sync via Persistence Engine
      // Ironside Sync: Garantir que o ID do perfil seja preservado ou buscado da auth
      const { data: { user } } = await supabase.auth.getUser();
      const finalProfile = { 
        ...profile, 
        id: profile?.id || user?.id,
        avatar_url: publicUrl 
      };
      
      console.log("[DB ESPECIALISTA.agente] Sincronizando avatar no DB:", finalProfile.id);
      const { success, error: dbError } = await persistence.saveProfile(finalProfile);
      
      if (success) {
        setProfile(finalProfile);
        alert("Avatar sincronizado na nuvem com sucesso!");
      } else {
        console.error("[DB ESPECIALISTA.agente] Erro de sincronia DB:", dbError);
        alert("Salvo localmente. O DB ainda não reconhece o campo avatar_url. Tente renovar a sessão.");
      }
    } catch (err: any) {
      console.error("[SISTEMA] Erro crítico no upload de mídia:", err);
      
      let guidance = "Aviso: Foto salva apenas localmente.";
      if (err.message?.includes("Bucket not found") || err.status === 404) {
        guidance = "⚠️ ERRO DE INFRAESTRUTURA: O bucket 'avatars' não foi encontrado no seu Supabase. \n\nInstrução: Vá ao painel do Supabase > Storage > New Bucket > Nomeie como 'avatars' e marque como PUBLIC.";
      } else {
        guidance = `Aviso: Sincronização falhou (${err.message}). Foto salva apenas neste dispositivo.`;
      }
      
      alert(guidance);
    } finally {
      setUploading(false);
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
      {/* Top Header with Logout */}
      <div className="flex justify-end px-4 pt-6 -mb-4">
        <button 
          onClick={() => logout()}
          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 px-3 py-1"
        >
          <LogOut size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="text-center py-6 px-4">
        <input 
          id="avatar-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleAvatarUpload} 
        />
        <div 
          onClick={() => document.getElementById('avatar-upload')?.click()}
          className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-gold flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden relative cursor-pointer group hover:border-[#F5B700] transition-all"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-gold font-black text-3xl" style={{ fontFamily: "Montserrat, sans-serif" }}>IR</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-black text-[#F5B700] tracking-tighter" style={{ fontFamily: "Montserrat, sans-serif" }}>
          IRONSIDE
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          {profile?.name || "Leonardo Rodrigues"}
        </p>
        <div className="h-px w-12 bg-gold/30 mx-auto mb-3" />
        <p className="text-gray-300 text-sm">
          {profile?.weight ? `${profile.weight}kg` : "95kg"} | {profile?.category ? `Categoria ${profile.category}` : "Categoria 100kg"}
        </p>
      </div>

      {/* Welcome Banner */}
      <div 
        onClick={() => setLocation("/coach")}
        className="mx-4 card-dark border border-[#F5B700]/30 p-4 cursor-pointer hover:bg-gold/5 transition-colors" 
        data-testid="card-welcome"
      >
        <div className="flex items-center gap-2">
          <Flame className="text-[#F5B700] group-hover:text-red-500 transition-colors drop-shadow-[0_0_8px_transparent] group-hover:drop-shadow-[0_0_12px_#ef4444]" size={22} />
          <div>
            <p className="text-white font-bold">{profile?.welcome_message || "Bem-vindo de volta, Campeão Mundial!"}</p>
            <p className="text-gray-400 text-xs">Hoje é dia de superação, Ironside.</p>
          </div>
        </div>
      </div>

      {/* Performance Badges (Sala de Troféus) */}
      <div className="px-4 space-y-3">
        {profile?.highlights && profile.highlights.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {profile.highlights.map((h: any, index: number) => (
              <div 
                key={index} 
                className="card-dark border border-[#F5B700]/20 p-4 flex items-center justify-between group hover:border-[#F5B700]/50 transition-all relative overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5B700]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#F5B700]/10 transition-colors" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5B700]/20 to-black border border-[#F5B700]/30 flex items-center justify-center shadow-lg group-hover:bg-[#F5B700]/30 transition-all">
                    <Trophy size={20} className="text-[#F5B700]" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-wider leading-tight">{h.title}</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] leading-tight mt-0.5">{h.subtitle || "Campeão e Recordista"}</p>
                  </div>
                </div>
                <Flame size={16} className="text-gray-800 group-hover:text-red-500/80 transition-all transform group-hover:rotate-12 group-hover:scale-125 drop-shadow-[0_0_0px_transparent] group-hover:drop-shadow-[0_0_10px_#ef4444]" />
              </div>
            ))}
          </div>
        ) : (
          /* Fallback se não houver destaques */
          <div 
             onClick={() => setLocation("/coach")}
             className="card-dark border border-white/5 p-10 flex flex-col items-center justify-center gap-4 cursor-pointer opacity-60 hover:opacity-100 transition-all group hover:border-[#F5B700]/30"
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center group-hover:border-[#F5B700]/50 transition-colors">
              <Trophy size={32} className="text-gray-800 group-hover:text-[#F5B700]/30 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed mb-1">Sala de Troféus Vazia</p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Toque para configurar seus recordes de elite.</p>
            </div>
          </div>
        )}
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
        <TodayTrainingCard workout={latestWorkout} />
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
                <span className="text-gray-200 text-sm font-bold uppercase">{ach.label}</span>
                <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{ach.date}</span>
              </div>
            </div>
            <div className="flex gap-2">
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

      {/* Achievement Edit Modals removed (moved to Coach Settings) */}

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
