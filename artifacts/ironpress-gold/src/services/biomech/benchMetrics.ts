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
      pauseDetected: false, pauseDurationMs: 0, repCount: 0,
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

  const PAUSE_THRESHOLD = 0.02;
  let pauseStart = -1;
  let pauseDurationMs = 0;
  for (let i = 0; i < speeds.length; i++) {
    const wristY = wristYs[i + 1];
    const nearBottom = wristY < minY + (maxY - minY) * 0.3;
    if (nearBottom && Math.abs(speeds[i]) < PAUSE_THRESHOLD) {
      if (pauseStart === -1) pauseStart = i;
    } else {
      if (pauseStart !== -1) {
        pauseDurationMs += frames[i + 1].timestampMs - frames[pauseStart].timestampMs;
        pauseStart = -1;
      }
    }
  }

  // Count reps: count direction changes in wrist Y
  let repCount = 0;
  let direction = 0;
  for (const s of speeds) {
    const newDir = s > 0.05 ? 1 : s < -0.05 ? -1 : 0;
    if (newDir !== 0 && newDir !== direction) {
      if (direction !== 0) repCount++;
      direction = newDir;
    }
  }
  repCount = Math.floor(repCount / 2);

  return {
    leftElbowAngles,
    rightElbowAngles,
    avgLeftElbow: avgLeft,
    avgRightElbow: avgRight,
    symmetry,
    wristVerticalSpeeds: speeds,
    pauseDetected: pauseDurationMs > 500,
    pauseDurationMs,
    repCount,
    minBarPosition: minY,
    maxBarPosition: maxY,
  };
}
