import { useState } from "react";
import { Brain, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { rawTrainings, equippedTrainings } from "../mockData";

type Training = { date: string; target: number; actual: number; rpe: number };

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

function TrainingTable({ trainings }: { trainings: Training[] }) {
  return (
    <div className="card-dark border border-[#2A2A2A] overflow-hidden" data-testid="table-trainings">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#2A2A2A]">
            <th className="text-gray-400 text-left p-3">Data</th>
            <th className="text-gray-400 text-center p-3">Alvo</th>
            <th className="text-gray-400 text-center p-3">Real</th>
            <th className="text-gray-400 text-center p-3">%</th>
            <th className="text-gray-400 text-center p-3">RPE</th>
          </tr>
        </thead>
        <tbody>
          {trainings.map((t, i) => {
            const pct = Math.round((t.actual / t.target) * 100);
            return (
              <tr key={i} className="border-b border-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors" data-testid={`row-training-${i}`}>
                <td className="p-3 text-gray-300">{t.date}</td>
                <td className="p-3 text-center text-gray-300">{t.target}kg</td>
                <td className="p-3 text-center text-white font-semibold">{t.actual}kg</td>
                <td className={`p-3 text-center font-bold ${getBarLabel(pct)}`}>{pct}%</td>
                <td className="p-3 text-center text-gray-300">{t.rpe}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TrainingChart({ trainings }: { trainings: Training[] }) {
  const data = trainings.map((t) => ({
    date: t.date.slice(0, 5),
    alvo: t.target,
    realizado: t.actual,
    pct: Math.round((t.actual / t.target) * 100),
  }));

  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="chart-trainings">
      <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">
        Alvo vs Realizado
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="date" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
          <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
            labelStyle={{ color: "#F5B700" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#B0B0B0", fontSize: 11 }}>
                {value === "alvo" ? "Alvo" : "Realizado"}
              </span>
            )}
          />
          <Bar dataKey="alvo" fill="#2A2A2A" name="alvo" radius={[4, 4, 0, 0]} />
          <Bar dataKey="realizado" name="realizado" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={getBarColor(d.pct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Trainings() {
  const [mode, setMode] = useState<"raw" | "equipped">("raw");
  const [showAIModal, setShowAIModal] = useState(false);
  const trainings = mode === "raw" ? rawTrainings : equippedTrainings;

  const pcts = trainings.map(t => Math.round((t.actual / t.target) * 100));
  const highPct = pcts.filter(p => p >= 99).length;

  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            TREINOS
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Histórico e evolução de cargas</p>
      </div>

      {/* Mode Selector */}
      <div className="mx-4 flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A]" data-testid="selector-mode">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "raw" ? "btn-gold" : "text-gray-400"}`}
          onClick={() => setMode("raw")}
          data-testid="button-mode-raw"
        >
          RAW
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === "equipped" ? "btn-gold" : "text-gray-400"}`}
          onClick={() => setMode("equipped")}
          data-testid="button-mode-equipped"
        >
          EQUIPADO F8
        </button>
      </div>

      {/* Chart */}
      <div className="mx-4">
        <TrainingChart trainings={trainings} />
      </div>

      {/* Insight Card */}
      <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/40 rounded-xl p-4" data-testid="card-insight">
        <div className="flex items-start gap-2">
          <span className="text-[#F5B700] text-xl">⚡</span>
          <div>
            <p className="text-[#F5B700] font-bold text-sm">Insight do Coach IA</p>
            <p className="text-gray-200 text-sm mt-1">
              {mode === "raw"
                ? `Você atingiu 99%+ em ${highPct} dos ${trainings.length} últimos treinos RAW. Consistência de campeão.`
                : `Performance sólida no Equipado F8. Continue a progressão para a meta de ${300}kg.`}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-4">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-2">
          Últimos 7 Treinos — {mode === "raw" ? "RAW" : "Equipado F8"}
        </h3>
        <TrainingTable trainings={trainings} />
      </div>

      {/* AI Button */}
      <div className="mx-4">
        <button
          className="btn-gold-outline w-full py-3 flex items-center justify-center gap-2 font-semibold"
          data-testid="button-ask-ai"
          onClick={() => setShowAIModal(true)}
        >
          <Brain size={18} className="text-[#F5B700]" />
          Perguntar à IA
        </button>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setShowAIModal(false)}>
          <div
            className="w-full bg-[#1A1A1A] rounded-t-3xl p-6 border-t border-[#F5B700]/30"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
            <h3 className="text-[#F5B700] font-black text-lg mb-2">IA Ironside</h3>
            <p className="text-gray-300 text-sm mb-4">
              Em breve, análise real com Gemini — prepare-se para dicas do Ironside!
            </p>
            <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#2A2A2A] mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Preview da IA</p>
              <p className="text-gray-200 text-sm">
                "Sua consistência está excelente. Com RPE médio de 8.2 nos treinos RAW, 
                você tem margem para progredir 2.5kg na próxima semana. Vá com confiança, Ironside!"
              </p>
            </div>
            <button
              className="btn-gold w-full py-2 font-bold"
              onClick={() => setShowAIModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
