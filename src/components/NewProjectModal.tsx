import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Video,
  Clock,
  Globe,
  Palette,
  Users,
  Film,
  AlertCircle,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import {
  Language,
  TargetPlatform,
  VideoFormat,
  VideoStyle,
  Project,
} from '../types/creator';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (newProject: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<TargetPlatform>('YouTube Shorts');
  const [language, setLanguage] = useState<Language>('English');
  const [format, setFormat] = useState<VideoFormat>('Short');
  const [targetDuration, setTargetDuration] = useState('60s');
  const [style, setStyle] = useState<VideoStyle>('Storytelling');
  const [tone, setTone] = useState('Dramatic & Hook-Driven');
  const [intendedAudience, setIntendedAudience] = useState('Mobile viewers interested in mysteries');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormatChange = (newFormat: VideoFormat) => {
    setFormat(newFormat);
    if (newFormat === 'Short') {
      if (platform === 'YouTube') setPlatform('YouTube Shorts');
      setTargetDuration('60s');
    } else {
      if (platform !== 'YouTube') setPlatform('YouTube');
      setTargetDuration('3 - 5 min');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a project title.');
      return;
    }
    if (!topic.trim()) {
      setErrorMessage('Please describe the video topic or premise.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim(),
          platform,
          language,
          format,
          targetDuration,
          style,
          tone,
          intendedAudience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error generating your plan.');
      }

      if (!data.script || !Array.isArray(data.scenes)) {
        throw new Error('AI response was incomplete. Please click Generate again to retry.');
      }

      // Format scenes with stable IDs
      const formattedScenes = data.scenes.map((s: any, idx: number) => ({
        id: `scene-${Date.now()}-${idx + 1}`,
        sceneNumber: idx + 1,
        title: s.title || `Scene ${idx + 1}`,
        narration: s.narration || '',
        visualPrompt: s.visualPrompt || '',
        shotDirection: s.shotDirection || 'Cinematic angle',
        durationSeconds: Number(s.durationSeconds) || 5,
        onScreenText: s.onScreenText || '',
        transition: s.transition || 'Cut',
      }));

      // Import subtitle generator dynamically
      const { generateSubtitlesFromScenes } = await import('../utils/subtitles');
      const subtitles = generateSubtitlesFromScenes(formattedScenes);

      const newProject: Project = {
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        topic: topic.trim(),
        platform,
        language,
        format,
        targetDuration,
        style,
        tone,
        intendedAudience,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        script: {
          hook: data.script.hook || '',
          body: data.script.body || '',
          conclusion: data.script.conclusion || '',
          fullNarration: data.script.fullNarration || formattedScenes.map((s: any) => s.narration).join('\n\n'),
          estimatedDurationSeconds: formattedScenes.reduce((acc: number, s: any) => acc + (s.durationSeconds || 0), 0) || Number(data.script.estimatedDurationSeconds) || 60,
          isLocked: false,
          factVerificationNotes: Array.isArray(data.script.factVerificationNotes) ? data.script.factVerificationNotes : [],
        },
        scenes: formattedScenes,
        voiceoverInstructions: data.voiceoverInstructions || 'Maintain clear articulation with dynamic pauses.',
        subtitles,
      };

      onPlanGenerated(newProject);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate plan. Please verify network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">New Video Production Plan</h2>
              <p className="text-xs text-zinc-400">Turn one topic into scenes, script, prompts & subtitles</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Generation Failed</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Title & Topic */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Why Ancient Romans Mixed Volcanic Ash with Concrete"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Video Topic & Core Hook / Details <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe what the video is about, the central mystery, shocking facts, or story arc to cover..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Grid settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Format (Short vs Long) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                Video Format
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleFormatChange('Short')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    format === 'Short'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Short (9:16)
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange('Long')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    format === 'Long'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Long (16:9)
                </button>
              </div>
            </div>

            {/* Target Platform */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TargetPlatform)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              >
                {format === 'Short' ? (
                  <>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                  </>
                ) : (
                  <>
                    <option value="YouTube">YouTube (Longform)</option>
                  </>
                )}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Roman Urdu">Roman Urdu</option>
                <option value="Spanish">Spanish (Español)</option>
              </select>
            </div>

            {/* Target Duration */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Target Duration
              </label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              >
                {format === 'Short' ? (
                  <>
                    <option value="30s">30 seconds (Quick punch)</option>
                    <option value="45s">45 seconds (Balanced)</option>
                    <option value="60s">60 seconds (Standard Short)</option>
                    <option value="90s">90 seconds (Deep Short)</option>
                  </>
                ) : (
                  <>
                    <option value="2 - 3 min">2 - 3 minutes</option>
                    <option value="3 - 5 min">3 - 5 minutes</option>
                    <option value="5 - 8 min">5 - 8 minutes</option>
                    <option value="8 - 12 min">8 - 12 minutes</option>
                  </>
                )}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Narrative Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as VideoStyle)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              >
                <option value="Documentary">Documentary</option>
                <option value="Educational">Educational</option>
                <option value="Storytelling">Storytelling</option>
                <option value="Mystery">Mystery</option>
                <option value="Motivational">Motivational</option>
              </select>
            </div>

            {/* Intended Audience */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                Intended Audience
              </label>
              <input
                type="text"
                placeholder="e.g. History buffs, casual scrollers"
                value={intendedAudience}
                onChange={(e) => setIntendedAudience(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Voiceover Tone & Vibe
            </label>
            <input
              type="text"
              placeholder="e.g. Fast-paced, high curiosity, suspenseful, authoritative"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isLoading}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none placeholder-zinc-600"
            />
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-zinc-400 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              Your video topic and configuration are sent securely to Google Gemini server-side to generate this production plan. No passwords, payments, or third-party APIs are required.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Production Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
