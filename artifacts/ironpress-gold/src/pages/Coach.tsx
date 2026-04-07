import { useState, useEffect } from "react";
import { Users, Key, Eye, LogOut, AlertCircle, Play } from "lucide-react";
import { supabase } from "../lib/supabase";

const COACH_CODE = "123456";
const ATHLETE_CODE = "IRONSIDE2025";

function VideoListCoach() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          coach_comments (
            content
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVideos(data || []);
      
      const commentsMap: Record<string, string> = {};
      data?.forEach(v => {
        if (v.coach_comments && v.coach_comments.length > 0) {
          commentsMap[v.id] = v.coach_comments[0].content;
        }
      });
      setComments(commentsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveComment(videoId: string) {
    if (!comment.trim()) return;
    try {
      const { error } = await supabase.from('coach_comments').upsert({
        video_id: videoId,
        content: comment
      });
      if (error) throw error;
      setComments(prev => ({ ...prev, [videoId]: comment }));
      setComment("");
    } catch (e: any) {
      alert("Erro ao salvar comentário: " + e.message);
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando vídeos...</div>;
  if (videos.length === 0) return <div className="text-center py-10 text-gray-400">Nenhum vídeo disponível.</div>;

  return (
    <div className="space-y-3">
      {videos.map(video => (
        <div key={video.id} className="card-dark border border-[#2A2A2A] p-3" data-testid={`coach-video-${video.id}`}>
          <div className="flex gap-3">
            <div className="w-16 h-12 bg-[#0A0A0A] rounded-lg flex items-center justify-center border border-[#2A2A2A] flex-shrink-0">
              <Play className="text-[#F5B700]" size={18} fill="#F5B700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{video.title}</p>
              <p className="text-gray-400 text-xs">{video.date}</p>
              <span className="text-xs text-[#F5B700]">{video.modality}</span>
            </div>
          </div>
          {selected?.id === video.id ? (
            <div className="mt-2">
              <textarea
                className="w-full bg-[#0A0A0A] border border-[#F5B700]/30 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#F5B700]"
                placeholder="Comentário do treinador..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                data-testid={`textarea-coach-comment-${video.id}`}
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  className="btn-gold flex-1 py-1.5 text-xs font-bold"
                  onClick={() => { saveComment(video.id); setSelected(null); }}
                  data-testid={`button-save-coach-comment-${video.id}`}
                >
                  Salvar
                </button>
                <button
                  className="btn-gold-outline flex-1 py-1.5 text-xs"
                  onClick={() => setSelected(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              {comments[video.id] && (
                <div className="mt-2 bg-[#0A0A0A] rounded-lg p-2 border border-[#F5B700]/20">
                  <p className="text-gray-300 text-xs">{comments[video.id]}</p>
                </div>
              )}
              <button
                className="btn-gold-outline w-full py-1.5 text-xs mt-2 font-semibold"
                onClick={() => setSelected(video)}
                data-testid={`button-add-comment-${video.id}`}
              >
                Adicionar Comentário
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Coach() {
  const [coachMode, setCoachMode] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [codeTimer] = useState("7 dias");
  const [coachLog, setCoachLog] = useState<any[]>([]);

  useEffect(() => {
    fetchCoachLog();
  }, []);

  async function fetchCoachLog() {
    try {
      const { data, error } = await supabase
        .from('coach_access')
        .select('*')
        .order('accessed_at', { ascending: false });
      if (error) throw error;
      setCoachLog(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function generateCode() {
    setAccessCode(ATHLETE_CODE);
    // TODO: Registrar geração de código no Supabase se necessário
  }

  async function enterCoachMode() {
    if (code === COACH_CODE) {
      setCoachMode(true);
      setCodeError(false);
      // Registrar acesso
      try {
        await supabase.from('coach_access').insert({
          coach_name: "Treinador Demo",
          action: "Acessou galeria de vídeos"
        });
        fetchCoachLog();
      } catch (e) {
        console.error(e);
      }
    } else {
      setCodeError(true);
    }
  }

  return (
    <div className="pb-6 space-y-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Users className="text-[#F5B700]" size={22} />
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            TREINADOR
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Colaboração atleta-treinador</p>
      </div>

      {!coachMode ? (
        <>
          {/* Athlete Mode */}
          <div className="mx-4 card-dark border border-[#F5B700]/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="text-[#F5B700]" size={18} />
              <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider">
                Modo Atleta
              </h3>
            </div>

            <button
              className="btn-gold w-full py-2.5 font-bold text-sm mb-3"
              onClick={generateCode}
              data-testid="button-generate-code"
            >
              Gerar Código de Acesso
            </button>

            {accessCode && (
              <div className="bg-[#0A0A0A] rounded-xl p-4 border border-[#F5B700]/40 text-center mb-3">
                <p className="text-gray-400 text-xs mb-1">Código de Acesso</p>
                <p className="text-[#F5B700] font-black text-2xl tracking-widest">{accessCode}</p>
                <p className="text-gray-500 text-xs mt-1">Válido por {codeTimer}</p>
              </div>
            )}

            {/* Coach Log */}
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Log de Acessos do Treinador
            </h4>
            <div className="space-y-2">
              {coachLog.map(log => (
                <div key={log.id} className="bg-[#0A0A0A] rounded-lg p-3 border border-[#2A2A2A]" data-testid={`log-entry-${log.id}`}>
                  <div className="flex justify-between items-start">
                    <p className="text-gray-200 text-sm">{log.coach_name}</p>
                    <p className="text-gray-500 text-xs">{new Date(log.accessed_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{log.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Mode Entry */}
          <div className="mx-4 card-dark border border-[#2A2A2A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="text-[#F5B700]" size={18} />
              <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider">
                Entrar como Treinador
              </h3>
            </div>
            <p className="text-gray-400 text-xs mb-3">Use o código fornecido pelo atleta para acessar os vídeos.</p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-[#0A0A0A] border border-[#F5B700]/30 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5B700] tracking-widest"
                placeholder="000000"
                maxLength={10}
                value={code}
                onChange={e => { setCode(e.target.value); setCodeError(false); }}
                onKeyDown={e => e.key === "Enter" && enterCoachMode()}
                data-testid="input-coach-code"
              />
              <button
                className="btn-gold px-4 py-2.5 font-bold text-sm rounded-xl"
                onClick={enterCoachMode}
                data-testid="button-enter-coach-mode"
              >
                Entrar
              </button>
            </div>
            {codeError && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="text-red-400" size={14} />
                <p className="text-red-400 text-xs">Código inválido. Tente "123456" para demo.</p>
              </div>
            )}
            <p className="text-gray-600 text-xs mt-2 text-center">Demo: use o código 123456</p>
          </div>
        </>
      ) : (
        <>
          {/* Coach Active Mode */}
          <div className="mx-4 bg-[#F5B700]/10 border border-[#F5B700]/50 rounded-xl p-3 flex items-center justify-between" data-testid="banner-coach-mode">
            <div className="flex items-center gap-2">
              <Eye className="text-[#F5B700]" size={18} />
              <div>
                <p className="text-[#F5B700] font-bold text-sm">Modo Treinador Ativo</p>
                <p className="text-gray-400 text-xs">Visualização limitada — apenas vídeos e comentários</p>
              </div>
            </div>
            <button
              className="btn-gold-outline py-1.5 px-3 text-xs flex items-center gap-1"
              onClick={() => { setCoachMode(false); setCode(""); }}
              data-testid="button-exit-coach-mode"
            >
              <LogOut size={12} />
              Sair
            </button>
          </div>

          <div className="mx-4">
            <h3 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-3">
              Vídeos do Ironside
            </h3>
            <VideoListCoach />
          </div>
        </>
      )}
    </div>
  );
}
