import { useState } from "react";
import { Play, Crown, Share2, X, MessageSquare, Activity, Plus, Trash2 } from "lucide-react";
import BiomechAnalysisOverlay from "../components/BiomechAnalysisOverlay";

interface VideoRecord {
  id: number;
  title: string;
  date: string;
  modality: string;
  isRecord: boolean;
}

const DEFAULT_VIDEOS: VideoRecord[] = [
  { id: 1, title: "Supino RAW - 190kg (recorde)", date: "01/04/2025", modality: "RAW", isRecord: true },
  { id: 2, title: "Supino Equipado F8 - 280kg (recorde brasileiro)", date: "28/03/2025", modality: "EQUIPADO F8", isRecord: true },
  { id: 3, title: "Treino Técnico - Pegada e Setup", date: "25/03/2025", modality: "RAW", isRecord: false },
  { id: 4, title: "Preparação F8 - 275kg", date: "20/03/2025", modality: "EQUIPADO F8", isRecord: false },
];

function loadVideos(): VideoRecord[] {
  try {
    return JSON.parse(localStorage.getItem("ironside_videos") || JSON.stringify(DEFAULT_VIDEOS));
  } catch {
    return DEFAULT_VIDEOS;
  }
}

function saveVideos(videos: VideoRecord[]) {
  localStorage.setItem("ironside_videos", JSON.stringify(videos));
}

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

function AddVideoModal({ onAdd, onClose }: { onAdd: (v: VideoRecord) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [modality, setModality] = useState("EQUIPADO F8");
  const [isRecord, setIsRecord] = useState(false);

  function handleAdd() {
    if (!title.trim() || !date.trim()) return;
    const newVideo: VideoRecord = {
      id: Date.now(),
      title: title.trim(),
      date,
      modality,
      isRecord,
    };
    onAdd(newVideo);
    onClose();
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
          <input type="text" className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" placeholder="Data (DD/MM/AAAA)" value={date} onChange={e => setDate(e.target.value)} />
          <select className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700]" value={modality} onChange={e => setModality(e.target.value)}>
            <option value="EQUIPADO F8">EQUIPADO F8</option>
            <option value="RAW">RAW</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRecord} onChange={e => setIsRecord(e.target.checked)} className="accent-[#F5B700]" />
            <span className="text-gray-300 text-sm">É um recorde</span>
          </label>
          <button className="btn-gold w-full py-3 font-black text-sm" onClick={handleAdd}>Adicionar Vídeo</button>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoRecord[]>(loadVideos);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [analyzeVideo, setAnalyzeVideo] = useState<VideoRecord | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);

  function handleAddVideo(v: VideoRecord) {
    const updated = [...videos, v];
    setVideos(updated);
    saveVideos(updated);
  }

  function handleDeleteVideo(id: number) {
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    saveVideos(updated);
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
