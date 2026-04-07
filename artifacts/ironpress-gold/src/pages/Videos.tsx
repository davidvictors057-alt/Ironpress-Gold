import { useState, useEffect } from "react";
import { Play, Crown, Share2, X, MessageSquare, Activity, Plus, Trash2, Upload } from "lucide-react";
import BiomechAnalysisOverlay from "../components/BiomechAnalysisOverlay";
import { supabase } from "../lib/supabase";

interface VideoRecord {
  id: string;
  title: string;
  date: string;
  modality: string;
  isRecord: boolean;
  storage_path?: string;
}

// Removido o uso de DEFAULT_VIDEOS e saves locais para focar no Supabase

function generateCode() {
  const codes = ["IRON123", "IRON456", "SIDE789", "GOLD001", "PRESS42"];
  alert(`Código compartilhado: ${codes[Math.floor(Math.random() * codes.length)]}`);
}

function VideoModal({
  video,
  onClose,
  onAnalyze,
}: {
  video: VideoRecord;
  onClose: () => void;
  onAnalyze: () => void;
}) {
  const [comment, setComment] = useState(() => localStorage.getItem(`video_comment_${video.id}`) ?? "");
  const [savedMsg, setSavedMsg] = useState("");

  function handleSaveComment() {
    if (!comment.trim()) return;
    localStorage.setItem(`video_comment_${video.id}`, comment);
    setSavedMsg("Comentário salvo!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          {video.isRecord && <Crown className="text-[#F5B700]" size={18} />}
          <span className="text-white font-bold text-sm truncate max-w-[220px]">{video.title}</span>
        </div>
        <button onClick={onClose} data-testid="button-close-modal"><X size={24} className="text-gray-400" /></button>
      </div>

      <div className="mx-4 mt-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5B700]/20 border-2 border-[#F5B700] flex items-center justify-center mx-auto mb-3">
            <Play className="text-[#F5B700]" size={28} fill="#F5B700" />
          </div>
          <p className="text-gray-400 text-sm">Player Simulado</p>
          <p className="text-gray-600 text-xs mt-1">{video.date} — {video.modality}</p>
        </div>
      </div>

      <div className="mx-4 mt-3 space-y-2 flex-1 overflow-y-auto pb-4">
        <button
          className="w-full btn-gold py-3 flex items-center justify-center gap-2 text-sm font-bold"
          onClick={onAnalyze}
          data-testid="button-analyze-movement"
        >
          <Activity size={18} />
          Analisar Movimento (MediaPipe IA)
        </button>

        <div className="flex gap-2">
          <button
            className="flex-1 btn-gold-outline py-2.5 flex items-center justify-center gap-2 text-sm"
            onClick={generateCode}
            data-testid="button-share-coach"
          >
            <Share2 size={16} className="text-[#F5B700]" />
            Compartilhar
          </button>
        </div>

        <div className="card-dark p-3 border border-[#2A2A2A]">
          <p className="text-[#F5B700] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <MessageSquare size={13} />
            Comentários
          </p>
          <textarea
            className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#F5B700]"
            placeholder="Adicione um comentário sobre este treino..."
            value={comment}
            onChange={e => { setComment(e.target.value); setSavedMsg(""); }}
            rows={3}
            data-testid="input-comment"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-green-400 text-xs">{savedMsg}</p>
            <button className="btn-gold px-4 py-1.5 text-sm font-bold" onClick={handleSaveComment} data-testid="button-save-comment">
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVideoModal({ onAdd, onClose }: { onAdd: () => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [modality, setModality] = useState("EQUIPADO F8");
  const [isRecord, setIsRecord] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleAdd() {
    if (!title.trim() || !file) return;
    setUploading(true);
    
    try {
      const fileName = `${Date.now()}-${file.name}`;
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
    <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-[#1A1A1A] rounded-t-3xl p-5 border-t border-[#F5B700]/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-4" />
        <h3 className="text-[#F5B700] font-black text-lg mb-4">Novo Vídeo</h3>
        <div className="space-y-3">
          <input className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          
          <div className="relative">
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              id="video-upload" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
            />
            <label 
              htmlFor="video-upload" 
              className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-gray-400 text-sm flex items-center gap-2 cursor-pointer hover:border-[#F5B700]"
            >
              <Upload size={16} />
              {file ? file.name : "Selecionar Vídeo"}
            </label>
          </div>

          <select className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" value={modality} onChange={e => setModality(e.target.value)}>
            <option value="EQUIPADO F8">EQUIPADO F8</option>
            <option value="RAW">RAW</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRecord} onChange={e => setIsRecord(e.target.checked)} className="accent-[#F5B700]" />
            <span className="text-gray-300 text-sm">É um recorde</span>
          </label>
          <button 
            className="btn-gold w-full py-3 font-black text-sm disabled:opacity-50" 
            onClick={handleAdd}
            disabled={uploading}
          >
            {uploading ? "Fazendo Upload..." : "Adicionar Vídeo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [analyzeVideo, setAnalyzeVideo] = useState<VideoRecord | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleAddVideo = () => {
    fetchVideos();
  };

  async function fetchVideos() {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVideos(data.map(v => ({
        id: v.id,
        title: v.title,
        date: new Date(v.created_at).toLocaleDateString("pt-BR"),
        modality: v.modality,
        isRecord: v.is_record,
        storage_path: v.storage_path
      })));
    } catch (error) {
      console.error("Erro ao carregar vídeos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVideo(id: string) {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
    
    try {
      const videoToDelete = videos.find(v => v.id === id);
      if (videoToDelete?.storage_path) {
        await supabase.storage.from('videos').remove([videoToDelete.storage_path]);
      }
      
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      alert("Erro ao excluir vídeo.");
    }
  }

  return (
    <div className="pb-6 space-y-4">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Play className="text-[#F5B700]" size={22} />
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>VÍDEOS</h1>
          </div>
          <button
            className="btn-gold px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            onClick={() => setShowAddVideo(true)}
            data-testid="button-add-video"
          >
            <Plus size={14} />
            Novo
          </button>
        </div>
        <p className="text-gray-400 text-sm">Biblioteca com análise biomecânica IA</p>
      </div>

      <div className="mx-4 space-y-3" data-testid="list-videos">
        {videos.map(video => (
          <div
            key={video.id}
            className="card-dark border border-[#2A2A2A] p-4 relative transition-all hover:border-[#F5B700]/40"
            data-testid={`card-video-${video.id}`}
          >
            <div className="flex gap-3">
              <button
                className="w-20 h-14 bg-[#0A0A0A] rounded-lg flex items-center justify-center border border-[#2A2A2A] flex-shrink-0"
                onClick={() => setSelectedVideo(video)}
              >
                <Play className="text-[#F5B700]" size={22} fill="#F5B700" />
              </button>
              <div className="flex-1 min-w-0" onClick={() => setSelectedVideo(video)}>
                <div className="flex items-center gap-1 mb-1">
                  {video.isRecord && <Crown className="text-[#F5B700] flex-shrink-0" size={14} />}
                  <p className="text-white font-semibold text-sm leading-tight truncate">{video.title}</p>
                </div>
                <p className="text-gray-400 text-xs">{video.date}</p>
                <div className="flex gap-1 mt-1">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${video.modality === "RAW" ? "bg-[#F5B700]/20 text-[#F5B700]" : "bg-orange-500/20 text-orange-400"}`}>
                    {video.modality}
                  </span>
                  {video.isRecord && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#F5B700] text-black font-bold">RECORDE</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  className="p-1.5 bg-[#1A1A1A] rounded-lg"
                  onClick={() => setAnalyzeVideo(video)}
                  data-testid={`button-analyze-${video.id}`}
                  title="Análise Biomecânica"
                >
                  <Activity size={15} className="text-[#F5B700]" />
                </button>
                <button
                  className="p-1.5 bg-[#1A1A1A] rounded-lg"
                  onClick={() => handleDeleteVideo(video.id)}
                  data-testid={`button-delete-video-${video.id}`}
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="mx-4 text-center py-8">
          <p className="text-gray-500">Nenhum vídeo cadastrado.</p>
        </div>
      )}

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onAnalyze={() => { setSelectedVideo(null); setAnalyzeVideo(selectedVideo); }}
        />
      )}

      {analyzeVideo && (
        <BiomechAnalysisOverlay
          videoId={analyzeVideo.id}
          videoTitle={analyzeVideo.title}
          onClose={() => setAnalyzeVideo(null)}
        />
      )}

      {showAddVideo && <AddVideoModal onAdd={handleAddVideo} onClose={() => setShowAddVideo(false)} />}
    </div>
  );
}
