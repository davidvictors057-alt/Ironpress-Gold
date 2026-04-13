import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarker: PoseLandmarker | null = null;
let loading = false;

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;
  if (loading) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (landmarker) { clearInterval(check); resolve(); }
      }, 100);
    });
    return landmarker!;
  }
  loading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 3,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return landmarker;
  } finally {
    loading = false;
  }
}

export function disposePoseLandmarker() {
  if (landmarker) {
    landmarker.close();
    landmarker = null;
  }
}
