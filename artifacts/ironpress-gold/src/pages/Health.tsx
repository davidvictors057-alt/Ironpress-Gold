import { useState, useEffect } from "react";
import { Heart, AlertTriangle, CheckSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { medications, healthCorrelation } from "../mockData";

const HEALTH_KEY = "ironside_health_data";

type HealthData = {
  shoulder: number;
  elbow: number;
  wrist: number;
  fatigue: number;
};

function loadHealth(): HealthData {
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { shoulder: 0, elbow: 0, wrist: 0, fatigue: 0 };
}

function MedCard({ med }: { med: typeof medications[0] }) {
  const [checked, setChecked] = useState(false);
  const lowStock = med.stock < 20;

  return (
    <div
      className={`card-dark p-4 border flex items-center gap-3 ${lowStock ? "border-[#F5B700]/60" : "border-[#2A2A2A]"}`}
      data-testid={`card-medication-${med.id}`}
    >
      <button
        className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? "bg-[#F5B700] border-[#F5B700]" : "border-gray-500"}`}
        onClick={() => setChecked(!checked)}
        data-testid={`checkbox-med-${med.id}`}
      >
        {checked && <CheckSquare size={14} className="text-black" />}
      </button>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{med.name}</p>
        <p className="text-gray-400 text-xs">{med.dose}</p>
      </div>
      <div className={`text-right ${lowStock ? "text-[#F5B700]" : "text-gray-400"}`}>
        <p className="font-bold text-sm">{med.stock}</p>
        <p className="text-xs">{med.unit}</p>
        {lowStock && (
          <AlertTriangle size={12} className="text-[#F5B700] ml-auto mt-0.5" />
        )}
      </div>
    </div>
  );
}

type SliderProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  testId: string;
};

function PainSlider({ label, value, onChange, testId }: SliderProps) {
  const color = value <= 3 ? "#4ade80" : value <= 6 ? "#F5B700" : "#ef4444";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="font-bold text-sm" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#F5B700] cursor-pointer"
        data-testid={testId}
        style={{ accentColor: color }}
      />
    </div>
  );
}

function CorrelationChart() {
  return (
    <div className="card-dark p-4 border border-[#2A2A2A]" data-testid="chart-correlation">
      <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">
        Dor vs Performance
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={healthCorrelation} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
          <XAxis dataKey="session" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
          <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
            labelStyle={{ color: "#F5B700" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="pain" name="Dor" radius={[4, 4, 0, 0]}>
            {healthCorrelation.map((_, i) => (
              <Cell key={i} fill="#ef4444" />
            ))}
          </Bar>
          <Bar dataKey="performance" name="Performance %" radius={[4, 4, 0, 0]}>
            {healthCorrelation.map((_, i) => (
              <Cell key={i} fill="#F5B700" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Health() {
  const [health, setHealth] = useState<HealthData>(loadHealth());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = loadHealth();
    setHealth(data);
  }, []);

  function updateHealth(key: keyof HealthData, val: number) {
    setHealth(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function saveHealth() {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const lowStockMeds = medications.filter(m => m.stock < 20);

  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            SAÚDE
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Monitoramento de saúde e medicamentos</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockMeds.length > 0 && (
        <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/50 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="text-[#F5B700]" size={18} />
          <div>
            <p className="text-[#F5B700] font-bold text-sm">Estoque Baixo</p>
            <p className="text-gray-300 text-xs">
              {lowStockMeds.map(m => m.name).join(", ")} — menos de 20 dias
            </p>
          </div>
        </div>
      )}

      {/* Medications */}
      <div className="mx-4">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-2">
          Medicamentos & Suplementos
        </h3>
        <div className="space-y-2">
          {medications.map(med => (
            <MedCard key={med.id} med={med} />
          ))}
        </div>
      </div>

      {/* Pain & Fatigue */}
      <div className="mx-4 card-dark border border-[#2A2A2A] p-4">
        <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-4">
          Dor & Fadiga
        </h3>
        <PainSlider
          label="Ombro"
          value={health.shoulder}
          onChange={v => updateHealth("shoulder", v)}
          testId="slider-shoulder"
        />
        <PainSlider
          label="Cotovelo"
          value={health.elbow}
          onChange={v => updateHealth("elbow", v)}
          testId="slider-elbow"
        />
        <PainSlider
          label="Punho"
          value={health.wrist}
          onChange={v => updateHealth("wrist", v)}
          testId="slider-wrist"
        />
        <PainSlider
          label="Fadiga Geral"
          value={health.fatigue}
          onChange={v => updateHealth("fatigue", v)}
          testId="slider-fatigue"
        />
        <button
          className="btn-gold w-full py-2.5 font-bold text-sm mt-2"
          onClick={saveHealth}
          data-testid="button-save-health"
        >
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Correlation Chart */}
      <div className="mx-4">
        <CorrelationChart />
      </div>

      {/* Insight */}
      <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-xl p-4" data-testid="health-insight">
        <p className="text-[#F5B700] font-bold text-sm mb-1">Insight Automático</p>
        <p className="text-gray-200 text-sm">
          Quando a dor no cotovelo ultrapassou 4, seu rendimento caiu 7%. 
          Fortaleça os extensores e mantenha o cotovelo aquecido antes do supino.
        </p>
      </div>
    </div>
  );
}
