export type TargetPlatform = 'YouTube' | 'YouTube Shorts' | 'TikTok' | 'Instagram Reels';
export type Language = 'English' | 'Urdu' | 'Roman Urdu' | 'Spanish';
export type VideoFormat = 'Short' | 'Long';
export type VideoStyle = 'Documentary' | 'Educational' | 'Storytelling' | 'Mystery' | 'Motivational';

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  narration: string;
  visualPrompt: string;
  shotDirection: string;
  durationSeconds: number;
  onScreenText?: string;
  transition?: string;
}

export interface VideoScript {
  hook: string;
  body: string;
  conclusion: string;
  fullNarration: string;
  estimatedDurationSeconds: number;
  isLocked: boolean;
  factVerificationNotes?: string[];
}

export interface SubtitleSegment {
  id: string;
  index: number;
  startTime: string; // "00:00:01,250"
  endTime: string;   // "00:00:03,800"
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  platform: TargetPlatform;
  language: Language;
  format: VideoFormat;
  targetDuration: string;
  style: VideoStyle;
  tone: string;
  intendedAudience: string;
  createdAt: number;
  updatedAt: number;
  script: VideoScript;
  scenes: Scene[];
  voiceoverInstructions: string;
  subtitles: SubtitleSegment[];
}

export type ActiveTab = 'dashboard' | 'script' | 'scenes' | 'voiceover' | 'export';
