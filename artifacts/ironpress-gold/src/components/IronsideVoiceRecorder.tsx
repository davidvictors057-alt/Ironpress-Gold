import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, Waves, AlertTriangle } from 'lucide-react';

export interface AudioPayload {
  text: string;
  audioBase64?: string;
  mimeType?: string;
}

interface IronsideVoiceRecorderProps {
  onTranscription: (payload: AudioPayload) => void;
  isLoading?: boolean;
}

export const IronsideVoiceRecorder: React.FC<IronsideVoiceRecorderProps> = ({ onTranscription, isLoading }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const getSupportedMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/aac', 'audio/wav'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    setErrorMessage(null);
    
    if (!window.isSecureContext) {
      setErrorMessage("Microfone bloqueado: O navegador exige uma conexão segura (HTTPS) para gravar áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawVisualizer();
    } catch (err: any) {
      console.error("Mic Error:", err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage("Permissão negada: O acesso ao microfone foi recusado ou bloqueado nas configurações do site.");
      } else if (err.name === 'NotFoundError') {
        setErrorMessage("Microfone não encontrado: Verifique se o dispositivo está conectado.");
      } else {
        setErrorMessage("Erro de áudio: Não foi possível iniciar a gravação cinemática.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = '#F5B700';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    try {
      const base64 = await blobToBase64(audioBlob);
      onTranscription({
        text: `[ÁUDIO ANALISADO v4.2] Atleta Ironside enviou narração pedagógica de ${formatTime(recordingTime)}.`,
        audioBase64: base64,
        mimeType: audioBlob.type
      });
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (err) {
      console.error("Falha ao processar áudio para Base64:", err);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Balão de Status durante gravação */}
      {isRecording && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#1A1A1A] border border-amber-500/30 rounded-xl p-2 shadow-2xl flex flex-col items-center gap-2">
          <canvas ref={canvasRef} width={180} height={30} className="w-full opacity-80" />
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-[10px] font-black text-amber-500 uppercase">Gravação Elite</span>
            <span className="text-[10px] font-mono text-white">{Math.floor(recordingTime/60)}:{ (recordingTime%60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {/* Mensagem de Erro / Aviso de Segurança */}
      {errorMessage && (
        <div className="absolute bottom-full mb-4 left-0 w-64 bg-red-900/90 border border-red-500/50 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
            <div className="flex-1">
              <p className="text-[10px] font-black text-white uppercase tracking-wider mb-1">Erro de Entrada</p>
              <p className="text-[10px] text-red-200 leading-tight">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-white/50 hover:text-white uppercase text-[8px] font-black">Fechar</button>
          </div>
        </div>
      )}

      {/* Interface Compacta */}
      <div className="flex items-center gap-2">
        {!audioUrl ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
            className={`p-3 rounded-xl transition-all z-20 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-amber-500 hover:bg-amber-500/10'}`}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-500/10 p-1 rounded-xl border border-amber-500/30 z-20" onClick={e => e.stopPropagation()}>
             <button type="button" onClick={(e) => { e.stopPropagation(); setAudioUrl(null); setAudioBlob(null); }} className="p-2 text-gray-500 hover:text-red-500">
               <Trash2 size={16} />
             </button>
             <button type="button" onClick={(e) => { e.stopPropagation(); handleSend(); }} disabled={isLoading} className="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
               {isLoading ? '...' : <><Send size={12} /> Sincronizar</>}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
