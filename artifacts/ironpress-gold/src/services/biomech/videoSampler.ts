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

const LANDMARK_IDX = {
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
  sampleEveryNthFrame = 5
): Promise<FrameLandmarks[]> {
  const lm = await getPoseLandmarker();
  const results: FrameLandmarks[] = [];
  const duration = videoElement.duration;
  let frameIdx = 0;

  return new Promise((resolve, reject) => {
    videoElement.currentTime = 0;
    videoElement.play().catch(reject);

    const processFrame = async (now: number, metadata: { mediaTime: number }) => {
      const currentPct = (metadata.mediaTime / duration) * 100;
      onProgress(Math.min(currentPct, 99));

      if (frameIdx % sampleEveryNthFrame === 0) {
        try {
          const result = lm.detectForVideo(
            videoElement,
            metadata.mediaTime * 1000
          );
          if (result.landmarks && result.landmarks.length > 0) {
            const pose = result.landmarks[0];
            const lmConf = result.worldLandmarks?.[0];
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
        onProgress(100);
        videoElement.pause();
        resolve(results);
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
  const steps = Math.min(60, Math.floor(duration * 10));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    onProgress((i / steps) * 100);
    await seekTo(video, t);
    try {
      const result = lm.detectForVideo(video, t * 1000);
      if (result.landmarks?.length > 0) {
        const pose = result.landmarks[0];
        results.push({
          timestampMs: t * 1000,
          leftShoulder: pose[LANDMARK_IDX.LEFT_SHOULDER],
          rightShoulder: pose[LANDMARK_IDX.RIGHT_SHOULDER],
          leftElbow: pose[LANDMARK_IDX.LEFT_ELBOW],
          rightElbow: pose[LANDMARK_IDX.RIGHT_ELBOW],
          leftWrist: pose[LANDMARK_IDX.LEFT_WRIST],
          rightWrist: pose[LANDMARK_IDX.RIGHT_WRIST],
          confidence: 0.6,
        });
      }
    } catch {}
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
