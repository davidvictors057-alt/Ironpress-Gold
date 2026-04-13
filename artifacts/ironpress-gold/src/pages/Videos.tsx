import { useState, useEffect } from "react";
import { Play, Crown, Share2, X, MessageSquare, Activity, Plus, Trash2, Database, Clock, Flame } from "lucide-react";
import BiomechAnalysisOverlay from "../components/BiomechAnalysisOverlay";
import { supabase } from "../lib/supabase";
import VideoUploadModal from "../components/VideoUploadModal.tsx";
import { copyToClipboard, cleanTextForSharing, openWhatsApp } from "../lib/utils";

interface VideoRecord {
  id: string;
  title: string;
  date: string;
  modality: string;
  isRecord: boolean;
  storage_path?: string;
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

  const shareVideoData = async () => {
    const textToShare = `*REGISTRO IRONSIDE ELITE* 📹
*Atleta/Treino*: ${video.title}
*Data*: ${video.date}
*Modalidade*: ${video.modality}
*Status*: ${video.isRecord ? '🏆 Personal Record (PR)' : 'Treino de rotina'}

*Bloco de Anotações:*
${comment || "Sem observações anexadas."}

_Powered by Laboratório de Biomecânica Ironside_`;

    const cleanedText = cleanTextForSharing(textToShare);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vídeo Ironside: ${video.title}`,
          text: cleanedText
        });
      } catch (err) {
        openWhatsApp(cleanedText);
      }
    } else {
      openWhatsApp(cleanedText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {video.isRecord && <Crown className="text-[#F5B700]" size={18} />}
          <span className="text-white font-bold text-sm truncate max-w-[220px]">{video.title}</span>
        </div>
        <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
      </div>

      <div className="mx-4 mt-6 bg-[#050505] rounded-3xl border border-white/5 aspect-video max-h-[40vh] sm:max-h-[50vh] relative overflow-hidden group shadow-2xl flex items-center justify-center">
        {video.storage_path ? (
          <video 
            src={supabase.storage.from('videos').getPublicUrl(video.storage_path).data.publicUrl} 
            className="w-full h-full object-contain" 
            controls 
            playsInline
          />
        ) : (
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F5B700]/10 border border-[#F5B700]/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(245,183,0,0.1)]">
              <Play className="text-[#F5B700] ml-1" size={32} fill="#F5B700" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Visualização Não Disponível</p>
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 space-y-2 flex-1 overflow-y-auto pb-4">
        <button
          className="w-full bg-[#F5B700] text-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-[#F5B700]/10"
          onClick={onAnalyze}
        >
          <Activity size={18} />
          Análise de Performance
        </button>

        <div className="flex gap-2">
          <button
            className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest border border-white/5 transition-all"
            onClick={shareVideoData}
          >
            <Share2 size={16} className="text-[#F5B700]" />
            Compartilhar Dados
          </button>
        </div>

        <div className="bg-black/40 p-4 border border-white/5 rounded-2xl">
          <p className="text-[#F5B700] text-[9px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <MessageSquare size={13} />
            Bloco de Notas
          </p>
          <textarea
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#F5B700] transition-colors"
            placeholder="Anotações técnicas sobre a execução..."
            value={comment}
            onChange={e => { setComment(e.target.value); setSavedMsg(""); }}
            rows={3}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">{savedMsg}</p>
            <button className="bg-[#F5B700] text-black px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest" onClick={handleSaveComment}>
              Salvar
            </button>
          </div>
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchVideos();
  }, []);

  async function fetchProfile() {
    const { persistence } = await import("../lib/persistence");
    const p = await persistence.loadProfile();
    setProfile(p);
  }

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
      console.error("Erro ao carregar vdeos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVideo(id: string) {
    try {
      const videoToDelete = videos.find(v => v.id === id);
      if (videoToDelete?.storage_path) {
        await supabase.storage.from('videos').remove([videoToDelete.storage_path]);
      }
      
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== id));
      setDeletingId(null);
    } catch (error) {
      alert("Erro ao excluir registro.");
    }
  }

  return (
    <div className="pb-6 space-y-4">
      <div className="px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 sm:p-4 bg-[#F5B700]/10 rounded-2xl border border-[#F5B700]/20 flex-shrink-0 shadow-[0_0_20px_rgba(245,183,0,0.05)]">
              <Database className="text-[#F5B700]" size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-col text-2xl sm:text-4xl font-black text-white tracking-tighter leading-[0.8] mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                <span>LABORATÓRIO DE</span>
                <span className="text-[#F5B700]">BIOMECÂNICA</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-[#F5B700] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:pl-3 sm:border-l-2 border-[#F5B700]/30 py-1">
                  Bio-Engenharia
                </p>
                <div className="h-1.5 w-1.5 rounded-full bg-[#F5B700]/30 hidden sm:block" />
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Hub Neural Ironside</span>
              </div>
            </div>
          </div>
          
          <button
            className="w-full bg-[#F5B700] text-black px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-[#F5B700]/10 hover:bg-[#FF8C00] transition-colors active:scale-95"
            onClick={() => setShowAddVideo(true)}
          >
            <Plus size={20} />
            Novo Registro
          </button>
        </div>
      </div>

      <div className="mx-4 sm:mx-6 grid grid-cols-1 gap-4">
        {videos.map(video => (
          <div
            key={video.id}
            className="group card-dark border border-white/5 p-4 sm:p-6 relative transition-all hover:border-[#F5B700]/30 bg-[#0A0A0A] rounded-[2rem]"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#F5B700]/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="grid grid-cols-[60px_1fr_90px] sm:grid-cols-[100px_1fr_110px] items-center gap-3 sm:gap-6 relative z-10 w-full">
              <button
                className="w-14 h-14 sm:w-24 sm:h-20 bg-black rounded-xl flex items-center justify-center border border-white/5 flex-shrink-0 relative overflow-hidden group/thumb"
                onClick={() => setSelectedVideo(video)}
              >
                {video.storage_path && (
                  <video 
                    src={supabase.storage.from('videos').getPublicUrl(video.storage_path).data.publicUrl} 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/thumb:opacity-60 transition-opacity"
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Play className="text-[#F5B700] relative z-10 drop-shadow-lg" size={20} fill="#F5B700" />
              </button>

              <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden" onClick={() => setSelectedVideo(video)}>
                <div className="flex items-center gap-1.5 mb-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
                  {video.isRecord && (
                    <div className="relative group/flame">
                      <Flame className="text-[#F5B700] flex-shrink-0 animate-pulse" size={14} />
                      <div className="absolute inset-0 bg-[#F5B700] blur-md opacity-20 group-hover/flame:opacity-50 transition-opacity" />
                    </div>
                  )}
                  <p className="text-white font-black text-xs sm:text-sm uppercase tracking-tight truncate w-full">{video.title}</p>
                </div>
                <div className="flex flex-col items-start gap-1 w-full mt-1.5">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold tracking-wider bg-white/5 px-2 py-0.5 rounded-full w-fit">
                    <Clock size={10} className="text-[#F5B700]" /> {video.date}
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black border tracking-widest uppercase w-fit shrink-0 ${
                    video.modality?.toUpperCase().includes("RAW") 
                      ? "border-[#F5B700]/40 text-[#F5B700] bg-[#F5B700]/20" 
                      : "border-orange-500/40 text-orange-400 bg-orange-500/20"}`}
                  >
                    {video.modality || "RAW"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
                <button
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 hover:bg-[#F5B700] hover:text-black transition-all group active:scale-90"
                  onClick={(e) => { e.stopPropagation(); setAnalyzeVideo(video); }}
                  title="Analisar"
                >
                  <Activity size={18} className="group-hover:scale-110 transition-transform" />
                </button>
                {deletingId === video.id ? (
                  <button
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-red-500 rounded-xl border border-red-500 text-black transition-all group active:scale-90 animate-pulse"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}
                  >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 hover:bg-red-500/20 hover:text-red-400 transition-all group active:scale-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(video.id);
                      setTimeout(() => setDeletingId(null), 3000);
                    }}
                  >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {videos.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] mx-4 sm:mx-0">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="text-gray-700" size={24} />
            </div>
            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Nenhum registro no laboratório.</p>
          </div>
        )}
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onAnalyze={() => { setSelectedVideo(null); setAnalyzeVideo(selectedVideo); }}
        />
      )}

      {analyzeVideo && (
        <BiomechAnalysisOverlay
          key={analyzeVideo.id}
          videoId={analyzeVideo.id}
          videoTitle={analyzeVideo.title}
          profile={profile}
          onClose={() => {
            setAnalyzeVideo(null);
            fetchVideos();
          }}
        />
      )}



      {showAddVideo && (
        <VideoUploadModal 
          onAdd={() => {
            setShowAddVideo(false);
            fetchVideos();
          }} 
          onClose={() => setShowAddVideo(false)} 
        />
      )}
    </div>
  );
}
