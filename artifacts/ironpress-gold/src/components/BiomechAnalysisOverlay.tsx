import { useState, useRef, useEffect } from "react";
import { Activity, X, AlertTriangle, CheckCircle, Clock, Brain, FileText, BarChart3, Video, Microscope, Share2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { sampleVideoFrames, LANDMARK_IDX } from "../services/biomech/videoSampler";
import { computeBenchMetrics } from "../services/biomech/benchMetrics";
import { buildReport, BiomechReport } from "../services/biomech/reportBuilder";
import { getCoachIAFeedback } from "../services/coachAI/aiCoachService";
import { A2ARichReport } from "./A2ARichReport";
import { copyToClipboard, cleanTextForSharing, openWhatsApp } from "../lib/utils";

interface Props {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

export default function BiomechAnalysisOverlay({ videoId, videoTitle, profile, onClose }: Props & { profile: any }) {
  const [stage, setStage] = useState<"idle" | "loading-model" | "processing" | "done" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"visual" | "critical" | "biometric">("visual");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<BiomechReport | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [analyzedFrames, setAnalyzedFrames] = useState<any[]>([]);
  const [pastReports, setPastReports] = useState<{ id: string; score: number; report_summary: string; created_at: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExecutingProtocol, setIsExecutingProtocol] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  const biomechThinkingMessages = [
    "Engenheiro Biomecânico calculando braços de alavanca...",
    "Especialista analisando vetores de torção articular...",
    "Mapeando pontos críticos de torque na fase concêntrica...",
    "Sincronizando modelos GPC para validação de elite...",
    "Validando simetria cinemática via rede neural..."
  ];

  useEffect(() => {
    let interval: any;
    if (stage === "loading-model" || stage === "processing") {
      interval = setInterval(() => {
        setStatusIdx(prev => (prev + 1) % biomechThinkingMessages.length);
      }, 2000);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [stage]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (videoId) loadVideoFromCloud();
  }, [videoId]);

  async function loadVideoFromCloud() {
    setIsCloudLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('storage_path, modality')
        .eq('id', videoId)
        .single();
      if (error) throw error;
      if (data?.storage_path) {
        setExistingVideoPath(data.storage_path);
        localStorage.setItem(`v_modality_${videoId}`, data.modality); // Cache temporário
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(data.storage_path);
        if (urlData?.publicUrl && videoRef.current) {
          videoRef.current.src = urlData.publicUrl;
        }
      }
    } catch (err) {
      console.error("Erro ao carregar vídeo da nuvem:", err);
    } finally {
      setIsCloudLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('id, score, report_summary, created_at')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPastReports(data || []);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteAnalysis(id: string) {
    if (!confirm("Remover este diagnóstico do histórico?")) return;
    try {
      const { error } = await supabase.from('analyses').delete().eq('id', id);
      if (error) throw error;
      setPastReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Erro ao remover registro.");
    }
  }

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      if (videoRef.current && canvasRef.current && showOverlay) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const vw = video.videoWidth || video.clientWidth;
          const vh = video.videoHeight || video.clientHeight;
          if (vw !== dimensionsRef.current.width || vh !== dimensionsRef.current.height) {
            if (vw > 0 && vh > 0) {
              canvas.width = vw;
              canvas.height = vh;
              dimensionsRef.current = { width: vw, height: vh };
            }
          }
          if (stage === "done" && analyzedFrames.length > 0) {
            const currentTimeMs = video.currentTime * 1000;
            const closest = findClosestFrame(analyzedFrames, currentTimeMs);
            if (closest) drawLandmarks(closest, ctx, canvas);
          } else if (stage !== "processing") {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      } else if (canvasRef.current && !showOverlay) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [stage, analyzedFrames, showOverlay]);

  function findClosestFrame(frames: any[], timeMs: number) {
    if (!frames.length) return null;
    let low = 0, high = frames.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (frames[mid].timestampMs < timeMs) low = mid + 1;
      else high = mid;
    }
    return frames[low];
  }

  function drawLandmarks(data: any, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!data) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const getPoint = (idx: number, key: string) => {
      if (data[idx]) return data[idx];
      if (data[key]) return { ...data[key], visibility: 1 };
      return null;
    };
    const pShL = getPoint(LANDMARK_IDX.LEFT_SHOULDER, "leftShoulder");
    const pShR = getPoint(LANDMARK_IDX.RIGHT_SHOULDER, "rightShoulder");
    const pElL = getPoint(LANDMARK_IDX.LEFT_ELBOW, "leftElbow");
    const pElR = getPoint(LANDMARK_IDX.RIGHT_ELBOW, "rightElbow");
    const pWrL = getPoint(LANDMARK_IDX.LEFT_WRIST, "leftWrist");
    const pWrR = getPoint(LANDMARK_IDX.RIGHT_WRIST, "rightWrist");
    const points = [pShL, pShR, pElL, pElR, pWrL, pWrR];
    const connections = [[pShL, pElL], [pElL, pWrL], [pShR, pElR], [pElR, pWrR], [pShL, pShR]];
    ctx.strokeStyle = "#F5B700";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(245, 183, 0, 0.5)";
    connections.forEach(([p1, p2]) => {
      if (p1 && p2 && (p1.visibility ?? 1) > 0.5 && (p2.visibility ?? 1) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      }
    });
    points.forEach(p => {
      if (p && (p.visibility ?? 1) > 0.5) {
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#F5B700";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  async function executeAnalysisProtocol(url: string) {
    if (!videoRef.current || !url) return;
    setLastUrl(url);
    videoRef.current.src = url;
    setStage("loading-model");
    setProgress(5);
    try {
      if (videoRef.current.readyState < 3) {
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => { videoRef.current?.removeEventListener('canplay', onCanPlay); resolve(); };
          videoRef.current!.addEventListener('canplay', onCanPlay);
          videoRef.current!.onerror = () => reject(new Error("Erro ao carregar fluxo cinematográfico"));
          setTimeout(() => { videoRef.current?.removeEventListener('canplay', onCanPlay); resolve(); }, 5000);
        });
      }
      const realModality = localStorage.getItem(`v_modality_${videoId}`) || "RAW";
      const sampleRate = realModality === "F8" ? 1 : 3;

      const frames = await sampleVideoFrames(
        videoRef.current,
        (pct) => setProgress(10 + pct * 0.80),
        sampleRate,
        (pose) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx) drawLandmarks(pose, ctx, canvas);
        }
      );
      setProgress(92);
      setAnalyzedFrames(frames);
      const metrics = computeBenchMetrics(frames);
      const result = buildReport(metrics, frames.length);
      setReport(result);
      setProgress(95);
      
      let aiResponseText = "";
      try {
        aiResponseText = await getCoachIAFeedback(metrics, videoTitle, profile, realModality);
      } catch {
        aiResponseText = "⚠️ Hub IA offline: Métricas brutas disponíveis.";
      }
      setAiFeedback(aiResponseText);
      await supabase.from('analyses').insert({
        video_id: videoId,
        title: videoTitle,
        score: result.score,
        flags: result.flags,
        report_summary: aiResponseText || result.summary,
        key_angles: {
          leftElbow: result.metrics.avgLeftElbow,
          rightElbow: result.metrics.avgRightElbow,
          symmetry: result.metrics.symmetry,
          pauseDetected: result.metrics.pauseDetected,
        },
        frames_analyzed: frames.length,
      });
      setProgress(100);
      setStage("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Protocol Error");
      setStage("error");
    }
  }

  async function refetchAIFeedback() {
    if (!report) return;
    setAiFeedback("🧠 Sincronizando novo laudo inteligente...");
    const realModality = localStorage.getItem(`v_modality_${videoId}`) || "RAW";
    try {
      const aiResponseText = await getCoachIAFeedback(report.metrics, videoTitle, profile);
      setAiFeedback(aiResponseText);
      
      await supabase.from('analyses').insert({
        video_id: videoId,
        title: videoTitle,
        score: report.score,
        flags: report.flags,
        report_summary: aiResponseText,
        key_angles: {
          leftElbow: report.metrics.avgLeftElbow,
          rightElbow: report.metrics.avgRightElbow,
          symmetry: report.metrics.symmetry,
          pauseDetected: report.metrics.pauseDetected,
        },
        frames_analyzed: analyzedFrames.length,
      });
    } catch {
      setAiFeedback("⚠️ Falha ao reconectar com AI Hub. Mantenha o modelo anterior ativo.");
    }
  }

  async function startAnalysis(file: File) {
    executeAnalysisProtocol(URL.createObjectURL(file));
  }

  async function startAnalysisFromCloud() {
    if (!existingVideoPath || !videoRef.current) return;
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(existingVideoPath);
    if (!urlData?.publicUrl) return;
    setIsExecutingProtocol(true);
    try { await executeAnalysisProtocol(urlData.publicUrl); }
    finally { setIsExecutingProtocol(false); }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startAnalysis(file);
  }

  function resetAnalysis() {
    setStage("idle");
    setReport(null);
    setAnalyzedFrames([]);
    setAiFeedback("");
    setProgress(0);
  }

  const shareReport = async () => {
    if (!report) return;
    
    const shareText = `*LAUDO BIOMECÂNICO IRONSIDE ELITE* 🧪
*Vídeo*: ${videoTitle}
*Score de Eficiência*: ${report.score} PTS
*Angulação*: Lado Eq (${report.metrics.avgLeftElbow.toFixed(1)}°) | Lado Dir (${report.metrics.avgRightElbow.toFixed(1)}°)
*Repetições*: ${report.metrics.repCount} REP
*Pausa no Peito*: ${report.metrics.pauseDetected ? "SIM" : "NÃO"}
*Equipe A2A*: ${aiFeedback.includes("Claude") ? "Claude Opus + Gemini 3.1" : "Gemini 3.1 Pro"}

*🧠 FEEDBACK DO TREINADOR IA:*
${aiFeedback.split('---')[0].trim().replace(/<br\s*\/?>/gi, '\n')}

_Laboratório de Biomecânica Ironside_ ⚡`;

    const cleanedText = cleanTextForSharing(shareText);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ironside: ${videoTitle}`,
          text: cleanedText
        });
      } catch (err) {
        openWhatsApp(cleanedText);
      }
    } else {
      openWhatsApp(cleanedText);
    }
  };

  // A2ARichReport agora substitui a formatação manual para manter o padrão Premium

  const getProcessingText = (prog: number) => {
    if (stage === "loading-model") return "Sincronizando Rede Neural";
    if (prog < 25) return "Capturando Cinemática";
    if (prog < 50) return "Processando Bioengenharia";
    if (prog < 75) return "Mapeando Assimetrias";
    if (prog < 95) return "Filtrando Laudo Biomecânico";
    return "Analisando Técnica de Elite";
  };

  // ─── TABS CONFIG ───────────────────────────────────────────────────────────
  const tabs = [
    { id: "visual", label: "Lab Visual", icon: Video },
    { id: "critical", label: "Análise Crítica", icon: Brain },
    { id: "biometric", label: "Biometria", icon: BarChart3 },
  ] as const;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#080808]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Microscope className="text-[#F5B700]" size={18} />
            <span className="text-white font-black text-xs uppercase tracking-widest">
              Lab Biomecânica <span className="text-[#F5B700]">Elite</span>
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors group">
            <X size={20} className="text-gray-400 group-hover:text-red-400" />
          </button>
        </div>

        {/* ── STATUS BAR ── */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F5B700] animate-pulse" />
            <span className="text-gray-500 text-[9px] uppercase font-bold tracking-widest">
              Protocolo Cinemático: <span className="text-white">A.I. ACTIVE {(localStorage.getItem(`v_modality_${videoId}`) === "F8") ? "(F8 HIGH DENSITY)" : ""}</span>
            </span>
          </div>
          <span className="text-[#F5B700] text-[9px] font-mono font-bold">VER_G1.5_ELITE</span>
        </div>

        {/* ── TABS (only when done) ── */}
        {stage === "done" && (
          <div className="flex px-4 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${
                  activeTab === tab.id ? "border-[#F5B700] text-[#F5B700]" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── ALWAYS MOUNTED VIDEO PLAYER ── */}
        <div 
          className={`relative w-full bg-[#050505] ${
            (stage === "loading-model" || stage === "processing" || (stage === "done" && activeTab === "visual")) 
              ? "block" : "hidden"
          }`}
          style={{ height: stage === "done" ? "180px" : "200px", maxHeight: stage === "done" ? "180px" : "200px" }}
        >
          <video ref={videoRef} className="w-full h-full object-contain" playsInline muted crossOrigin="anonymous" disablePictureInPicture />
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full object-contain" />
          
          {(stage === "loading-model" || stage === "processing") && (
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-[8px] text-[#F5B700] font-black uppercase tracking-widest">
              Live Kinematics · <span className="text-red-400 animate-pulse">●</span> Analyzing
            </div>
          )}

          {stage === "done" && (
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <button
                onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                className="bg-black/70 hover:bg-[#F5B700] hover:text-black p-1.5 rounded text-white transition-all border border-white/10"
              >
                <Activity size={14} />
              </button>
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`p-1.5 rounded transition-all border border-white/10 ${showOverlay ? "bg-[#F5B700] text-black" : "bg-black/70 text-white"}`}
              >
                <Brain size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── IDLE STATE ── */}
        {stage === "idle" && (
          <div className="p-4 max-w-lg mx-auto space-y-4 py-8">
            {isCloudLoading ? (
              <div className="text-center p-12 text-[#F5B700] animate-pulse font-black uppercase tracking-widest text-xs">
                Carregando Stream...
              </div>
            ) : existingVideoPath ? (
              <div className="border border-[#F5B700]/30 rounded-2xl p-6 bg-gradient-to-b from-[#111] to-black text-center space-y-4">
                <div className="w-16 h-16 bg-[#F5B700] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,183,0,0.3)] animate-pulse">
                  <Activity className="text-black" size={32} />
                </div>
                <h3 className="text-white text-lg font-black uppercase tracking-tight">Protocolo de Nuvem</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Vídeo detectado na sua galeria. Iniciar análise?</p>
                <div className="flex flex-col gap-2">
                  <button
                    disabled={isExecutingProtocol}
                    onClick={startAnalysisFromCloud}
                    className="w-full bg-[#F5B700] text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isExecutingProtocol ? <><Clock className="animate-spin" size={14} /> Processando...</> : "Executar Protocolo Técnico"}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white/5 text-gray-400 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5"
                  >
                    Usar Arquivo Local
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#F5B700]/20 rounded-2xl p-12 cursor-pointer hover:border-[#F5B700]/50 hover:bg-[#F5B700]/5 transition-all text-center"
              >
                <div className="w-16 h-16 bg-black border border-[#F5B700]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Microscope className="text-[#F5B700]" size={28} />
                </div>
                <h3 className="text-white text-lg font-black uppercase mb-2">Novo Diagnóstico</h3>
                <p className="text-gray-500 text-xs mb-6 leading-relaxed">Solte sua gravação para análise de força e simetria.</p>
                <div className="inline-flex items-center gap-2 bg-[#F5B700] text-black px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                  <Video size={14} /> Enviar Vídeo
                </div>
              </div>
            )}
            <button
              onClick={loadHistory}
              className="w-full bg-white/5 text-gray-500 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-[#F5B700] transition-colors border border-white/5"
            >
              Consultar Histórico
            </button>
          </div>
        )}

        {/* ── PROCESSING STATE ── */}
        {(stage === "loading-model" || stage === "processing") && (
          <div className="p-4 max-w-sm mx-auto space-y-6 text-center py-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#F5B700]/10 border-t-[#F5B700] animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-[#F5B700]/5 border-b-[#F5B700] animate-spin [animation-duration:1.5s]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="text-[#F5B700] animate-pulse" size={28} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-black text-xs uppercase tracking-widest">
                {getProcessingText(progress)}
              </p>
              <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 shadow-[0_0_10px_#F5B700]"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #F5B700, #FF8C00)" }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                <span>Leitura Biomecânica: {Math.round(progress)}%</span>
                <span>Status: Ativo</span>
              </div>
              <p className="text-[#F5B700] text-[10px] font-black uppercase tracking-widest animate-pulse mt-4">
                {biomechThinkingMessages[statusIdx]}
              </p>
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {stage === "error" && (
          <div className="p-4 max-w-sm mx-auto">
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-8 text-center space-y-4">
              <AlertTriangle className="text-red-400 mx-auto" size={40} />
              <p className="text-white font-black uppercase text-sm">Erro de Protocolo</p>
              <p className="text-gray-400 text-xs">{errorMsg}</p>
              <button className="w-full bg-[#F5B700] text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest" onClick={() => setStage("idle")}>
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* ── DONE: VISUAL TAB ── */}
        {stage === "done" && report && activeTab === "visual" && (
          <div className="p-4 space-y-3 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-4 rounded-xl text-center">
                <p className="text-gray-500 text-[8px] uppercase font-black mb-1">Score Eficiência</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-3xl font-black text-white">{report.score}</span>
                  <span className="text-[#F5B700] text-[10px] font-bold mb-1">PTS</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-4 rounded-xl text-center">
                <p className="text-gray-500 text-[8px] uppercase font-black mb-1">Reps Validadas</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-3xl font-black text-white">{report.metrics.repCount}</span>
                  <span className="text-green-500 text-[10px] font-bold mb-1">REP</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-4 rounded-xl">
              <p className="text-gray-500 text-[8px] uppercase font-black mb-3">Diagnóstico Integrado</p>
              <A2ARichReport rawText={aiFeedback || report.summary} />
            </div>

            {report.flags.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                <p className="text-[#F5B700] text-[8px] font-black uppercase mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Alertas
                </p>
                <ul className="space-y-1">
                  {report.flags.map((f, i) => <li key={i} className="text-white text-xs flex gap-2"><span className="text-[#F5B700]">•</span>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── DONE: CRITICAL TAB ── */}
        {stage === "done" && report && activeTab === "critical" && (
          <div className="p-4 space-y-3 max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-[#111] to-black border border-[#F5B700]/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F5B700]/10 rounded-xl">
                    <Brain className="text-[#F5B700]" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xs uppercase tracking-widest">Feedback do Treinador IA</h3>
                    <p className="text-gray-500 text-[8px] uppercase font-bold">Diagnóstico por Inteligência Artificial</p>
                  </div>
                </div>
                {/* A2A Neural Status LEDs */}
                <div className="flex gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${aiFeedback.includes("CLAUDE_OPUS") ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-gray-700"}`} />
                    <span className="text-[6px] text-gray-500 font-black uppercase tracking-tighter">OPUS</span>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10 self-center" />
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${aiFeedback.includes("GEMINI_ACTIVE") ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-gray-700"}`} />
                    <span className="text-[6px] text-gray-500 font-black uppercase tracking-tighter">G-3.1</span>
                  </div>
                </div>
              </div>
              <div className="text-sm leading-relaxed">
                <A2ARichReport rawText={aiFeedback} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
                <h4 className="text-green-500 font-black text-[8px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Pontos Fortes
                </h4>
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => <li key={i} className="text-white text-xs flex gap-2"><span className="text-green-500">•</span>{s}</li>)}
                </ul>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                <h4 className="text-[#F5B700] font-black text-[8px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Pontos de Melhoria
                </h4>
                <ul className="space-y-2">
                  {report.flags.map((f, i) => <li key={i} className="text-white text-xs flex gap-2"><span className="text-[#F5B700]">•</span>{f}</li>)}
                </ul>
              </div>
            </div>
            
            {/* specialist team footer info */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
               <p className="text-gray-600 text-[8px] font-bold uppercase tracking-[0.2em]">Sincronia A2A v2.1 Ativa</p>
               <div className="flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-green-500"></div>
                 <span className="text-gray-500 text-[8px] font-black uppercase">Staff Técnico OK</span>
               </div>
            </div>
          </div>
        )}

        {/* ── DONE: BIOMETRIC TAB ── */}
        {stage === "done" && report && activeTab === "biometric" && (
          <div className="p-4 space-y-3 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Angulação Esq.", value: `${report.metrics.avgLeftElbow.toFixed(1)}°`, status: "NOMINAL" },
                { label: "Angulação Dir.", value: `${report.metrics.avgRightElbow.toFixed(1)}°`, status: "NOMINAL" },
                {
                  label: "Diferença Axial",
                  value: `${report.metrics.symmetry.toFixed(1)}°`,
                  status: report.metrics.symmetry < 8 ? "EXCELENTE" : "CRÍTICO",
                  alert: report.metrics.symmetry >= 8,
                },
                {
                  label: "Pausa no Peito",
                  value: report.metrics.pauseDetected ? `${(report.metrics.pauseDurationMs / 1000).toFixed(1)}s` : "SEM PAUSA",
                  status: report.metrics.pauseDetected ? "VÁLIDA" : "NULA",
                },
              ].map((stat, i) => (
                <div key={i} className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-4 rounded-xl">
                  <p className="text-gray-500 text-[8px] uppercase font-black tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black mb-2 ${"alert" in stat && stat.alert ? "text-red-400" : "text-white"}`}>{stat.value}</p>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-[7px] font-black border ${
                    stat.status === "OPTIMAL" || stat.status === "ACTIVE" || stat.status === "NOMINAL"
                      ? "text-green-400 border-green-400/20 bg-green-400/5"
                      : "text-red-400 border-red-400/20 bg-red-400/5"
                  }`}>{stat.status}</div>
                </div>
              ))}
            </div>

            {report.suggestions.length > 0 && (
              <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl">
                <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Reajustes Biomecânicos</h3>
                <div className="space-y-3">
                  {report.suggestions.map((s, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-start gap-3">
                      <div className="bg-[#F5B700] text-black text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0">{i + 1}</div>
                      <p className="text-gray-300 text-xs leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {showHistory && (
          <div className="p-4 max-w-2xl mx-auto">
            <div className="bg-black border border-[#2A2A2A] p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[#F5B700] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Histórico de Diagnósticos
                </h4>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {pastReports.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-8 italic">Nenhum dado encontrado para este registro.</p>
                ) : pastReports.map(r => (
                  <div key={r.id} className="bg-gradient-to-r from-[#111] to-black rounded-2xl p-4 flex gap-4 border border-white/5 relative group">
                    <div
                      className="w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center bg-black flex-shrink-0"
                      style={{ borderColor: r.score >= 85 ? "#4ade80" : r.score >= 65 ? "#F5B700" : "#ef4444" }}
                    >
                      <span className="text-[8px] font-black text-gray-500 uppercase leading-none mb-0.5">Score</span>
                      <span className="font-black text-lg" style={{ color: r.score >= 85 ? "#4ade80" : r.score >= 65 ? "#F5B700" : "#ef4444" }}>
                        {r.score}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest mb-1">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")} · {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-gray-300 text-[10px] leading-tight line-clamp-2 italic">
                        "{r.report_summary}"
                      </p>
                    </div>
                    <button 
                      onClick={() => deleteAnalysis(r.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM ACTION BAR (only when done) ── */}
      {stage === "done" && report && (
        <div className="flex-shrink-0 bg-[#080808] border-t border-white/10 p-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <button
              onClick={shareReport}
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-95 transition-all"
            >
              <Share2 size={18} /> Compartilhar Laudo Pro
            </button>
            <button
              onClick={refetchAIFeedback}
              title="Aprimorar Protocolo"
              className="flex-shrink-0 bg-white/5 hover:bg-white/10 text-[#F5B700] p-4 rounded-xl border border-white/10 transition-all active:scale-95"
            >
              <Activity size={18} />
            </button>
            <button
              onClick={resetAnalysis}
              title="Reiniciar"
              className="flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/20 transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
