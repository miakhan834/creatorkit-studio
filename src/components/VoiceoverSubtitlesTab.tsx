import React, { useState } from 'react';
import {
  Mic,
  Copy,
  Clock,
  Sparkles,
  Volume2,
  FileText,
  Subtitles,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Info,
  Layers,
  Lock
} from 'lucide-react';
import { Project, Scene, SubtitleSegment } from '../types/creator';
import {
  buildSRTString,
  buildTranscriptString,
  formatTimeSRT,
  parseTimeSRT,
  generateSubtitlesFromScenes,
} from '../utils/subtitles';
import { exportSubtitlesSRT, exportTranscriptTXT } from '../utils/export';

interface VoiceoverSubtitlesTabProps {
  project: Project;
  onUpdateScenes: (updatedScenes: Scene[]) => void;
  onUpdateSubtitles: (subtitles: SubtitleSegment[]) => void;
  onUpdateVoiceoverInstructions: (instructions: string) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
}

export const VoiceoverSubtitlesTab: React.FC<VoiceoverSubtitlesTabProps> = ({
  project,
  onUpdateScenes,
  onUpdateSubtitles,
  onUpdateVoiceoverInstructions,
  onShowToast,
}) => {
  const { scenes, subtitles, script, voiceoverInstructions } = project;
  const [activeSubTab, setActiveSubTab] = useState<'voiceover' | 'subtitles'>('voiceover');

  // Pacing estimates
  const fullNarrationText = scenes.map((s) => s.narration).filter(Boolean).join('\n\n');
  const wordCount = fullNarrationText.trim().split(/\s+/).filter(Boolean).length;
  const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const wordsPerMinute = totalDuration > 0 ? Math.round((wordCount / totalDuration) * 60) : 140;

  // Delivery style presets
  const deliveryPresets = [
    { label: 'Dramatic & Suspenseful', note: 'Deep, deliberate pauses, heightened emphasis on punchlines and cliffhangers.' },
    { label: 'Conversational & Energetic', note: 'Upbeat tempo, friendly delivery, natural conversational breaths, high enthusiasm.' },
    { label: 'Calm & Authoritative', note: 'Steady, educational cadence, articulate diction, professional documentary style.' },
    { label: 'Fast-Paced & Hype (Shorts)', note: 'Rapid delivery (~160-180 WPM), minimal pauses, punchy rhythm tailored for TikTok and Shorts.' },
    { label: 'Mysterious & Whispered', note: 'Subdued intensity, eerie cadence, lingering pauses before surprising reveals.' },
  ];

  // Copy all narration
  const handleCopyAllNarration = () => {
    navigator.clipboard.writeText(fullNarrationText);
    onShowToast({
      type: 'success',
      title: 'Voiceover Text Copied',
      message: 'All ordered scene narration copied to clipboard.',
    });
  };

  // Copy individual scene narration
  const handleCopySceneNarration = (scene: Scene) => {
    navigator.clipboard.writeText(scene.narration);
    onShowToast({
      type: 'success',
      title: `Scene ${scene.sceneNumber} Copied`,
      message: 'Scene narration copied to clipboard.',
    });
  };

  // Update scene narration from voiceover tab
  const handleNarrationChange = (sceneId: string, text: string) => {
    if (script.isLocked) {
      onShowToast({
        type: 'error',
        title: 'Script is Locked',
        message: 'Narration changes are locked. Please unlock the script in Script Studio first.',
      });
      return;
    }

    const updated = scenes.map((s) => (s.id === sceneId ? { ...s, narration: text } : s));
    onUpdateScenes(updated);
  };

  // Regenerate Subtitles from scenes
  const handleRegenerateSubtitles = () => {
    const freshlyGenerated = generateSubtitlesFromScenes(scenes);
    onUpdateSubtitles(freshlyGenerated);
    onShowToast({
      type: 'success',
      title: 'Subtitles Refreshed',
      message: `Generated ${freshlyGenerated.length} sequential, non-overlapping subtitle segments from scenes.`,
    });
  };

  // Edit subtitle segment text
  const handleSubtitleTextChange = (id: string, newText: string) => {
    const updated = subtitles.map((sub) => (sub.id === id ? { ...sub, text: newText } : sub));
    onUpdateSubtitles(updated);
  };

  // Edit subtitle segment timing
  const handleSubtitleTimingChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    const updated = subtitles.map((sub) => {
      if (sub.id === id) {
        const nextSub = { ...sub, [field]: value };
        if (field === 'startTime') nextSub.startSeconds = parseTimeSRT(value);
        if (field === 'endTime') nextSub.endSeconds = parseTimeSRT(value);
        return nextSub;
      }
      return sub;
    });
    onUpdateSubtitles(updated);
  };

  // Add subtitle segment
  const handleAddSubtitleSegment = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const lastEndSeconds = lastSub ? lastSub.endSeconds : 0;
    const newStartSeconds = lastEndSeconds;
    const newEndSeconds = lastEndSeconds + 3.0;

    const newSub: SubtitleSegment = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      index: subtitles.length + 1,
      startTime: formatTimeSRT(newStartSeconds),
      endTime: formatTimeSRT(newEndSeconds),
      startSeconds: newStartSeconds,
      endSeconds: newEndSeconds,
      text: 'New subtitle caption',
    };

    onUpdateSubtitles([...subtitles, newSub]);
  };

  // Delete subtitle segment
  const handleDeleteSubtitleSegment = (id: string) => {
    const filtered = subtitles.filter((sub) => sub.id !== id);
    const renumbered = filtered.map((sub, i) => ({ ...sub, index: i + 1 }));
    onUpdateSubtitles(renumbered);
  };

  // Copy SRT string
  const handleCopySRT = () => {
    const srt = buildSRTString(subtitles);
    navigator.clipboard.writeText(srt);
    onShowToast({
      type: 'success',
      title: 'SRT Copied',
      message: 'Full SRT subtitle formatted text copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              Voiceover & Subtitles Workspace
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Prepare voiceover recording scripts, pacing, delivery notes, and synchronized SRT captions
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('voiceover')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'voiceover'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voiceover Prep</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('subtitles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'subtitles'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>SRT Subtitles ({subtitles.length})</span>
            </button>
          </div>
        </div>

        {/* Advisory / Disclaimer Banner */}
        <div className="mt-4 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-zinc-300">Voiceover Text Preparation:</strong> This workspace structures your ordered lines, word counts, and delivery directions for recording or external speech tools. No audio generation is simulated in this MVP.
          </div>
        </div>
      </div>

      {activeSubTab === 'voiceover' ? (
        /* ================= VOICEOVER VIEW ================= */
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-zinc-500 text-xs block">Total Words:</span>
              <span className="text-lg font-bold text-white">{wordCount}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-zinc-500 text-xs block">Target Duration:</span>
              <span className="text-lg font-bold text-purple-300">{totalDuration}s</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-zinc-500 text-xs block">Calculated Speed:</span>
              <span className="text-lg font-bold text-blue-300">~{wordsPerMinute} WPM</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-zinc-500 text-xs block">Language:</span>
              <span className="text-lg font-bold text-emerald-300">{project.language}</span>
            </div>
          </div>

          {/* Delivery Instructions & Presets Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                Voiceover Delivery & Direction Notes
              </h3>
            </div>

            <textarea
              rows={2}
              value={voiceoverInstructions}
              onChange={(e) => onUpdateVoiceoverInstructions(e.target.value)}
              placeholder="e.g. Tone, speed, breathing cues, pauses, and emotional energy..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />

            {/* Quick Delivery Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-zinc-400 block">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {deliveryPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdateVoiceoverInstructions(preset.note)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Narration Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Scene-by-Scene Spoken Narration
            </h3>
            <button
              type="button"
              onClick={handleCopyAllNarration}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Narration</span>
            </button>
          </div>

          {/* Scenes Voiceover Cards */}
          <div className="space-y-3">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-zinc-800 text-purple-300 text-xs font-bold flex items-center justify-center">
                      {scene.sceneNumber || idx + 1}
                    </span>
                    <span className="text-sm font-medium text-white">{scene.title}</span>
                    <span className="text-[11px] text-zinc-400">~{scene.durationSeconds}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySceneNarration(scene)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                    title="Copy this scene narration"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={scene.narration}
                  disabled={script.isLocked}
                  onChange={(e) => handleNarrationChange(scene.id, e.target.value)}
                  placeholder="Narration words for this scene..."
                  className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                    script.isLocked
                      ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed text-zinc-400'
                      : 'border-zinc-800 focus:border-purple-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= SUBTITLES VIEW ================= */
        <div className="space-y-6">
          {/* Subtitles Action Toolbar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-purple-400" />
                Synchronized Subtitle Segments ({subtitles.length})
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sequential timestamps formatted as <code className="text-purple-300">HH:MM:SS,mmm</code> with no overlaps
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerateSubtitles}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                title="Regenerate timings and segments directly from current scene narrations"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-sync from Scenes</span>
              </button>

              <button
                type="button"
                onClick={handleCopySRT}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SRT</span>
              </button>

              <button
                type="button"
                onClick={() => exportSubtitlesSRT(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .SRT</span>
              </button>
            </div>
          </div>

          {/* Subtitles Notice */}
          <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Timing Notice:</strong> Timestamps are approximated based on narration syllable length and scene durations. We recommend previewing playback alignment in your video editor prior to final publish.
            </div>
          </div>

          {/* Subtitle Segments List */}
          <div className="space-y-3">
            {subtitles.map((sub) => (
              <div
                key={sub.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {sub.index}
                    </span>

                    {/* Start Time Input */}
                    <input
                      type="text"
                      value={sub.startTime}
                      onChange={(e) => handleSubtitleTimingChange(sub.id, 'startTime', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 text-purple-300 font-mono text-xs px-2 py-1 rounded w-28 text-center focus:outline-none focus:border-purple-500"
                    />

                    <span className="text-zinc-500 text-xs">→</span>

                    {/* End Time Input */}
                    <input
                      type="text"
                      value={sub.endTime}
                      onChange={(e) => handleSubtitleTimingChange(sub.id, 'endTime', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 text-purple-300 font-mono text-xs px-2 py-1 rounded w-28 text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtitleSegment(sub.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 self-end sm:self-auto"
                    title="Delete caption segment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtitle Text Input */}
                <input
                  type="text"
                  value={sub.text}
                  onChange={(e) => handleSubtitleTextChange(sub.id, e.target.value)}
                  placeholder="Subtitle caption text..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Add Subtitle Button */}
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={handleAddSubtitleSegment}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Subtitle Segment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
