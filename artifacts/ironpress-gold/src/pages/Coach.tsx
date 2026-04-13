import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { persistence, IronsideProfile } from "../lib/persistence";
import { useState, useEffect } from "react";
import { Users, Key, MonitorSmartphone, ShieldBan, PlusCircle, CheckCircle2, TrendingUp, Trophy, X, GraduationCap } from "lucide-react";
import { DeveloperBio } from "../components/DeveloperBio";

const AVAILABLE_PERMISSIONS = [
  { id: "/", label: "Dashboard Inicial", mandatory: true },
  { id: "/treinos", label: "Treinos", mandatory: false },
  { id: "/videos", label: "Laboratório de Vídeos", mandatory: false },
  { id: "/campeonatos", label: "Simulador de Campeonatos", mandatory: false },
  { id: "/saude", label: "Módulo de Saúde e Hormônios", mandatory: false },
];

export default function Coach() {
  const [selectedPerms, setSelectedPerms] = useState<string[]>(["/", "/videos"]);
  const [duration, setDuration] = useState<number>(24);
  const [lastGenerated, setLastGenerated] = useState<{code: string, pass: string} | null>(null);
  const [view, setView] = useState<'tokens' | 'settings'>('tokens');

  // Settings State
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingAch, setEditingAch] = useState<any>(null);
  const [isAddingAch, setIsAddingAch] = useState(false);
  const [athleteUser, setAthleteUser] = useState(localStorage.getItem('ironside_athlete_user') || 'DECA');
  const [athletePass, setAthletePass] = useState(localStorage.getItem('ironside_athlete_pass') || 'DURA');

  // Achievement Modal (Controlled Forms)
  const [achForm, setAchForm] = useState({ label: '', date: '', details: '' });
  const [highlightForm, setHighlightForm] = useState({ title: '', subtitle: '' });
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [showBio, setShowBio] = useState(false);

  const { generateCoachToken, getCoachTokens, revokeToken, role, updateAthleteCredentials } = useAuth();

  useEffect(() => {
    if (view === 'settings') fetchProfile();
  }, [view]);

  async function fetchProfile() {
    setLoadingProfile(true);
    try {
      const pData = await persistence.loadProfile();
      if (pData) setProfile(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function saveProfile() {
    setSavingSettings(true);
    try {
      const { success, error } = await persistence.saveProfile(profile);
      
      if (!success) {
        console.warn("DB Sync Error:", error);
        alert("Configurações salvas LOCALMENTE. (Banco de dados incompleto)");
      } else {
        alert("Configurações Ironside sincronizadas com sucesso.");
      }
      
      // Update Security too
      updateAthleteCredentials(athleteUser, athletePass);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveHighlights() {
    if (!profile) return;
    setSavingSettings(true);
    try {
      const { success, error } = await persistence.saveProfile(profile);
      if (!success) {
        console.warn("Highlights DB Error:", error);
        alert("Sala de Troféus salva LOCALMENTE com sucesso!");
      } else {
        alert("Sala de Troféus sincronizada na nuvem!");
      }
    } catch (err: any) {
      alert("Erro ao salvar destaques: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateAchievements(newList: any[]) {
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('profiles').update({ achievements: newList }).eq('id', profile.id);
      if (error) throw error;
      setProfile({...profile, achievements: newList});
      setIsAddingAch(false);
      setEditingAch(null);
    } catch (e: any) {
      alert("Erro ao salvar história: " + e.message);
    } finally {
      setSavingSettings(false);
    }
  }

  const handleEditOrAddAch = () => {
    const list = [...(profile?.achievements || [])];
    if (editingAch !== null) {
      list[editingAch.index] = { ...achForm };
    } else {
      list.push({ ...achForm });
    }
    updateAchievements(list);
  };

  const deleteAch = (index: number) => {
    if (!confirm("Excluir essa conquista?")) return;
    const list = profile.achievements.filter((_: any, i: number) => i !== index);
    updateAchievements(list);
  };

  if (role !== 'athlete') {
    return (
      <div className="p-4 text-center mt-20">
        <MonitorSmartphone className="text-gray-500 mx-auto mb-4" size={48} />
        <h2 className="text-white font-bold text-xl mb-2">Painel de Acessos</h2>
        <p className="text-gray-400 text-sm">Este painel é exclusivo para o atleta principal gerenciar e gerar links para treinadores convidados.</p>
      </div>
    );
  }

  const handleTogglePerm = (id: string) => {
    if (id === "/") return; // Mandatory
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    const token = generateCoachToken(selectedPerms, duration);
    setLastGenerated({ code: token.code, pass: token.password || "N/A" });
  };

  const activeTokens = getCoachTokens();

  return (
    <div className="pb-6 space-y-4 font-sans">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Users className={`transition-colors ${view === 'tokens' ? 'text-[#F5B700]' : 'text-gray-500'}`} size={22} />
          <h1 className="text-2xl font-black text-white uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
            CONTROLE DO HUB
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Gerenciamento dinâmico e configurações do atleta</p>
      </div>

      {/* View Switcher */}
      <div className="mx-4 flex bg-[#0A0A0A] rounded-xl p-1 border border-[#2A2A2A] mb-4">
        <button 
          onClick={() => setView('tokens')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'tokens' ? 'bg-[#F5B700] text-black shadow-lg shadow-[#F5B700]/10' : 'text-gray-500 hover:text-white'}`}
        >
          Acessos Externos
        </button>
        <button 
          onClick={() => setView('settings')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-[#F5B700] text-black shadow-lg shadow-[#F5B700]/10' : 'text-gray-500 hover:text-white'}`}
        >
          Configurações
        </button>
      </div>

      {view === 'tokens' ? (
        <>
          <div className="mx-4 card-dark border border-[#2A2A2A] p-4">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
              <PlusCircle size={16} /> Novo Convite
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-white text-xs font-semibold mb-2">Abas Permitidas</p>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className={`flex items-center gap-3 p-2 rounded-lg border ${selectedPerms.includes(perm.id) ? 'border-[#F5B700]/40 bg-[#F5B700]/5' : 'border-[#2A2A2A] bg-transparent cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        className="accent-[#F5B700]"
                        checked={selectedPerms.includes(perm.id)}
                        onChange={() => handleTogglePerm(perm.id)}
                        disabled={perm.mandatory}
                      />
                      <span className={`text-sm ${selectedPerms.includes(perm.id) ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {perm.label} {perm.mandatory && "(Obrigatório)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white text-xs font-semibold mb-2">Validade do Acesso</p>
                <select 
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={1}>1 Hora</option>
                  <option value={12}>12 Horas</option>
                  <option value={24}>24 Horas</option>
                  <option value={168}>7 Dias</option>
                </select>
              </div>

              <button 
                className="w-full btn-gold py-3 font-bold text-sm"
                onClick={handleGenerate}
              >
                Emitir Credenciais de Acesso
              </button>

              <button 
                className="w-full bg-white/5 border border-white/10 text-gray-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-all"
                onClick={() => setShowBio(true)}
              >
                <GraduationCap size={14} /> Conhecer o Desenvolvedor (Científico)
              </button>
            </div>

            {lastGenerated && (
              <div className="mt-4 p-4 border border-green-500/30 bg-green-500/5 rounded-xl text-center fade-in">
                <CheckCircle2 className="text-green-400 mx-auto mb-2" size={24} />
                <p className="text-green-400 font-bold text-sm mb-3">Acesso gerado com sucesso!</p>
                
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A] flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs">CÓDIGO:</span>
                  <span className="text-white font-black tracking-widest text-lg">{lastGenerated.code}</span>
                </div>
                <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-gray-400 text-xs">SENHA:</span>
                  <span className="text-[#F5B700] font-black tracking-widest text-lg">{lastGenerated.pass}</span>
                </div>
                <p className="text-gray-500 text-[10px] mt-3">Copie e envie ao seu treinador.</p>
              </div>
            )}
          </div>

          <div className="mx-4 mt-6">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
              <Key size={14} /> Credenciais Ativas ({activeTokens.length})
            </h3>
            {activeTokens.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-4 bg-[#111] rounded-lg">Nenhuma credencial circulando.</p>
            ) : (
              <div className="space-y-2">
                {activeTokens.map(token => (
                  <div key={token.code} className="bg-[#111] border border-[#2A2A2A] p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-white font-black tracking-wider text-sm">{token.code}</p>
                      <p className="text-gray-500 text-[10px]">Expira em: {new Date(token.expiresAt).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => revokeToken(token.code)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ShieldBan size={12} /> Revogar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mx-4 space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingProfile ? (
            <div className="text-center py-20 text-gold animate-pulse font-black uppercase text-[10px] tracking-widest">Sincronizando Perfil...</div>
          ) : profile && (
            <>
              {/* Highlights (Dashboard Badges) */}
              <div className="card-dark border border-[#2A2A2A] p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[#F5B700] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                      <Trophy size={16} /> Sala de Troféus
                    </h3>
                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Destaques automáticos no seu Dashboard</p>
                  </div>
                    <button 
                      onClick={() => setIsAddingHighlight(true)} 
                      className="text-[9px] bg-[#F5B700]/10 text-[#F5B700] border border-[#F5B700]/30 px-3 py-1.5 rounded-full uppercase font-black hover:bg-[#F5B700] hover:text-black transition-all"
                    >
                      Adicionar
                    </button>
                    <button 
                      onClick={saveHighlights}
                      className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-3 py-1.5 rounded-full uppercase font-black hover:bg-green-500 hover:text-white transition-all ml-2"
                    >
                      Salvar Sala
                    </button>
                  </div>
                <div className="space-y-3">
                  {(profile.highlights || []).map((h: any, i: number) => (
                    <div key={i} className="bg-[#050505] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-[#F5B700]/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center">
                          <Trophy size={14} className="text-[#F5B700]" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-black uppercase tracking-wide">{h.title}</p>
                          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{h.subtitle}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newList = profile.highlights.filter((_: any, idx: number) => idx !== i);
                          setProfile({...profile, highlights: newList});
                        }} 
                        className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <ShieldBan size={14} />
                      </button>
                    </div>
                  ))}
                  {(profile.highlights || []).length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl">
                      <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">Sua sala está vazia.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Basics */}
              <div className="card-dark border border-[#2A2A2A] p-4">
                <h3 className="text-[#F5B700] font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <MonitorSmartphone size={14} /> Perfil do Atleta
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Mensagem de Boas-Vindas</label>
                    <input 
                      className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" 
                      placeholder="Ex: Bem-vindo de volta, Campeão!"
                      value={profile.welcome_message || ""} 
                      onChange={e => setProfile({...profile, welcome_message: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Nome de Guerra</label>
                    <input className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Peso Atual</label>
                      <input className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Categoria</label>
                      <input className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Goals */}
              <div className="card-dark border border-[#2A2A2A] p-4">
                <h3 className="text-[#F5B700] font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Metas Biomecânicas
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Max RAW (kg)</label>
                      <input type="number" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.raw_max_bench} onChange={e => setProfile({...profile, raw_max_bench: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Alvo RAW (kg)</label>
                      <input type="number" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.raw_goal_bench} onChange={e => setProfile({...profile, raw_goal_bench: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Max F8 (kg)</label>
                      <input type="number" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.equipped_max_bench} onChange={e => setProfile({...profile, equipped_max_bench: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Alvo F8 (kg)</label>
                      <input type="number" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-gold outline-none" value={profile.equipped_goal_bench} onChange={e => setProfile({...profile, equipped_goal_bench: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Management */}
              <div className="card-dark border border-[#2A2A2A] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#F5B700] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Trophy size={14} /> Minha História
                  </h3>
                  <button onClick={() => {
                    setAchForm({ label: '', date: '', details: '' });
                    setEditingAch(null); // Clear editing state
                    setIsAddingAch(true);
                  }} className="text-[9px] bg-gold/10 text-gold border border-gold/30 px-2 py-1 rounded-full uppercase font-black">
                    Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {(profile.achievements || []).map((ach: any, i: number) => (
                    <div key={i} className="bg-[#050505] p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold uppercase">{ach.label}</p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">{ach.date}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => {
                           setEditingAch({...ach, index: i});
                           setAchForm({ label: ach.label, date: ach.date, details: ach.details || "" });
                         }} className="p-1 px-2 bg-white/5 text-gray-500 hover:text-gold rounded text-[10px] font-bold">EDITAR</button>
                         <button onClick={() => deleteAch(i)} className="p-1 px-2 bg-white/5 text-gray-500 hover:text-red-400 rounded text-[10px] font-bold">REMOVER</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="card-dark border border-red-500/20 p-4 bg-red-500/[0.02]">
                <h3 className="text-red-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShieldBan size={14} /> Chaves de Acesso Biométrico
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Usuário Mestre</label>
                    <input className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50 outline-none" value={athleteUser} onChange={e => setAthleteUser(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Senha Master (Ex "DURA")</label>
                    <input type="password" placeholder="••••••" className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50 outline-none font-mono" value={athletePass} onChange={e => setAthletePass(e.target.value)} />
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase text-center italic">Cuidado: Mudar esses campos exigirá novo login.</p>
                </div>
              </div>

              <button 
                onClick={saveProfile}
                disabled={savingSettings}
                className="w-full btn-gold py-4 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-gold/10 flex items-center justify-center gap-2"
              >
                {savingSettings ? "Sincronizando..." : "Salvar Configurações de Elite"}
              </button>

              {/* Modal Destaques */}
              {isAddingHighlight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="bg-[#111] border border-gold/40 w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl">
                    <button onClick={() => setIsAddingHighlight(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
                    <h4 className="text-gold font-black text-xs mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Trophy size={16} /> Novo Destaque do Dashboard
                    </h4>
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2 block">Título Principal (Máx 25 chars)</label>
                        <input 
                          className="w-full bg-[#050505] border border-gold/20 rounded-2xl px-5 py-4 text-white text-sm focus:border-gold outline-none" 
                          placeholder="Ex: Campeão Mundial"
                          value={highlightForm.title}
                          onChange={e => setHighlightForm({...highlightForm, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2 block">Subtítulo/Local</label>
                        <input 
                          className="w-full bg-[#050505] border border-gold/20 rounded-2xl px-5 py-4 text-white text-sm focus:border-gold outline-none" 
                          placeholder="Ex: Camboriú - GPC Brasil"
                          value={highlightForm.subtitle}
                          onChange={e => setHighlightForm({...highlightForm, subtitle: e.target.value})}
                        />
                      </div>
                      <button 
                        className="w-full btn-gold py-4 font-black uppercase text-xs tracking-widest rounded-2xl mt-2" 
                        onClick={() => {
                          const newList = [...(profile.highlights || []), { ...highlightForm }];
                          setProfile({...profile, highlights: newList});
                          setIsAddingHighlight(false);
                          setHighlightForm({ title: '', subtitle: '' });
                        }}
                      >
                        Salvar Destaque
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Minha História (Conquistas) */}
              {(isAddingAch || editingAch) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="bg-[#111] border border-gold/40 w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl">
                    <button 
                      onClick={() => {
                        setIsAddingAch(false);
                        setEditingAch(null);
                      }} 
                      className="absolute top-6 right-6 text-gray-500 hover:text-white"
                    >
                      <X size={20}/>
                    </button>
                    <h4 className="text-gold font-black text-xs mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Trophy size={16} /> {editingAch ? 'Editar História' : 'Nova Conquista'}
                    </h4>
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2 block">Título da Conquista</label>
                        <input 
                          className="w-full bg-[#050505] border border-gold/20 rounded-2xl px-5 py-4 text-white text-sm focus:border-gold outline-none" 
                          placeholder="Ex: Campeão Mundial GPC"
                          value={achForm.label}
                          onChange={e => setAchForm({...achForm, label: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2 block">Data/Ano</label>
                        <input 
                          className="w-full bg-[#050505] border border-gold/20 rounded-2xl px-5 py-4 text-white text-sm focus:border-gold outline-none" 
                          placeholder="Ex: 2024 ou Setembro/2025"
                          value={achForm.date}
                          onChange={e => setAchForm({...achForm, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2 block">Detalhes da Biografia</label>
                        <textarea 
                          className="w-full bg-[#050505] border border-gold/20 rounded-2xl px-5 py-4 text-white text-sm focus:border-gold outline-none h-24 resize-none" 
                          placeholder="Conte um pouco sobre essa conquista..."
                          value={achForm.details}
                          onChange={e => setAchForm({...achForm, details: e.target.value})}
                        />
                      </div>
                      <button 
                        className="w-full btn-gold py-4 font-black uppercase text-xs tracking-widest rounded-2xl mt-2" 
                        onClick={handleEditOrAddAch}
                      >
                        {editingAch ? 'Salvar Edição' : 'Registrar na História'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Developer Bio Modal */}
      {showBio && <DeveloperBio onClose={() => setShowBio(false)} />}
    </div>
  );
}
