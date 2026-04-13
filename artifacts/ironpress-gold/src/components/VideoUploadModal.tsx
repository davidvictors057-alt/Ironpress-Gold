import { useState } from "react";
import { X, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Props {
  onAdd: () => void;
  onClose: () => void;
}

export default function VideoUploadModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [modality, setModality] = useState("RAW");
  const [isRecord, setIsRecord] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleAdd() {
    if (!title.trim() || !file) return;
    setUploading(true);
    
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          modality,
          is_record: isRecord,
          storage_path: uploadData.path,
        });

      if (dbError) throw dbError;

      onAdd();
      onClose();
    } catch (error: any) {
      alert("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[110] p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[#F5B700] font-black text-xl uppercase tracking-widest">Novo Registro</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-1">Identificação</label>
            <input 
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5B700] transition-colors" 
              placeholder="Ex: Supino 220kg - RPE 9" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-1">Arquivo Cinematic</label>
            <div className="relative">
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                id="video-upload-new" 
                onChange={e => setFile(e.target.files?.[0] || null)} 
              />
              <label 
                htmlFor="video-upload-new" 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm flex items-center gap-3 cursor-pointer hover:border-[#F5B700] transition-colors"
              >
                <div className="p-1.5 bg-white/5 rounded-lg text-[#F5B700]">
                  <Upload size={16} />
                </div>
                {file ? file.name : "Selecionar Vídeo"}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-gray-500 text-[9px] font-black uppercase tracking-widest ml-1">Modalidade</label>
              <select 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5B700] transition-colors" 
                value={modality} 
                onChange={e => setModality(e.target.value)}
              >
                <option value="RAW">RAW (Sem Auxílio)</option>
                <option value="EQUIPADO F8">EQUIPADO F8</option>
                <option value="EQUIPADO MULTIPLY">MULTIPLY</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/5 hover:border-[#F5B700]/30 rounded-xl px-4 py-3 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isRecord} 
                  onChange={e => setIsRecord(e.target.checked)} 
                  className="w-4 h-4 accent-[#F5B700] rounded-lg" 
                />
                <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest">Personal Record</span>
              </label>
            </div>
          </div>

          <button 
            className="w-full bg-[#F5B700] text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100" 
            onClick={handleAdd}
            disabled={uploading}
          >
            {uploading ? "Sincronizando com a Nuvem..." : "Adicionar ao Laboratório"}
          </button>
        </div>
      </div>
    </div>
  );
}
