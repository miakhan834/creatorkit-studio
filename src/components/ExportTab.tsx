import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileCode,
  Film,
  Subtitles,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Project } from '../types/creator';
import {
  exportProductionPlanTXT,
  exportScriptTXT,
  exportStoryboardJSON,
  exportSubtitlesSRT,
  exportScenePromptsTXT,
  exportTranscriptTXT,
  sanitizeFilename,
} from '../utils/export';
import { buildSRTString, buildTranscriptString } from '../utils/subtitles';

interface ExportTabProps {
  project: Project;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({ project, onShowToast }) => {
  const [previewTab, setPreviewTab] = useState<'plan' | 'script' | 'json' | 'srt' | 'prompts'>('plan');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const safeName = sanitizeFilename(project.title);

  const exportCards = [
    {
      id: 'plan',
      title: 'Complete Production Plan',
      extension: '.txt',
      filename: `${safeName}-production-plan.txt`,
      description: 'Comprehensive video blueprint with metadata, opening hook, full narration, voiceover guidelines, and scene breakdown.',
      icon: FileText,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-800/60',
      action: () => {
        exportProductionPlanTXT(project);
        onShowToast({ type: 'success', title: 'Downloaded', message: `Saved ${safeName}-production-plan.txt` });
      },
    },
    {
      id: 'script',
      title: 'Clean Spoken Script',
      extension: '.txt',
      filename: `${safeName}-script.txt`,
      description: 'Clean teleprompter narration text formatted for voiceover artists, text-to-speech tools, or teleprompter reading.',
      icon: Film,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40 border-blue-800/60',
      action: () => {
        exportScriptTXT(project);
        onShowToast({ type: 'success', title: 'Downloaded', message: `Saved ${safeName}-script.txt` });
      },
    },
    {
      id: 'json',
      title: 'Storyboard Data',
      extension: '.json',
      filename: `${safeName}-storyboard.json`,
      description: 'Full structured JSON schema of all scenes, durations, prompts, transitions, and subtitle timings for programmatic use or backup.',
      icon: FileCode,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/60',
      action: () => {
        exportStoryboardJSON(project);
        onShowToast({ type: 'success', title: 'Downloaded', message: `Saved ${safeName}-storyboard.json` });
      },
    },
    {
      id: 'srt',
      title: 'Synchronized Subtitles',
      extension: '.srt',
      filename: `${safeName}-subtitles.srt`,
      description: 'Standard SubRip caption file with sequential indexes and non-overlapping timestamps for CapCut, Premiere, or YouTube upload.',
      icon: Subtitles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800/60',
      action: () => {
        exportSubtitlesSRT(project);
        onShowToast({ type: 'success', title: 'Downloaded', message: `Saved ${safeName}-subtitles.srt` });
      },
    },
    {
      id: 'prompts',
      title: 'Scene Visual Prompts',
      extension: '.txt',
      filename: `${safeName}-scene-prompts.txt`,
      description: 'Numbered list of Midjourney / Imagen / Stable Diffusion prompts formatted with aspect ratio flags and shot directions.',
      icon: Sparkles,
      color: 'text-pink-400',
      bgColor: 'bg-pink-950/40 border-pink-800/60',
      action: () => {
        exportScenePromptsTXT(project);
        onShowToast({ type: 'success', title: 'Downloaded', message: `Saved ${safeName}-scene-prompts.txt` });
      },
    },
  ];

  // Helper to generate preview text for the active preview tab
  const getPreviewContent = () => {
    switch (previewTab) {
      case 'plan': {
        const totalDuration = project.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        return `CREATORKIT PRODUCTION PLAN
Title: ${project.title}
Topic: ${project.topic}
Platform: ${project.platform} | Style: ${project.style} | Est Duration: ${totalDuration}s

[HOOK]
${project.script.hook}

[BODY]
${project.script.body}

[CONCLUSION]
${project.script.conclusion}

[SCENES SUMMARY]
${project.scenes
  .map(
    (s, i) =>
      `Scene ${s.sceneNumber || i + 1} (~${s.durationSeconds}s) - "${s.title}"\n  Shot: ${s.shotDirection}\n  Prompt: ${s.visualPrompt}\n  Narration: "${s.narration}"`
  )
  .join('\n\n')}`;
      }
      case 'script':
        return `TITLE: ${project.title}\n\n=== HOOK ===\n${project.script.hook}\n\n=== FULL NARRATION ===\n${
          project.script.fullNarration || project.scenes.map((s) => s.narration).join('\n\n')
        }\n\n=== OUTRO ===\n${project.script.conclusion}`;
      case 'json':
        return JSON.stringify(project, null, 2);
      case 'srt':
        return buildSRTString(project.subtitles);
      case 'prompts': {
        const ratio = project.format === 'Short' ? '--ar 9:16' : '--ar 16:9';
        return project.scenes
          .map(
            (s, i) =>
              `[SCENE ${s.sceneNumber || i + 1}] ${s.title}\nDirection: ${s.shotDirection}\nPrompt:\n${s.visualPrompt} ${ratio}\n`
          )
          .join('\n');
      }
      default:
        return '';
    }
  };

  const handleCopyPreview = () => {
    const content = getPreviewContent();
    navigator.clipboard.writeText(content);
    setCopiedKey(previewTab);
    setTimeout(() => setCopiedKey(null), 2000);
    onShowToast({
      type: 'success',
      title: 'Copied Preview',
      message: 'Preview content copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-400" />
          Production Plan Export Center
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Download genuine production-ready assets with sanitized filenames ready for video editors and AI generators
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {card.extension}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5 mb-2">
                  {card.filename}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={card.action}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab(card.id as any)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
                  title="Inspect on-screen preview"
                >
                  Inspect
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live File Preview Inspector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:px-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Live Asset Inspector & Quick Copy</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setPreviewTab('plan')}
                className={`px-2.5 py-1 rounded font-medium ${
                  previewTab === 'plan' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Plan TXT
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('script')}
                className={`px-2.5 py-1 rounded font-medium ${
                  previewTab === 'script' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Script TXT
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('srt')}
                className={`px-2.5 py-1 rounded font-medium ${
                  previewTab === 'srt' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                SRT Captions
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('prompts')}
                className={`px-2.5 py-1 rounded font-medium ${
                  previewTab === 'prompts' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Prompts
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('json')}
                className={`px-2.5 py-1 rounded font-medium ${
                  previewTab === 'json' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                JSON
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
            >
              {copiedKey === previewTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text Area Content */}
        <div className="p-4 bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto max-h-96 whitespace-pre leading-relaxed select-text">
          {getPreviewContent()}
        </div>
      </div>
    </div>
  );
};
