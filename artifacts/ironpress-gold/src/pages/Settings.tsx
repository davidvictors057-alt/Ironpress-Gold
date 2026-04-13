import { useState } from "react";
import { Cpu, Terminal, ShieldAlert, Zap, CheckCircle2, Lock, Activity, AlertCircle, LogOut } from "lucide-react";
import { testAIConnection } from "../services/coachAI/aiCoachService";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('gemini_model_id') || "gemini-2.0-flash");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [testStatus, setTestStatus] = useState<{ loading: boolean, result: string | null, success: boolean, gemini: boolean, claude: boolean, lastSync: string | null }>({
    loading: false,
    result: null,
    success: false,
    gemini: false,
    claude: false,
    lastSync: null
  });

  const models = [
    { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview (Soberania de Velocidade v5.9)" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview (Arquiteto de Elite v5.8.1.2)" },
    { value: "claude-3-opus-latest", label: "Claude 3 Opus (Arquiteto Estratégico)" },
    { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (Custo-Benefício)" },
  ];

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "david172030") {
      setIsUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Credenciais biométricas inválidas.");
    }
  };

  const handleSave = () => {
    localStorage.setItem('gemini_model_id', selectedModel);
    setSavedMsg("Motor neural atualizado com sucesso.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const runTest = async () => {
    setTestStatus({ loading: true, result: "Validando Sincronia A2A...", success: false, gemini: false, claude: false, lastSync: null });
    try {
      const res = await testAIConnection();
      setTestStatus({ 
        loading: false, 
        result: res.message, 
        success: res.success, 
        gemini: res.gemini, 
        claude: res.claude,
        lastSync: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      setTestStatus({ loading: false, result: err.message, success: false, gemini: false, claude: false, lastSync: null });
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-24 h-24 bg-red-900/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(255,0,0,0.05)]">
          <ShieldAlert className="text-red-500" size={40} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-white font-black text-2xl uppercase tracking-widest">Acesso Restrito</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Insira o protocolo de segurança</p>
        </div>
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="password" 
              className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-center tracking-[0.5em] focus:outline-none focus:border-red-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMsg && <p className="text-red-500 text-[10px] uppercase font-black text-center tracking-widest">{errorMsg}</p>}
          <button type="submit" className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all">
            Desbloquear Painel A2A
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-6 pt-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#F5B700]/10 rounded-2xl border border-[#F5B700]/20 shadow-[0_0_20px_rgba(245,183,0,0.05)]">
            <Cpu className="text-[#F5B700]" size={28} />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl uppercase tracking-widest leading-none mb-2">A2A Hub Central</h1>
            <p className="text-[#F5B700] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={12} /> Sistemas Autônomos Ativos
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-xl mx-auto space-y-8">
        <div className="space-y-4">
          <label className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
            <Terminal size={14} /> Seleção de Arquitetura de IA
          </label>
          <div className="grid grid-cols-1 gap-2">
            {models.map(m => (
              <label 
                key={m.value}
                onClick={() => setSelectedModel(m.value)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedModel === m.value ? 'bg-[#F5B700]/5 border-[#F5B700]/50' : 'bg-black border-white/5 hover:border-white/20'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedModel === m.value ? 'border-[#F5B700]' : 'border-gray-700'}`}>
                  {selectedModel === m.value && <div className="w-2.5 h-2.5 bg-[#F5B700] rounded-full" />}
                </div>
                <span className={`text-sm font-bold tracking-wide ${selectedModel === m.value ? 'text-[#F5B700]' : 'text-gray-400'}`}>
                  {m.label}
                </span>
                <input 
                  type="radio" 
                  name="ai_model" 
                  value={m.value} 
                  checked={selectedModel === m.value} 
                  onChange={() => {}} 
                  className="hidden" 
                />
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
          <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed text-center">
            As chaves de API são buscadas diretamente do seu servidor (.env). Clique abaixo para validar o canal de comunicação agora.
          </p>
          
          <div className="flex gap-2">
            <div className={`flex-1 p-3 rounded-xl border text-center space-y-1 transition-all ${testStatus.result ? (testStatus.gemini ? 'bg-green-500/10 border-green-500/40 glow-green' : 'bg-red-500/10 border-red-500/40') : 'bg-black/20 border-white/5'}`}>
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">Claude 3.5 Sonnet</p>
              <div className={`mx-auto h-1.5 w-1.5 rounded-full ${testStatus.result ? (testStatus.claude ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]') : 'bg-gray-700'}`}></div>
              {testStatus.claude && <p className="text-[6px] text-green-500 font-bold">READY</p>}
            </div>
            <div className={`flex-1 p-3 rounded-xl border text-center space-y-1 transition-all ${testStatus.result ? (testStatus.gemini ? 'bg-green-500/10 border-green-500/40 glow-green' : 'bg-red-500/10 border-red-500/40') : 'bg-black/20 border-white/5'}`}>
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">Gemini 3.1 Series</p>
              <div className={`mx-auto h-1.5 w-1.5 rounded-full ${testStatus.result ? (testStatus.gemini ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]') : 'bg-gray-700'}`}></div>
              {testStatus.gemini && <p className="text-[6px] text-green-500 font-bold">READY</p>}
            </div>
          </div>
          
          {testStatus.lastSync && (
            <p className="text-[8px] text-gray-500 text-center font-bold uppercase tracking-widest">
              Sincronia biomecânica verificada às {testStatus.lastSync}
            </p>
          )}
          
          <button 
            onClick={runTest}
            disabled={testStatus.loading}
            className={`w-full py-4 rounded-xl border font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${testStatus.loading ? 'opacity-50' : 'hover:bg-white/5 bg-black/40'}`}
            style={{ 
              borderColor: testStatus.result ? (testStatus.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.05)',
              color: testStatus.result ? (testStatus.success ? '#22c55e' : '#ef4444') : '#555'
            }}
          >
            {testStatus.loading ? <Activity className="animate-spin" size={14} /> : (testStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />)}
            {testStatus.loading ? "Sincronizando..." : (testStatus.result || "Validar Sincronia Especialista")}
          </button>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="w-full bg-[#F5B700] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Sincronizar Protocolo AI
          </button>
          
          {savedMsg && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest animate-pulse">
              <CheckCircle2 size={16} /> {savedMsg}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-8">
            <button
              onClick={() => logout()}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Encerrar Sessão do Atleta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
