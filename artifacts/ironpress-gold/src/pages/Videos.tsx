import { useState } from "react";
import { Play, Crown, Share2, Brain, X, MessageSquare } from "lucide-react";
import { videos } from "../mockData";

type Video = { id: number; title: string; date: string; modality: string; isRecord: boolean; thumbnail: null };

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const [comment, setComment] = useState("");
  const [savedComment, setSavedComment] = useState<string | null>(null);

  function handleSaveComment() {
    if (!comment.trim()) return;
    const key = `video_comment_${video.id}`;
    localStorage.setItem(key, comment);
    setSavedComment(comment);
    setComment("");
  }

  function generateCode() {
    const codes = ["IRON123", "IRON456", "SIDE789", "GOLD001", "PRESS42"];
    alert(`Código compartilhado: ${codes[Math.floor(Math.random() * codes.length)]}`);
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          {video.isRecord && <Crown className="text-[#F5B700]" size={18} />}
          <span className="text-white font-bold text-sm truncate max-w-[200px]">{video.title}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white" data-testid="button-close-modal">
          <X size={24} />
        </button>
      </div>

      {/* Player Simulation */}
      <div className="mx-4 mt-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] aspect-video flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5B700]/20 border-2 border-[#F5B700] flex items-center justify-center mx-auto mb-3">
            <Play className="text-[#F5B700]" size={28} fill="#F5B700" />
          </div>
          <p className="text-gray-400 text-sm">Player Simulado</p>
          <p className="text-gray-600 text-xs mt-1">{video.date} — {video.modality}</p>
        </div>
      </div>

      {/* Info */}
      <div className="mx-4 mt-3 space-y-2 flex-1 overflow-y-auto pb-4">
        <div className="flex gap-2">
          <button
            className="flex-1 btn-gold-outline py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
            data-testid="button-analyze-movement"
            onClick={() => alert("Análise biomecânica em desenvolvimento – em breve, IA detectará ângulo de cotovelo.")}
          >
            <Brain size={16} className="text-[#F5B700]" />
            Analisar Movimento
          </button>
          <button
            className="flex-1 btn-gold-outline py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
            data-testid="button-share-coach"
            onClick={generateCode}
          >
            <Share2 size={16} className="text-[#F5B700]" />
            Compartilhar
          </button>
        </div>

        {/* Comment */}
        <div className="card-dark p-3 border border-[#2A2A2A]">
          <p className="text-[#F5B700] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <MessageSquare size={13} />
            Comentários
          </p>
          {savedComment && (
            <div className="bg-[#0A0A0A] rounded-lg p-2 mb-2 border border-[#F5B700]/20">
              <p className="text-gray-200 text-sm">{savedComment}</p>
            </div>
          )}
          <textarea
            className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#F5B700]"
            placeholder="Adicione um comentário sobre este treino..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            data-testid="input-comment"
          />
          <button
            className="btn-gold w-full py-2 mt-2 text-sm font-bold"
            onClick={handleSaveComment}
            data-testid="button-save-comment"
          >
            Salvar Comentário
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Play className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            VÍDEOS
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Biblioteca de movimentos e recordes</p>
      </div>

      {/* Videos List */}
      <div className="mx-4 space-y-3" data-testid="list-videos">
        {videos.map((video) => (
          <button
            key={video.id}
            className="w-full card-dark border border-[#2A2A2A] p-4 text-left transition-all hover:border-[#F5B700]/40"
            onClick={() => setSelectedVideo(video)}
            data-testid={`card-video-${video.id}`}
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-20 h-14 bg-[#0A0A0A] rounded-lg flex items-center justify-center border border-[#2A2A2A] flex-shrink-0">
                <Play className="text-[#F5B700]" size={22} fill="#F5B700" />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {video.isRecord && (
                    <Crown className="text-[#F5B700] flex-shrink-0" size={14} />
                  )}
                  <p className="text-white font-semibold text-sm leading-tight truncate">
                    {video.title}
                  </p>
                </div>
                <p className="text-gray-400 text-xs">{video.date}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${
                  video.modality === "RAW"
                    ? "bg-[#F5B700]/20 text-[#F5B700]"
                    : "bg-orange-500/20 text-orange-400"
                }`}>
                  {video.modality}
                </span>
                {video.isRecord && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full ml-1 bg-[#F5B700] text-black font-bold">
                    RECORDE
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}
