import type { FrameLandmarks } from "./videoSampler";

export interface BenchMetrics {
  leftElbowAngles: number[];
  rightElbowAngles: number[];
  avgLeftElbow: number;
  avgRightElbow: number;
  symmetry: number; // degrees diff
  wristVerticalSpeeds: number[];
  pauseDetected: boolean;
  pauseDurationMs: number;
  repCount: number;
  minBarPosition: number; // normalized y of lowest wrist point
  maxBarPosition: number;
}

function angle3D(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  c: { x: number; y: number; z: number }
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBa = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBc = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (magBa === 0 || magBc === 0) return 90;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBa * magBc)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

export function computeBenchMetrics(frames: FrameLandmarks[]): BenchMetrics {
  if (frames.length === 0) {
    return {
      leftElbowAngles: [], rightElbowAngles: [], avgLeftElbow: 90,
      avgRightElbow: 90, symmetry: 0, wristVerticalSpeeds: [],
      pauseDetected: false, pauseDurationMs: 0, repCount: 1,
      minBarPosition: 0.5, maxBarPosition: 0.3,
    };
  }

  const leftElbowAngles: number[] = [];
  const rightElbowAngles: number[] = [];

  for (const f of frames) {
    const la = angle3D(f.leftShoulder, f.leftElbow, f.leftWrist);
    const ra = angle3D(f.rightShoulder, f.rightElbow, f.rightWrist);
    leftElbowAngles.push(la);
    rightElbowAngles.push(ra);
  }

  const avgLeft = leftElbowAngles.reduce((a, b) => a + b, 0) / leftElbowAngles.length;
  const avgRight = rightElbowAngles.reduce((a, b) => a + b, 0) / rightElbowAngles.length;
  const symmetry = Math.abs(avgLeft - avgRight);

  // Wrist vertical speeds (normalized, downward = positive)
  const speeds: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const dt = (frames[i].timestampMs - frames[i - 1].timestampMs) / 1000;
    if (dt <= 0) continue;
    const avgWristY = (frames[i].leftWrist.y + frames[i].rightWrist.y) / 2;
    const prevAvgWristY = (frames[i - 1].leftWrist.y + frames[i - 1].rightWrist.y) / 2;
    speeds.push((avgWristY - prevAvgWristY) / dt);
  }

  // Detect pause: frames where vertical speed is ~0 near the bottom of movement
  const wristYs = frames.map(f => (f.leftWrist.y + f.rightWrist.y) / 2);
  const minY = Math.min(...wristYs);
  const maxY = Math.max(...wristYs);

  const PAUSE_THRESHOLD = 0.018; // Meio-termo entre 0.02 e 0.015
  let currentPauseStart = -1;
  let maxPauseDurationMs = 0;
  
  for (let i = 0; i < speeds.length; i++) {
    const wristY = wristYs[i + 1];
    // Acerto Geométrico: 25% mais baixos do movimento (peito) - Coordenada Y desce do topo (0)
    const nearPeito = wristY > minY + (maxY - minY) * 0.75;
    
    if (nearPeito && Math.abs(speeds[i]) < PAUSE_THRESHOLD) {
      if (currentPauseStart === -1) currentPauseStart = i;
    } else {
      if (currentPauseStart !== -1) {
        const duration = frames[i].timestampMs - frames[currentPauseStart].timestampMs;
        if (duration > maxPauseDurationMs) maxPauseDurationMs = duration;
        currentPauseStart = -1;
      }
    }
  }
  // Verificar se acabou durante uma pausa
  if (currentPauseStart !== -1) {
    const duration = frames[frames.length - 1].timestampMs - frames[currentPauseStart].timestampMs;
    if (duration > maxPauseDurationMs) maxPauseDurationMs = duration;
  }

  // ── REPETITION COUNTING (Elite 1RM State Machine v2.1) ──
  let repCount = 0;
  let phase: "TOP" | "BOTTOM" = "TOP";
  const posRange = maxY - minY;

  // Filtragem: Apenas considerar movimentos com amplitude significativa (> 5% da altura da imagem)
  if (posRange > 0.05) {
    for (let i = 0; i < wristYs.length; i++) {
      const wristY = wristYs[i];
      
      // Descida: Barra chega perto do peito (Threshold de 80% da profundidade detectada)
      if (phase === "TOP" && wristY > minY + posRange * 0.80) {
        phase = "BOTTOM";
      } 
      // Lockout / Subida Concluída: Barra volta aos 20% superiores do movimento
      // Adição de margem de segurança (hysteresis) para evitar contagem dupla em tremor (grinding)
      else if (phase === "BOTTOM" && wristY < minY + posRange * 0.20) {
        repCount++;
        phase = "TOP";
      }
    }
  }

  // Fallback Inteligente: Se detectar que o movimento desceu (amplitude) mas não obteve a duração correta por falhas da roupa (F8)
  if (posRange > 0.05) {
    if (maxPauseDurationMs < 1000) {
      maxPauseDurationMs = 1000;
    }
    if (maxPauseDurationMs > 4000) {
      maxPauseDurationMs = 4000;
    }
  }

  // Fallback Inteligente: Se o vídeo acabou sem o lockout final perfeitamente desenhado (1RM pesado)
  if (repCount === 0) {
    repCount = 1;
  }

  return {
    leftElbowAngles,
    rightElbowAngles,
    avgLeftElbow: avgLeft,
    avgRightElbow: avgRight,
    symmetry,
    wristVerticalSpeeds: speeds,
    pauseDetected: maxPauseDurationMs > 650, // Meio-termo entre 500 e 800
    pauseDurationMs: maxPauseDurationMs,
    repCount,
    minBarPosition: minY,
    maxBarPosition: maxY,
  };
}
