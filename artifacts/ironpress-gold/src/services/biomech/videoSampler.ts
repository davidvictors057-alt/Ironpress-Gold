import { getPoseLandmarker } from "./poseLandmarkerService";

export interface FrameLandmarks {
  timestampMs: number;
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftElbow: { x: number; y: number; z: number };
  rightElbow: { x: number; y: number; z: number };
  leftWrist: { x: number; y: number; z: number };
  rightWrist: { x: number; y: number; z: number };
  confidence: number;
}

export const LANDMARK_IDX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
};

export async function sampleVideoFrames(
  videoElement: HTMLVideoElement,
  onProgress: (pct: number) => void,
  sampleEveryNthFrame = 5,
  onFrame?: (landmarks: any) => void
): Promise<FrameLandmarks[]> {
  const lm = await getPoseLandmarker();
    const results: FrameLandmarks[] = [];
    const duration = videoElement.duration;
    let frameIdx = 0;
    let lastBestPose: any = null;

    return new Promise((resolve, reject) => {
      let resolved = false;

      const finalize = () => {
      if (resolved) return;
      resolved = true;
      onProgress(100);
      videoElement.pause();
      videoElement.removeEventListener("ended", finalize);
      resolve(results);
    };

    videoElement.addEventListener("ended", finalize);
    videoElement.currentTime = 0;
    videoElement.play().catch(reject);

    const processFrame = async (now: number, metadata: { mediaTime: number }) => {
      if (resolved) return;

      const currentPct = (metadata.mediaTime / duration) * 100;
      onProgress(Math.min(currentPct, 99));

      if (frameIdx % sampleEveryNthFrame === 0) {
        try {
          const result = lm.detectForVideo(
            videoElement,
            metadata.mediaTime * 1000
          );
          if (result.landmarks && result.landmarks.length > 0) {
            let bestIdx = 0;
            let bestScore = -Infinity;
            
            result.landmarks.forEach((pose, idx) => {
              const pShL = pose[LANDMARK_IDX.LEFT_SHOULDER];
              const pShR = pose[LANDMARK_IDX.RIGHT_SHOULDER];
              const pElL = pose[LANDMARK_IDX.LEFT_ELBOW];
              const pElR = pose[LANDMARK_IDX.RIGHT_ELBOW];
              if (!pShL || !pShR) return;

              // 1. Horizontal/Vertical Bias (Anti-Spotter Elite)
              const dx = Math.abs(pShL.x - pShR.x);
              const dy = Math.abs(pShL.y - pShR.y);
              const ratio = dx / (dy + 0.01);
              const ratioScore = Math.min(ratio, 5.0); // Bota peso na horizontalidade
              const yAvg = (pShL.y + pShR.y) / 2;

              // 2. Vertical Position (Athlete is at the bottom)
              const verticalScore = yAvg * 20;

              // 3. Size Bias (Athlete is closer)
              const sizeScore = dx * 15;

              // 4. Persistence
              let persistenceScore = 0;
              if (lastBestPose) {
                const prevY = (lastBestPose[LANDMARK_IDX.LEFT_SHOULDER].y + lastBestPose[LANDMARK_IDX.RIGHT_SHOULDER].y) / 2;
                persistenceScore = 1.0 / (1.0 + Math.abs(yAvg - prevY) * 20);
              }

              const totalScore = (ratioScore * 10) + (verticalScore * 1.5) + (sizeScore * 5) + (persistenceScore * 10);
              
              if (totalScore > bestScore) {
                bestScore = totalScore;
                bestIdx = idx;
              }
            });

            let pose = result.landmarks[bestIdx];
            
            // Simple Smoothing (Moving Average)
            if (lastBestPose) {
              pose = pose.map((v: any, i: number) => ({
                x: v.x * 0.7 + lastBestPose[i].x * 0.3,
                y: v.y * 0.7 + lastBestPose[i].y * 0.3,
                z: v.z * 0.7 + lastBestPose[i].z * 0.3,
                visibility: v.visibility
              }));
            }
            lastBestPose = pose;

            const lmConf = result.worldLandmarks?.[bestIdx];
            if (onFrame) onFrame(pose);
            results.push({
              timestampMs: metadata.mediaTime * 1000,
              leftShoulder: pose[LANDMARK_IDX.LEFT_SHOULDER],
              rightShoulder: pose[LANDMARK_IDX.RIGHT_SHOULDER],
              leftElbow: pose[LANDMARK_IDX.LEFT_ELBOW],
              rightElbow: pose[LANDMARK_IDX.RIGHT_ELBOW],
              leftWrist: pose[LANDMARK_IDX.LEFT_WRIST],
              rightWrist: pose[LANDMARK_IDX.RIGHT_WRIST],
              confidence: lmConf ? lmConf[LANDMARK_IDX.LEFT_SHOULDER].visibility ?? 0.5 : 0.5,
            });
          }
        } catch {}
      }
      frameIdx++;

      if (!videoElement.ended && !videoElement.paused) {
        (videoElement as any).requestVideoFrameCallback(processFrame);
      } else {
        finalize();
      }
    };

    if ("requestVideoFrameCallback" in videoElement) {
      (videoElement as any).requestVideoFrameCallback(processFrame);
    } else {
      // Fallback: sample by seeking
      fallbackSample(videoElement, lm, duration, onProgress, results).then(resolve).catch(reject);
    }
  });
}

async function fallbackSample(
  video: HTMLVideoElement,
  lm: Awaited<ReturnType<typeof getPoseLandmarker>>,
  duration: number,
  onProgress: (pct: number) => void,
  results: FrameLandmarks[]
): Promise<FrameLandmarks[]> {
  // Increase sampling density for fallback to match cinematic precision (10fps min)
  const steps = Math.min(120, Math.max(30, Math.floor(duration * 10)));
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    onProgress((i / steps) * 100);
    
    try {
      await seekTo(video, t);
      const result = lm.detectForVideo(video, t * 1000);
      
      if (result.landmarks && result.landmarks.length > 0) {
        const pose = result.landmarks[0];
        const lmConf = result.worldLandmarks?.[0];
        
        results.push({
          timestampMs: t * 1000,
          leftShoulder: pose[LANDMARK_IDX.LEFT_SHOULDER],
          rightShoulder: pose[LANDMARK_IDX.RIGHT_SHOULDER],
          leftElbow: pose[LANDMARK_IDX.LEFT_ELBOW],
          rightElbow: pose[LANDMARK_IDX.RIGHT_ELBOW],
          leftWrist: pose[LANDMARK_IDX.LEFT_WRIST],
          rightWrist: pose[LANDMARK_IDX.RIGHT_WRIST],
          confidence: lmConf ? lmConf[LANDMARK_IDX.LEFT_SHOULDER].visibility ?? 0.6 : 0.6,
        });
      }
    } catch (err) {
      console.warn(`Fallback sample error at ${t}s:`, err);
      // Continue to next frame instead of failing entirely
    }
  }
  return results;
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.currentTime = time;
    const handler = () => { video.removeEventListener("seeked", handler); resolve(); };
    video.addEventListener("seeked", handler);
  });
}
