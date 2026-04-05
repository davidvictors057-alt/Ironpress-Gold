import { useState } from "react";
import { X } from "lucide-react";

export interface Medication {
  id: string;
  name: string;
  concentration: number;
  concentrationUnit: "mg/ml" | "mg/tab";
  dose: number;
  doseUnit: "ml" | "tab";
  frequency: number; // per week
}

interface Props {
  initial?: Partial<Medication>;
  onSave: (med: Medication) => void;
  onClose: () => void;
}

export default function MedFormModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [concentration, setConcentration] = useState(initial?.concentration?.toString() ?? "");
  const [concUnit, setConcUnit] = useState<"mg/ml" | "mg/tab">(initial?.concentrationUnit ?? "mg/ml");
  const [dose, setDose] = useState(initial?.dose?.toString() ?? "");
  const [doseUnit, setDoseUnit] = useState<"ml" | "tab">(initial?.doseUnit ?? "ml");
  const [frequency, setFrequency] = useState(initial?.frequency?.toString() ?? "1");
  const [error, setError] = useState("");

  const mgPerWeek = (parseFloat(concentration) || 0) * (parseFloat(dose) || 0) * (parseFloat(frequency) || 0);

  function handleSave() {
    if (!name.trim()) { setError("Nome obrigatório"); return; }
    if (!concentration || parseFloat(concentration) <= 0) { setError("Concentração inválida"); return; }
    if (!dose || parseFloat(dose) <= 0) { setError("Dose inválida"); return; }
    if (!frequency || parseFloat(frequency) <= 0) { setError("Frequência inválida"); return; }
    setError("");
    onSave({
      id: initial?.id ?? `med_${Date.now()}`,
      name: name.trim(),
      concentration: parseFloat(concentration),
      concentrationUnit: concUnit,
      dose: parseFloat(dose),
      doseUnit,
      frequency: parseFloat(frequency),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="modal-med-form"
      >
        <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#F5B700] font-black text-lg">
            {initial?.id ? "Editar Medicamento" : "Novo Medicamento"}
          </h3>
          <button onClick={onClose} data-testid="button-close-med-modal">
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Nome</label>
            <input
              className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
              placeholder="Ex: Testosterona Cipionato"
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-med-name"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Concentração</label>
              <input
                type="number"
                className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
                placeholder="200"
                value={concentration}
                onChange={e => setConcentration(e.target.value)}
                data-testid="input-med-concentration"
              />
            </div>
            <div className="w-28">
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Unidade</label>
              <select
                className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
                value={concUnit}
                onChange={e => {
                  setConcUnit(e.target.value as "mg/ml" | "mg/tab");
                  setDoseUnit(e.target.value === "mg/ml" ? "ml" : "tab");
                }}
              >
                <option value="mg/ml">mg/ml</option>
                <option value="mg/tab">mg/tab</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Dose por aplicação</label>
              <input
                type="number"
                className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
                placeholder="1"
                value={dose}
                onChange={e => setDose(e.target.value)}
                data-testid="input-med-dose"
              />
            </div>
            <div className="w-20 flex items-end pb-2.5">
              <span className="text-gray-400 text-sm">{doseUnit}</span>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">
              Frequência (vezes por semana)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]"
              placeholder="2"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              data-testid="input-med-frequency"
            />
          </div>

          {/* Auto-calc */}
          {mgPerWeek > 0 && (
            <div className="bg-[#F5B700]/10 border border-[#F5B700]/30 rounded-xl p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total semana:</span>
              <span className="text-[#F5B700] font-black text-xl">{mgPerWeek.toFixed(0)}<span className="text-sm ml-1">mg</span></span>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            className="btn-gold w-full py-3 font-black text-sm mt-1"
            onClick={handleSave}
            data-testid="button-save-med"
          >
            Salvar Medicamento
          </button>
        </div>
      </div>
    </div>
  );
}
