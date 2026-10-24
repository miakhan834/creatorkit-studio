import { Scene, SubtitleSegment } from '../types/creator';

/**
 * Formats seconds into SRT timestamp string: HH:MM:SS,mmm
 */
export function formatTimeSRT(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.floor((safeSeconds % 1) * 1000);

  const pad = (num: number, size = 2) => String(num).padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Parses SRT timestamp string "HH:MM:SS,mmm" or "HH:MM:SS.mmm" into total seconds
 */
export function parseTimeSRT(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().replace('.', ',');
  const parts = normalized.split(':');
  if (parts.length !== 3) return 0;

  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const secParts = parts[2].split(',');
  const seconds = parseFloat(secParts[0]) || 0;
  const millis = parseFloat(secParts[1]) || 0;

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Generates subtitle segments strictly derived from scene narrations and durations.
 * Produces ordered, non-overlapping timestamps.
 */
export function generateSubtitlesFromScenes(scenes: Scene[]): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  let currentTime = 0;
  let counter = 1;

  for (const scene of scenes) {
    const narration = (scene.narration || '').trim();
    const sceneDuration = Math.max(2, scene.durationSeconds || 4);

    if (!narration) {
      currentTime += sceneDuration;
      continue;
    }

    // Split narration into natural sentence/clause chunks
    // Matches sentences or clauses bounded by punctuation or ~6-8 words max
    const rawChunks = narration
      .split(/(?<=[.!?…])\s+|(?<=[,;])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // If chunks are too long, split them further by word count (approx 6-8 words per chunk)
    const normalizedChunks: string[] = [];
    for (const chunk of rawChunks) {
      const words = chunk.split(/\s+/);
      if (words.length > 8) {
        for (let i = 0; i < words.length; i += 7) {
          normalizedChunks.push(words.slice(i, i + 7).join(' '));
        }
      } else {
        normalizedChunks.push(chunk);
      }
    }

    if (normalizedChunks.length === 0) {
      currentTime += sceneDuration;
      continue;
    }

    // Distribute scene duration among chunks proportionally based on word length
    const totalWords = normalizedChunks.reduce((acc, c) => acc + c.split(/\s+/).length, 0) || 1;
    let sceneRunningTime = currentTime;

    normalizedChunks.forEach((chunkText, index) => {
      const chunkWordCount = chunkText.split(/\s+/).length;
      let chunkDuration = (chunkWordCount / totalWords) * sceneDuration;

      // Minimum duration 1.0s, unless total scene is very brief
      chunkDuration = Math.max(0.8, chunkDuration);

      const startSeconds = sceneRunningTime;
      // If it's the last chunk in this scene, align directly to scene boundary
      const isLast = index === normalizedChunks.length - 1;
      const endSeconds = isLast ? currentTime + sceneDuration : startSeconds + chunkDuration;

      segments.push({
        id: `sub_${scene.id}_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        index: counter++,
        startTime: formatTimeSRT(startSeconds),
        endTime: formatTimeSRT(endSeconds),
        startSeconds: Math.round(startSeconds * 100) / 100,
        endSeconds: Math.round(endSeconds * 100) / 100,
        text: chunkText,
      });

      sceneRunningTime = endSeconds;
    });

    currentTime += sceneDuration;
  }

  return segments;
}

/**
 * Synchronizes subtitle timestamps when scene durations or order change,
 * preserving custom subtitle text while keeping timestamps ordered and non-overlapping.
 */
export function syncSubtitleTimings(
  existingSubtitles: SubtitleSegment[],
  scenes: Scene[]
): SubtitleSegment[] {
  if (!existingSubtitles || existingSubtitles.length === 0) {
    return generateSubtitlesFromScenes(scenes);
  }

  const synced: SubtitleSegment[] = [];
  let currentTime = 0;
  let counter = 1;

  for (const scene of scenes) {
    const sceneDuration = Math.max(2, scene.durationSeconds || 4);
    // Find all subtitle segments associated with this scene
    const sceneSubs = existingSubtitles.filter((sub) =>
      sub.id.startsWith(`sub_${scene.id}_`)
    );

    if (sceneSubs.length === 0) {
      // Generate subtitles for this scene if none existed (e.g., new scene added)
      const newSceneSubs = generateSubtitlesFromScenes([scene]);
      for (const s of newSceneSubs) {
        synced.push({
          ...s,
          index: counter++,
          startTime: formatTimeSRT(currentTime + s.startSeconds),
          endTime: formatTimeSRT(currentTime + s.endSeconds),
          startSeconds: Math.round((currentTime + s.startSeconds) * 100) / 100,
          endSeconds: Math.round((currentTime + s.endSeconds) * 100) / 100,
        });
      }
    } else {
      // Scale existing subtitle segments proportionally to the new scene duration
      const totalExistingDuration =
        sceneSubs[sceneSubs.length - 1].endSeconds - sceneSubs[0].startSeconds || 1;
      const scale = sceneDuration / Math.max(0.1, totalExistingDuration);

      let runningStart = currentTime;
      sceneSubs.forEach((sub, idx) => {
        const subRelativeDuration = Math.max(0.5, (sub.endSeconds - sub.startSeconds) * scale);
        const isLast = idx === sceneSubs.length - 1;
        const subStart = runningStart;
        const subEnd = isLast ? currentTime + sceneDuration : runningStart + subRelativeDuration;

        synced.push({
          ...sub,
          index: counter++,
          startTime: formatTimeSRT(subStart),
          endTime: formatTimeSRT(subEnd),
          startSeconds: Math.round(subStart * 100) / 100,
          endSeconds: Math.round(subEnd * 100) / 100,
        });

        runningStart = subEnd;
      });
    }

    currentTime += sceneDuration;
  }

  return synced;
}

/**
 * Builds valid standard SRT string
 */
export function buildSRTString(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map((sub, i) => {
      return `${i + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}\n`;
    })
    .join('\n');
}

/**
 * Builds clean plain-text transcript with timestamps
 */
export function buildTranscriptString(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map((sub) => `[${sub.startTime.slice(3, 8)} - ${sub.endTime.slice(3, 8)}] ${sub.text}`)
    .join('\n');
}
