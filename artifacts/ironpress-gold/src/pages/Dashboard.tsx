import { useState, useEffect } from "react";
import { Trophy, Crown, Flame, Camera, ChevronRight, Dumbbell, Target } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { athlete, competitions, evolutionData } from "../mockData";

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CountdownCard() {
  const comp = competitions[0];
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
        onClick={() => alert("Funcionalidade em desenvolvimento – versão demonstrativa Ironside")}
      >
        Registrar Treino
      </button>
    </div>
  );
}

function EvolutionChart() {
  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="chart-evolution">
      <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">
        Evolução 1RM — Últimas 8 Semanas
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="pb-6 space-y-4">
      {/* Hero Header */}
      <div className="text-center py-6 px-4">
        <div className="w-20 h-20 rounded-full bg-[#F5B700] flex items-center justify-center mx-auto mb-4 shadow-xl" style={{ boxShadow: "0 0 30px rgba(245,183,0,0.5)" }}>
          <span className="text-black font-black text-2xl" style={{ fontFamily: "Montserrat, sans-serif" }}>IR</span>
        </div>
        <h1 className="text-4xl font-black text-[#F5B700] tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
          IRONSIDE
        </h1>
        <p className="text-gray-300 text-sm mt-1">Leonardo Rodrigues | 95kg | Categoria 100kg</p>
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

      {/* Record Badge */}
      <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700] rounded-xl p-3 flex items-center gap-3" data-testid="badge-record">
        <Crown className="text-[#F5B700]" size={24} />
        <div>
          <p className="text-[#F5B700] font-black text-sm uppercase tracking-widest">Recordista Brasileiro F8</p>
          <p className="text-white font-bold text-xl">280kg</p>
        </div>
        <Flame className="text-orange-500 ml-auto" size={22} />
      </div>

      {/* Stats Row */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="card-dark p-3 text-center border border-[#2A2A2A]" data-testid="stat-raw">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Supino RAW</p>
          <p className="text-3xl font-black text-white">{athlete.rawMax}<span className="text-lg text-[#F5B700]">kg</span></p>
          <p className="text-gray-500 text-xs">Meta: {athlete.rawGoal}kg</p>
        </div>
        <div className="card-dark p-3 text-center border border-[#2A2A2A]" data-testid="stat-equipped">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Supino F8</p>
          <p className="text-3xl font-black text-white">{athlete.equippedMax}<span className="text-lg text-[#FF8C00]">kg</span></p>
          <p className="text-gray-500 text-xs">Meta: {athlete.equippedGoal}kg</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="mx-4">
        <CountdownCard />
      </div>

      {/* Today's Training */}
      <div className="mx-4">
        <TodayTrainingCard />
      </div>

      {/* Evolution Chart */}
      <div className="mx-4">
        {mounted && <EvolutionChart />}
      </div>

      {/* Upload Video */}
      <div className="mx-4">
        <button
          className="btn-gold-outline w-full py-3 flex items-center justify-center gap-2 font-semibold"
          data-testid="button-upload-video"
          onClick={() => alert("Funcionalidade em desenvolvimento – versão demonstrativa Ironside")}
        >
          <Camera size={18} className="text-[#F5B700]" />
          <span>Upload de Vídeo</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Achievements */}
      <div className="mx-4 space-y-2">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider">Conquistas</h3>
        {athlete.achievements.map((ach, i) => (
          <div key={i} className="card-dark p-3 border border-[#2A2A2A] flex items-center gap-3" data-testid={`achievement-${i}`}>
            <Trophy className="text-[#F5B700]" size={18} />
            <span className="text-gray-200 text-sm">{ach.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
