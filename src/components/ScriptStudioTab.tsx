import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  RotateCcw,
  Copy,
  Save,
  Check,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Layers
} from 'lucide-react';
import { Project, VideoScript } from '../types/creator';

interface ScriptStudioTabProps {
  project: Project;
  onUpdateScript: (updatedScript: VideoScript) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
}

export const ScriptStudioTab: React.FC<ScriptStudioTabProps> = ({
  project,
  onUpdateScript,
  onShowToast,
}) => {
  const { script } = project;

  // Local editable draft state
  const [hook, setHook] = useState(script.hook);
  const [body, setBody] = useState(script.body);
  const [conclusion, setConclusion] = useState(script.conclusion);
  const [fullNarration, setFullNarration] = useState(
    script.fullNarration || `${script.hook}\n\n${script.body}\n\n${script.conclusion}`
  );
  const [activeView, setActiveView] = useState<'structured' | 'full'>('structured');

  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Sync draft when project changes
  React.useEffect(() => {
    setHook(script.hook);
    setBody(script.body);
    setConclusion(script.conclusion);
    setFullNarration(script.fullNarration || `${script.hook}\n\n${script.body}\n\n${script.conclusion}`);
  }, [project.id, script]);

  // Calculations
  const combinedText = activeView === 'structured'
    ? `${hook} ${body} ${conclusion}`
    : fullNarration;
  const wordCount = combinedText.trim().split(/\s+/).filter(Boolean).length;

  // Reading pace constant (140 WPM)
  const WORDS_PER_MINUTE = 140;

  // Spoken duration: (word count / WPM) * 60
  const spokenDurationSeconds = wordCount > 0
    ? Math.round((wordCount / WORDS_PER_MINUTE) * 60)
    : 0;
  const spokenMins = Math.floor(spokenDurationSeconds / 60);
  const spokenSecs = spokenDurationSeconds % 60;
  const spokenDurationLabel = spokenMins > 0 ? `${spokenMins}m ${spokenSecs}s` : `${spokenSecs}s`;

  // Scene timeline duration (sum of scene cards)
  const sceneTimelineDuration = project.scenes.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const timelineMins = Math.floor(sceneTimelineDuration / 60);
  const timelineSecs = sceneTimelineDuration % 60;
  const timelineDurationLabel = timelineMins > 0 ? `${timelineMins}m ${timelineSecs}s` : `${timelineSecs}s`;

  // Timeline fit detection
  const durationDiff = spokenDurationSeconds - sceneTimelineDuration;
  const isOverTimeline = sceneTimelineDuration > 0 && durationDiff > 2;
  const isUnderTimeline = sceneTimelineDuration > 0 && durationDiff < -5;
  const hasTimelineMismatch = isOverTimeline || isUnderTimeline;

  const handleToggleLock = () => {
    const nextLocked = !script.isLocked;
    onUpdateScript({
      ...script,
      isLocked: nextLocked,
    });
    onShowToast({
      type: nextLocked ? 'info' : 'success',
      title: nextLocked ? 'Script Locked' : 'Script Unlocked',
      message: nextLocked
        ? 'Script is now protected against accidental AI overwrites.'
        : 'Script is unlocked. AI regenerations and edits are now permitted.',
    });
  };

  const handleSaveChanges = () => {
    if (script.isLocked) {
      onShowToast({
        type: 'error',
        title: 'Script is Locked',
        message: 'Please unlock the script using the toggle button above before saving edits.',
      });
      return;
    }

    let finalHook = hook;
    let finalBody = body;
    let finalConclusion = conclusion;
    let finalFull = fullNarration;

    if (activeView === 'structured') {
      finalFull = `${hook}\n\n${body}\n\n${conclusion}`.trim();
    } else {
      // If edited in full mode, split paragraphs
      const paras = fullNarration.split('\n\n').map(p => p.trim()).filter(Boolean);
      finalHook = paras[0] || '';
      finalConclusion = paras.length > 1 ? paras[paras.length - 1] : '';
      finalBody = paras.slice(1, paras.length > 2 ? -1 : undefined).join('\n\n');
    }

    onUpdateScript({
      ...script,
      hook: finalHook,
      body: finalBody,
      conclusion: finalConclusion,
      fullNarration: finalFull,
      estimatedDurationSeconds: spokenDurationSeconds,
    });

    onShowToast({
      type: 'success',
      title: 'Script Saved',
      message: `Updated script saved successfully (${wordCount} words, ~${spokenDurationLabel} spoken at 140 WPM).`,
    });
  };

  const handleCopyScript = () => {
    const textToCopy = `=== ${project.title} ===\n\n[HOOK]\n${hook}\n\n[BODY]\n${body}\n\n[CONCLUSION]\n${conclusion}`;
    navigator.clipboard.writeText(textToCopy);
    onShowToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Full script copied to your clipboard.',
    });
  };

  const handleRegenerateScript = async () => {
    if (script.isLocked) {
      onShowToast({
        type: 'error',
        title: 'Action Blocked: Script is Locked',
        message: 'The script is locked to prevent accidental rewriting. Click the Unlock button first if you wish to regenerate it.',
      });
      setIsRegenModalOpen(false);
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          topic: project.topic,
          platform: project.platform,
          language: project.language,
          format: project.format,
          style: project.style,
          tone: project.tone,
          customInstructions: regenInstructions.trim(),
          existingScript: fullNarration,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate script.');
      }

      setHook(data.hook || '');
      setBody(data.body || '');
      setConclusion(data.conclusion || '');
      setFullNarration(data.fullNarration || `${data.hook}\n\n${data.body}\n\n${data.conclusion}`);

      const regenWords = (data.fullNarration || `${data.hook} ${data.body} ${data.conclusion}`)
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      const regenSpokenSeconds = Math.round((regenWords / 140) * 60);

      onUpdateScript({
        ...script,
        hook: data.hook || '',
        body: data.body || '',
        conclusion: data.conclusion || '',
        fullNarration: data.fullNarration || `${data.hook}\n\n${data.body}\n\n${data.conclusion}`,
        estimatedDurationSeconds: regenSpokenSeconds,
        factVerificationNotes: Array.isArray(data.factVerificationNotes) ? data.factVerificationNotes : script.factVerificationNotes,
      });

      setIsRegenModalOpen(false);
      setRegenInstructions('');
      onShowToast({
        type: 'success',
        title: 'Script Regenerated',
        message: 'A fresh, optimized script draft has been generated.',
      });
    } catch (err: any) {
      console.error(err);
      onShowToast({
        type: 'error',
        title: 'Regeneration Error',
        message: err.message || 'Could not regenerate script. Your current draft was preserved.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Script Studio
              </h2>
              {script.isLocked && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Protected
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Refine your opening hook, narration paragraphs, and closing call-to-action
            </p>
          </div>

          {/* Action buttons toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lock / Unlock Toggle Button */}
            <button
              type="button"
              onClick={handleToggleLock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                script.isLocked
                  ? 'bg-amber-950/70 border-amber-700 text-amber-300 hover:bg-amber-900/80 shadow-md shadow-amber-950/30'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
              title={script.isLocked ? 'Click to unlock script for editing' : 'Click to lock script against AI rewrites'}
            >
              {script.isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Script Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Lock Script</span>
                </>
              )}
            </button>

            {/* Regenerate Script Button */}
            <button
              type="button"
              onClick={() => {
                if (script.isLocked) {
                  onShowToast({
                    type: 'error',
                    title: 'Script is Locked',
                    message: 'Unlock the script first to allow AI revisions.',
                  });
                  return;
                }
                setIsRegenModalOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                script.isLocked
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-purple-300 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate Script</span>
            </button>

            {/* Copy Script */}
            <button
              type="button"
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            {/* Save Changes */}
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={script.isLocked}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                script.isLocked
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Locked warning banner */}
        {script.isLocked && (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Script Lock Active:</strong> Automated AI tools and scene regeneration cannot alter this text. Unlock to edit.
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleLock}
              className="text-xs font-semibold underline text-amber-300 hover:text-white shrink-0"
            >
              Unlock Now
            </button>
          </div>
        )}

        {/* Word count & Reading stats bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Reading Pace: ~140 WPM</span>
            </div>
            <div>
              Words: <strong className="text-zinc-200">{wordCount}</strong>
            </div>
            <div>
              Est. Spoken Time: <strong className="text-purple-300 font-semibold">{spokenDurationLabel}</strong>
            </div>
            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scene Timeline:</span>
              <strong className="text-zinc-200 font-semibold">{timelineDurationLabel}</strong>
              <span className="text-zinc-500 text-[11px]">({project.scenes.length} scenes)</span>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveView('structured')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                activeView === 'structured'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Structured (Hook/Body/End)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('full')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                activeView === 'full'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Full Teleprompter Text
            </button>
          </div>
        </div>

        {/* Timeline Mismatch Warning Banner */}
        {hasTimelineMismatch && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
              isOverTimeline
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isOverTimeline ? 'text-amber-400' : 'text-blue-400'
              }`}
            />
            <div className="leading-relaxed flex-1">
              <div className="font-semibold mb-0.5 flex items-center gap-2">
                <span>Timeline Duration Mismatch</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                    isOverTimeline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {isOverTimeline ? `+${durationDiff}s Over Timeline` : `${Math.abs(durationDiff)}s Under Timeline`}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {isOverTimeline ? (
                  <>
                    At 140 WPM, speaking <strong>{wordCount} words</strong> takes approximately{' '}
                    <strong className="text-amber-300">{spokenDurationLabel}</strong>, but the planned scene
                    timeline is only <strong className="text-white">{timelineDurationLabel}</strong> (a{' '}
                    <strong>{durationDiff}-second</strong> deficit). Narration will exceed the scene video
                    without rushing. You can extend scene durations in <em>Scene Control Studio</em> or trim words from this script.
                  </>
                ) : (
                  <>
                    Planned scenes total <strong className="text-white">{timelineDurationLabel}</strong>, but speaking{' '}
                    <strong>{wordCount} words</strong> at 140 WPM only takes approximately{' '}
                    <strong className="text-blue-300">{spokenDurationLabel}</strong>. There will be ~{Math.abs(durationDiff)}s of
                    unvoiced visuals or pacing pauses.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Script Editor Areas */}
      {activeView === 'structured' ? (
        <div className="grid grid-cols-1 gap-5">
          {/* Section 1: Opening Hook */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                1. Opening Hook (First 3-5 Seconds)
              </label>
              <span className="text-[11px] text-zinc-500">
                {hook.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Arrest the viewer's scroll immediately. Introduce the core premise, tension, or paradoxical question.
            </p>
            <textarea
              rows={3}
              value={hook}
              disabled={script.isLocked}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Enter your punchy opening hook..."
              className={`w-full bg-zinc-950 border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                script.isLocked
                  ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed opacity-90'
                  : 'border-zinc-800 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Section 2: Main Body Narration */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                2. Core Body Narration (Middle Sections)
              </label>
              <span className="text-[11px] text-zinc-500">
                {body.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Unpack the key revelations, evidence, mechanics, or storytelling beats in logical sequence.
            </p>
            <textarea
              rows={8}
              value={body}
              disabled={script.isLocked}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter body narration paragraphs..."
              className={`w-full bg-zinc-950 border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                script.isLocked
                  ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed opacity-90'
                  : 'border-zinc-800 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Section 3: Satisfying Conclusion / CTA */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                3. Conclusion / Outro / Call-To-Action
              </label>
              <span className="text-[11px] text-zinc-500">
                {conclusion.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Provide a memorable closing takeaway, loop back to the hook, or ask an open question to provoke comments.
            </p>
            <textarea
              rows={3}
              value={conclusion}
              disabled={script.isLocked}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Enter conclusion or closing question..."
              className={`w-full bg-zinc-950 border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                script.isLocked
                  ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed opacity-90'
                  : 'border-zinc-800 focus:border-purple-500'
              }`}
            />
          </div>
        </div>
      ) : (
        /* Full continuous script editor */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Full Script Teleprompter Flow
            </label>
            <span className="text-xs text-zinc-400">{wordCount} words total</span>
          </div>
          <textarea
            rows={14}
            value={fullNarration}
            disabled={script.isLocked}
            onChange={(e) => setFullNarration(e.target.value)}
            placeholder="Complete spoken narration script..."
            className={`w-full bg-zinc-950 border rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 font-mono leading-relaxed focus:outline-none transition-colors ${
              script.isLocked
                ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed opacity-90'
                : 'border-zinc-800 focus:border-purple-500'
            }`}
          />
        </div>
      )}

      {/* Fact Verification Advisory & Checklist */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Factuality & Verification Checklist</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          CreatorKit adheres to strict factuality standards and avoids inventing historical quotes, scientific numbers, or unverified claims. Always verify specifics before publishing:
        </p>

        {script.factVerificationNotes && script.factVerificationNotes.length > 0 ? (
          <div className="space-y-2 mt-2">
            {script.factVerificationNotes.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{note}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-zinc-950 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>No questionable or uncertain claims flagged by AI analysis.</span>
          </div>
        )}
      </div>

      {/* Regenerate Script Modal */}
      {isRegenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Regenerate Script with AI</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegenModalOpen(false)}
                disabled={isRegenerating}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Gemini will rewrite the hook, body, and conclusion based on your project settings. Your current draft will be replaced in the editor.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Optional Guidance / Revision Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Make the hook even more shocking, simplify the technical terminology, or focus more on the human angle..."
                value={regenInstructions}
                onChange={(e) => setRegenInstructions(e.target.value)}
                disabled={isRegenerating}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRegenModalOpen(false)}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateScript}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg transition-colors disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Regenerate Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
