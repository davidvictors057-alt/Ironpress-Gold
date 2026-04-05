import Dexie, { Table } from "dexie";

export interface MediaRecord {
  id?: number;
  achievementId?: string;
  videoId?: number;
  blob: Blob;
  type: "photo" | "video";
  name: string;
  size: number;
  createdAt: number;
}

export interface ThumbnailRecord {
  id?: number;
  mediaId: number;
  blob: Blob;
  width: number;
  height: number;
}

export interface AnalysisRecord {
  id?: number;
  videoId: number;
  title: string;
  score: number;
  flags: string[];
  report: string;
  keyAngles: {
    leftElbow: number;
    rightElbow: number;
    symmetry: number;
    pauseDetected: boolean;
  };
  framesAnalyzed: number;
  createdAt: number;
}

class IronsideDB extends Dexie {
  media!: Table<MediaRecord>;
  thumbnails!: Table<ThumbnailRecord>;
  analysis!: Table<AnalysisRecord>;

  constructor() {
    super("IronsideGoldDB");
    this.version(1).stores({
      media: "++id, achievementId, videoId, type, createdAt",
      thumbnails: "++id, mediaId",
      analysis: "++id, videoId, createdAt",
    });
  }
}

export const db = new IronsideDB();
