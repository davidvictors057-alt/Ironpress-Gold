import { useState } from "react";
import { Trophy, Crown, ChevronDown, ChevronUp, MessageSquare, X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { competitions, arnoldProgressData, olympiaProgressData } from "../mockData";

const aiResponses: Record<string, string> = {
  "devo arriscar 210kg": "Seu recorde é 210kg em treino, mas em competição a adrenalina ajuda. Vá com confiança, Ironside! 💪",
  "qual abertura recomendada": "Com base no histórico, uma abertura de 195kg tem 98% de acerto. Seguro e estratégico.",
  "como está minha progressão": "Sua progressão está excelente! Você está 97% do caminho para os 210kg no Arnold.",
  default: "Análise em desenvolvimento. Em breve teremos insights personalizados com IA real, Ironside!",
};

function SimulatorCard({ comp }: { comp: typeof competitions[0] }) {
  const [opening, setOpening] = useState(comp.goal - 15 + "");
  const [second, setSecond] = useState(comp.goal - 8 + "");
  const [third, setThird] = useState(comp.goal + "");
  const [result, setResult] = useState<string | null>(null);

  function simulate() {
    const o = parseFloat(opening);
    const pct = Math.round((o / (comp.goal + 5)) * 100);
    setResult(`Abertura ${opening}kg → ${pct}% de precisão estimada. ${pct >= 95 ? "Estratégia sólida, Ironside!" : "Considere uma abertura mais conservadora."}`);
  }

  return (
    <div className="card-dark border border-[#2A2A2A] p-4 mt-3">
      <h4 className="text-[#F5B700] font-bold text-sm mb-3 uppercase tracking-wider">
        Simulador de Tentativas
      </h4>
      <div className="space-y-2 mb-3">
        {[
          { label: "1ª Tentativa (Abertura)", value: opening, set: setOpening },
          { label: "2ª Tentativa", value: second, set: setSecond },
          { label: "3ª Tentativa", value: third, set: setThird },
        ].map(({ label, value, set }, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-32 flex-shrink-0">{label}</span>
            <input
              type="number"
              className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
              value={value}
              onChange={e => set(e.target.value)}
            />
            <span className="text-gray-400 text-xs">kg</span>
          </div>
        ))}
      </div>
      <button
        className="btn-gold w-full py-2 text-sm font-bold mb-3"
        onClick={simulate}
        data-testid="button-simulate"
      >
        Simular Tentativas
      </button>
      {result && (
        <div className="bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-lg p-3">
          <p className="text-gray-200 text-sm">{result}</p>
        </div>
      )}
    </div>
  );
}

function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Olá Ironside! Sou sua IA de campeonato. Como posso ajudar na sua preparação?" }
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    const userMsg = input.toLowerCase().trim();
    const aiText = aiResponses[userMsg] || aiResponses.default;
    setMessages(m => [...m, { role: "user", text: input }, { role: "ai", text: aiText }]);
    setInput("");
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-[#F5B700]" size={20} />
          <span className="text-white font-bold">IA do Campeonato</span>
        </div>
        <button onClick={onClose} data-testid="button-close-ai">
          <X size={24} className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
              m.role === "user"
                ? "bg-[#F5B700] text-black font-semibold"
                : "bg-[#1A1A1A] text-gray-200 border border-[#2A2A2A]"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div className="mt-2 text-center">
          <p className="text-gray-600 text-xs">Tente: "devo arriscar 210kg", "qual abertura recomendada"</p>
        </div>
      </div>
      <div className="p-4 border-t border-[#2A2A2A] flex gap-2">
        <input
          className="flex-1 bg-[#1A1A1A] border border-[#F5B700]/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
          placeholder="Pergunte ao Ironside IA..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          data-testid="input-ai-chat"
        />
        <button className="btn-gold px-4 py-2.5 text-sm font-bold rounded-xl" onClick={send} data-testid="button-send-ai">
          Enviar
        </button>
      </div>
    </div>
  );
}

function CompetitionCard({ comp, progressData, extra }: {
  comp: typeof competitions[0];
  progressData: { week: string; real: number; meta: number }[];
  extra?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="mx-4 card-dark border border-[#F5B700]/40" data-testid={`card-competition-${comp.id}`}>
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-${comp.id}`}
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-[#F5B700]" size={18} />
            <span className="text-white font-black">{comp.name}</span>
          </div>
          <p className="text-gray-400 text-xs">{comp.date.split("-").reverse().join("/")} — {comp.modality}</p>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <span className="text-gray-500 text-xs">Meta: </span>
              <span className="text-[#F5B700] font-black">{comp.goal}kg</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Atual: </span>
              <span className="text-white font-bold">{comp.currentEstimate}kg</span>
            </div>
          </div>
        </div>
        <div>
          {expanded ? <ChevronUp className="text-[#F5B700]" size={20} /> : <ChevronDown className="text-[#F5B700]" size={20} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2A2A2A] pt-4 space-y-3">
          {/* Progress Chart */}
          <div>
            <h4 className="text-[#F5B700] font-bold text-sm mb-2 uppercase tracking-wider">Progressão</h4>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={progressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="week" tick={{ fill: "#B0B0B0", fontSize: 10 }} />
                <YAxis tick={{ fill: "#B0B0B0", fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #F5B700", borderRadius: 8 }}
                  labelStyle={{ color: "#F5B700" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="real" stroke="#F5B700" strokeWidth={2.5} dot={{ fill: "#F5B700", r: 3 }} name="Real" />
                <Line type="monotone" dataKey="meta" stroke="#FF8C00" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Meta" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Simulator */}
          <SimulatorCard comp={comp} />

          {/* Extra Badge */}
          {extra}

          {/* AI Button */}
          <button
            className="btn-gold w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm"
            onClick={() => setShowAI(true)}
            data-testid="button-ai-championship"
          >
            <MessageSquare size={16} />
            IA do Campeonato
          </button>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAI && <AIChat onClose={() => setShowAI(false)} />}
    </div>
  );
}

export default function Championships() {
  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            CAMPEONATOS
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Preparação e estratégia para competições</p>
      </div>

      {/* Arnold Classic */}
      <CompetitionCard
        comp={competitions[0]}
        progressData={arnoldProgressData}
      />

      {/* Olympia Brasil */}
      <CompetitionCard
        comp={competitions[1]}
        progressData={olympiaProgressData}
        extra={
          <div className="bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-xl p-3 flex items-center gap-2">
            <Crown className="text-[#F5B700]" size={20} />
            <div>
              <p className="text-[#F5B700] font-bold text-sm">Busca pelo Tri Mundial</p>
              <p className="text-gray-400 text-xs">Ritmo atual suficiente para atingir 300kg</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
