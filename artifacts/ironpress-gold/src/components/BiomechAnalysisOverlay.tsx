import { useState, useRef } from "react";
import { X, AlertTriangle, CheckCircle, Activity, Clock, Info } from "lucide-react";
import { sampleVideoFrames } from "../services/biomech/videoSampler";
import { computeBenchMetrics } from "../services/biomech/benchMetrics";
import { buildReport, BiomechReport } from "../services/biomech/reportBuilder";
import { db } from "../services/db/db";

interface Props {
  videoId: number;
  videoTitle: string;
  onClose: () => void;
}

export default function BiomechAnalysisOverlay({ videoId, videoTitle, onClose }: Props) {
  const [stage, setStage] = useState<"idle" | "loading-model" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<BiomechReport | null>(null);
  const [pastReports, setPastReports] = useState<{ id: number; score: number; createdAt: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function loadHistory() {
    const records = await db.analysis.where("videoId").equals(videoId).reverse().sortBy("createdAt");
    setPastReports(records.map(r => ({ id: r.id!, score: r.score, createdAt: r.createdAt })));
    setShowHistory(true);
  }

  async function startAnalysis(file: File) {
    if (!videoRef.current) return;
    const url = URL.createObjectURL(file);
    videoRef.current.src = url;

    setStage("loading-model");
    setProgress(5);

    try {
      await new Promise<void>((resolve, reject) => {
        videoRef.current!.onloadedmetadata = () => resolve();
        videoRef.current!.onerror = () => reject(new Error("Erro ao carregar vídeo"));
      });

      setStage("processing");

      const frames = await sampleVideoFrames(
        videoRef.current,
        (pct) => setProgress(10 + pct * 0.85),
        5
      );

      setProgress(96);
      const metrics = computeBenchMetrics(frames);
      const result = buildReport(metrics, frames.length);
      setReport(result);

      await db.analysis.add({
        videoId,
        title: videoTitle,
        score: result.score,
        flags: result.flags,
        report: result.summary,
        keyAngles: {
          leftElbow: result.metrics.avgLeftElbow,
          rightElbow: result.metrics.avgRightElbow,
          symmetry: result.metrics.symmetry,
          pauseDetected: result.metrics.pauseDetected,
        },
        framesAnalyzed: frames.length,
        createdAt: Date.now(),
      });

      setProgress(100);
      setStage("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
      setStage("error");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startAnalysis(file);
  }

  const scoreColor = !report ? "#F5B700" : report.score >= 85 ? "#4ade80" : report.score >= 65 ? "#F5B700" : "#ef4444";

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Hidden video element for processing */}
      <video ref={videoRef} className="hidden" playsInline muted crossOrigin="anonymous" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <Activity className="text-[#F5B700]" size={20} />
          <span className="text-white font-bold text-sm">Análise Biomecânica</span>
        </div>
        <button onClick={onClose} data-testid="button-close-biomech">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Warning */}
        <div className="bg-[#1A1A1A] border border-[#F5B700]/20 rounded-xl p-3 flex items-start gap-2">
          <Info size={16} className="text-[#F5B700] flex-shrink-0 mt-0.5" />
          <p className="text-gray-400 text-xs">
            <span className="text-[#F5B700] font-semibold">Análise estimada</span> – posicione a câmera <strong>lateral</strong> ou <strong>45°</strong> para melhor precisão. Resultados são orientativos, não substitutos de avaliação presencial.
          </p>
        </div>

        {stage === "idle" && (
          <div className="space-y-3">
            <p className="text-white text-sm text-center">Selecione o vídeo do dispositivo para analisar</p>
            <button
              className="btn-gold w-full py-4 flex items-center justify-center gap-2 font-black text-sm"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-video-analyze"
            >
              <Activity size={20} />
              Selecionar Vídeo e Analisar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              className="btn-gold-outline w-full py-2.5 text-sm"
              onClick={loadHistory}
              data-testid="button-show-history"
            >
              Ver Análises Anteriores
            </button>
          </div>
        )}

        {(stage === "loading-model" || stage === "processing") && (
          <div className="space-y-4 text-center py-4">
            <div className="w-24 h-24 rounded-full border-4 border-[#F5B700]/20 border-t-[#F5B700] animate-spin mx-auto" />
            <p className="text-[#F5B700] font-bold">
              {stage === "loading-model" ? "Carregando modelo de IA..." : "Processando frames..."}
            </p>
            <div className="w-full bg-[#1A1A1A] rounded-full h-3 border border-[#2A2A2A]">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #F5B700, #FF8C00)" }}
              />
            </div>
            <p className="text-gray-400 text-sm">{Math.round(progress)}% concluído</p>
            <p className="text-gray-500 text-xs">O processamento pode levar alguns segundos conforme o tamanho do vídeo.</p>
          </div>
        )}

        {stage === "error" && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-center space-y-3">
            <AlertTriangle className="text-red-400 mx-auto" size={40} />
            <p className="text-red-300 font-semibold">Erro na análise</p>
            <p className="text-gray-400 text-sm">{errorMsg}</p>
            <button className="btn-gold-outline w-full py-2" onClick={() => setStage("idle")}>
              Tentar Novamente
            </button>
          </div>
        )}

        {stage === "done" && report && (
          <div className="space-y-4">
            {/* Score */}
            <div className="card-dark border border-[#2A2A2A] p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Score de Execução</p>
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto"
                style={{ borderColor: scoreColor, background: `${scoreColor}15` }}
              >
                <span className="font-black text-3xl" style={{ color: scoreColor }}>{report.score}</span>
              </div>
              <p className="text-gray-300 text-xs mt-2">de 100 pontos</p>
              <p className="text-gray-200 text-sm mt-3">{report.summary}</p>
            </div>

            {/* Key metrics */}
            <div className="card-dark border border-[#2A2A2A] p-4">
              <h4 className="text-[#F5B700] font-bold text-sm uppercase tracking-wider mb-3">Métricas Principais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Cotovelo Esq.</p>
                  <p className="text-white font-bold text-lg">{report.metrics.avgLeftElbow.toFixed(1)}°</p>
                </div>
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Cotovelo Dir.</p>
                  <p className="text-white font-bold text-lg">{report.metrics.avgRightElbow.toFixed(1)}°</p>
                </div>
                <div className="bg-[#0A0A0A] rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Simetria</p>
                  <p className="font-bold text-lg" style={{ color: report.metrics.symmetry < 8 ? "#4ade80" : "#ef4444" }}>
                    {report.metrics.symmetry.toFixed(1)}°
                  </p>
                </div>
                <div className="bg-[#0A0A0A] rounded-xl p-3 flex items-center gap-2">
                  <Clock size={14} className={report.metrics.pauseDetected ? "text-green-400" : "text-red-400"} />
                  <div>
                    <p className="text-gray-400 text-xs">Pausa</p>
                    <p className="font-bold text-sm" style={{ color: report.metrics.pauseDetected ? "#4ade80" : "#ef4444" }}>
                      {report.metrics.pauseDetected ? `${(report.metrics.pauseDurationMs / 1000).toFixed(1)}s` : "Não detectada"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {report.strengths.length > 0 && (
              <div className="card-dark border border-green-800/30 p-4">
                <h4 className="text-green-400 font-bold text-sm mb-2 flex items-center gap-1">
                  <CheckCircle size={15} /> Pontos Fortes
                </h4>
                {report.strengths.map((s, i) => (
                  <p key={i} className="text-gray-200 text-sm py-1">• {s}</p>
                ))}
              </div>
            )}

            {/* Flags */}
            {report.flags.length > 0 && (
              <div className="card-dark border border-yellow-800/30 p-4">
                <h4 className="text-[#F5B700] font-bold text-sm mb-2 flex items-center gap-1">
                  <AlertTriangle size={15} /> Atenção
                </h4>
                {report.flags.map((f, i) => (
                  <p key={i} className="text-gray-200 text-sm py-1">• {f}</p>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {report.suggestions.length > 0 && (
              <div className="card-dark border border-blue-800/30 p-4">
                <h4 className="text-blue-400 font-bold text-sm mb-2">Sugestões</h4>
                {report.suggestions.map((s, i) => (
                  <p key={i} className="text-gray-200 text-sm py-1">• {s}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 btn-gold py-2.5 text-sm font-bold" onClick={() => { setStage("idle"); setReport(null); setProgress(0); }}>
                Reanalisar
              </button>
              <button className="flex-1 btn-gold-outline py-2.5 text-sm" onClick={loadHistory}>
                Histórico
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && (
          <div className="card-dark border border-[#2A2A2A] p-4">
            <h4 className="text-[#F5B700] font-bold text-sm mb-3 uppercase tracking-wider">
              Análises Anteriores
            </h4>
            {pastReports.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">Nenhuma análise encontrada</p>
            ) : (
              pastReports.map(r => (
                <div key={r.id} className="bg-[#0A0A0A] rounded-xl p-3 mb-2 flex items-center justify-between border border-[#2A2A2A]">
                  <div>
                    <p className="text-gray-300 text-xs">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: r.score >= 85 ? "#4ade80" : r.score >= 65 ? "#F5B700" : "#ef4444" }}
                  >
                    <span className="font-black text-sm" style={{ color: r.score >= 85 ? "#4ade80" : r.score >= 65 ? "#F5B700" : "#ef4444" }}>
                      {r.score}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
