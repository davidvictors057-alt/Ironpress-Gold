import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, Copy } from "lucide-react";
import { supabase } from "../../lib/supabase";
import MedFormModal, { Medication } from "./MedFormModal";

export interface HormonalWeek {
  id: string;
  label: string; // "Semana 1", etc.
  medications: Medication[];
}

interface Props {
  week: HormonalWeek;
  onUpdate: () => Promise<void>; // Retorna promise para await
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function WeekCard({ week, onUpdate, onDelete, onDuplicate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const medications = week.medications || [];
  const totalMgWeek = medications.reduce((acc, m) => acc + (Number(m.concentration) || 0) * (Number(m.dose) || 0) * (Number(m.frequency) || 0), 0);

  async function addMedication(med: Medication) {
    try {
      const { error } = await supabase.from('hormone_medications').insert({
        week_id: week.id,
        name: med.name,
        concentration: med.concentration,
        concentration_unit: med.concentrationUnit,
        dose: med.dose,
        dose_unit: med.doseUnit,
        frequency: med.frequency
      });
      if (error) throw error;
      await onUpdate();
      setShowAddMed(false);
    } catch (e: any) {
      alert("Erro ao adicionar medicação: " + e.message);
    }
  }

  async function editMedication(med: Medication) {
    try {
      const { error } = await supabase.from('hormone_medications').update({
        name: med.name,
        concentration: med.concentration,
        concentration_unit: med.concentrationUnit,
        dose: med.dose,
        dose_unit: med.doseUnit,
        frequency: med.frequency
      }).eq('id', med.id);
      if (error) throw error;
      await onUpdate();
      setEditingMed(null);
    } catch (e: any) {
      alert("Erro ao editar medicação: " + e.message);
    }
  }

  async function deleteMedication(id: string) {
    if (!confirm("Excluir medicação?")) return;
    try {
      const { error } = await supabase.from('hormone_medications').delete().eq('id', id);
      if (error) throw error;
      await onUpdate();
    } catch (e: any) {
      alert("Erro ao deletar medicação: " + e.message);
    }
  }

  return (
    <div className="card-dark border border-[#2A2A2A] rounded-xl overflow-hidden" data-testid={`week-card-${week.id}`}>
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-week-${week.id}`}
      >
        <div className="text-left">
          <h4 className="text-white font-bold">{week.label}</h4>
          <p className="text-gray-400 text-xs">{week.medications.length} medicamento(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-gray-500 text-xs">Total/semana</p>
            <p className="text-[#F5B700] font-black text-lg">{totalMgWeek.toFixed(0)}<span className="text-xs ml-0.5">mg</span></p>
          </div>
          {expanded ? <ChevronUp className="text-[#F5B700]" size={18} /> : <ChevronDown className="text-[#F5B700]" size={18} />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#2A2A2A] p-4 space-y-2">
          {/* Medications list */}
          {week.medications.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-2">Nenhum medicamento. Adicione abaixo.</p>
          )}
          {week.medications.map(med => {
            const mgW = (med.concentration * med.dose * med.frequency).toFixed(0);
            return (
              <div key={med.id} className="bg-[#0A0A0A] rounded-xl p-3 border border-[#2A2A2A] flex items-center gap-2" data-testid={`med-row-${med.id}`}>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{med.name}</p>
                  <p className="text-gray-400 text-xs">
                    {med.concentration}{med.concentrationUnit} × {med.dose}{med.doseUnit} × {med.frequency}×/sem
                  </p>
                </div>
                <div className="text-right mr-2">
                  <p className="text-[#F5B700] font-bold text-sm">{mgW}mg</p>
                  <p className="text-gray-500 text-xs">/ semana</p>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => setEditingMed(med)}
                    data-testid={`button-edit-med-${med.id}`}
                  >
                    <Edit2 size={13} className="text-[#F5B700]" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => deleteMedication(med.id)}
                    data-testid={`button-delete-med-${med.id}`}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              className="flex-1 btn-gold py-2 text-xs font-bold flex items-center justify-center gap-1"
              onClick={() => setShowAddMed(true)}
              data-testid={`button-add-med-${week.id}`}
            >
              <Plus size={14} />
              Adicionar
            </button>
            <button
              className="flex-1 btn-gold-outline py-2 text-xs font-semibold flex items-center justify-center gap-1"
              onClick={onDuplicate}
              data-testid={`button-duplicate-week-${week.id}`}
            >
              <Copy size={14} className="text-[#F5B700]" />
              Duplicar
            </button>
            <button
              className="py-2 px-3 bg-red-900/20 border border-red-800/30 rounded-lg"
              onClick={onDelete}
              data-testid={`button-delete-week-${week.id}`}
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddMed && (
        <MedFormModal onSave={addMedication} onClose={() => setShowAddMed(false)} />
      )}
      {editingMed && (
        <MedFormModal initial={editingMed} onSave={editMedication} onClose={() => setEditingMed(null)} />
      )}
    </div>
  );
}
