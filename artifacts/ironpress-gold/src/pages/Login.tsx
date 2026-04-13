import { useState } from "react";
import { Dumbbell, UserCog } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { loginAsAthlete, loginAsCoach } = useAuth();
  
  const [mode, setMode] = useState<"athlete" | "coach">("athlete");
  
  // Athlete state
  const [athleteUser, setAthleteUser] = useState("");
  const [athletePass, setAthletePass] = useState("");
  const [athleteError, setAthleteError] = useState(false);
  
  // Coach state
  const [coachCode, setCoachCode] = useState("");
  const [coachPass, setCoachPass] = useState("");
  const [coachError, setCoachError] = useState(false);

  const handleAthleteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAsAthlete(athleteUser, athletePass);
    if (!ok) setAthleteError(true);
  };

  const handleCoachLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAsCoach(coachCode.trim().toUpperCase(), coachPass.trim());
    if (!ok) setCoachError(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 font-sans relative">
      {/* Imagem de Fundo (Opcional, com opacidade) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      </div>

      <div className="w-full max-w-sm bg-[#131313] p-8 rounded-2xl border border-white/5 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          {mode === 'athlete' ? (
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center border border-[#F5B700]/30 shadow-lg shadow-[#F5B700]/10 mb-4">
              <Dumbbell className="text-[#F5B700]" size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center border border-gray-400/30 shadow-lg shadow-white/5 mb-4">
              <UserCog className="text-gray-300" size={32} />
            </div>
          )}

          <h1 className="text-2xl font-black text-white uppercase tracking-widest text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
            IRONPRESS
            <br />
            <span className={mode === 'athlete' ? "text-[#F5B700]" : "text-gray-400"}>
              {mode === 'athlete' ? "GOLD" : "COACH"}
            </span>
          </h1>
          <p className="text-gray-500 text-xs mt-2 uppercase tracking-wide">
            Acesso do {mode === 'athlete' ? "Atleta" : "Treinador"}
          </p>
        </div>

        {mode === 'athlete' ? (
          <form onSubmit={handleAthleteLogin} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1 block">Usuário Ironside</label>
              <input
                type="text"
                placeholder="IRONSIDE2026"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5B700] transition-colors"
                value={athleteUser}
                onChange={e => {setAthleteUser(e.target.value); setAthleteError(false)}}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1 block">Senha Master</label>
              <input
                type="password"
                placeholder="BIOMECHANICS STUDY"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5B700] transition-colors tracking-widest"
                value={athletePass}
                onChange={e => {setAthletePass(e.target.value); setAthleteError(false)}}
              />
              {athleteError && <p className="text-red-400 text-xs mt-1">Nível de permissão negado.</p>}
            </div>
            <button type="submit" className="w-full bg-[#F5B700] hover:bg-[#F5B700]/90 text-black font-black uppercase text-sm py-3.5 rounded-xl tracking-wider transition-all mt-4">
              Entrar
            </button>
            <div className="text-center mt-6">
              <button type="button" onClick={() => setMode('coach')} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                Sou um treinador convidado
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCoachLogin} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1 block">Código Especialista</label>
              <input
                type="text"
                placeholder="DAVID CAETANO"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 transition-colors uppercase"
                value={coachCode}
                onChange={e => {setCoachCode(e.target.value); setCoachError(false)}}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1 block">Senha</label>
              <input
                type="password"
                placeholder="BIOMECHANICS SPECIALIST"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 transition-colors tracking-widest"
                value={coachPass}
                onChange={e => {setCoachPass(e.target.value); setCoachError(false)}}
              />
              {coachError && <p className="text-red-400 text-xs mt-1">Credenciais inválidas ou inspiradas.</p>}
            </div>
            <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase text-sm py-3.5 rounded-xl tracking-wider transition-all mt-4">
              Entrar
            </button>
            <div className="text-center mt-6">
              <button type="button" onClick={() => setMode('athlete')} className="text-gray-500 hover:text-[#F5B700] text-xs transition-colors">
                Sou o atleta principal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
