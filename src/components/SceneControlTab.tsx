import React, { useState } from 'react';
import {
  Clapperboard,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Camera,
  Clock,
  Type as TypeIcon,
  ArrowRightLeft,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  Loader2,
  FileText
} from 'lucide-react';
import { Project, Scene } from '../types/creator';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SceneControlTabProps {
  project: Project;
  onUpdateScenes: (updatedScenes: Scene[]) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
}

export const SceneControlTab: React.FC<SceneControlTabProps> = ({
  project,
  onUpdateScenes,
  onShowToast,
}) => {
  const { scenes, script } = project;

  // Track scene being edited in expanded detail mode or inline
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(scenes[0]?.id || null);

  // Deletion modal state
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);

  // AI loading states per scene
  const [loadingVisualSceneId, setLoadingVisualSceneId] = useState<string | null>(null);
  const [loadingNarrationSceneId, setLoadingNarrationSceneId] = useState<string | null>(null);

  const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Move Scene Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...scenes];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    // re-index scene numbers
    const updated = reordered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(updated);
  };

  // Move Scene Down
  const handleMoveDown = (index: number) => {
    if (index === scenes.length - 1) return;
    const reordered = [...scenes];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    // re-index scene numbers
    const updated = reordered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(updated);
  };

  // Add Scene
  const handleAddScene = () => {
    const newSceneNumber = scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sceneNumber: newSceneNumber,
      title: `Scene ${newSceneNumber}`,
      narration: '',
      visualPrompt: `Cinematic visual illustrating Scene ${newSceneNumber}, photorealistic, dramatic lighting, high detail.`,
      shotDirection: 'Medium establishing tracking shot',
      durationSeconds: 5,
      onScreenText: '',
      transition: 'Cut',
    };
    const updated = [...scenes, newScene];
    onUpdateScenes(updated);
    setExpandedSceneId(newScene.id);
    onShowToast({
      type: 'success',
      title: 'Scene Added',
      message: `Scene ${newSceneNumber} created and appended to the storyboard.`,
    });
  };

  // Duplicate Scene
  const handleDuplicateScene = (scene: Scene, index: number) => {
    const duplicated: Scene = {
      ...scene,
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${scene.title} (Copy)`,
    };
    const updated = [...scenes.slice(0, index + 1), duplicated, ...scenes.slice(index + 1)].map(
      (s, idx) => ({ ...s, sceneNumber: idx + 1 })
    );
    onUpdateScenes(updated);
    setExpandedSceneId(duplicated.id);
    onShowToast({
      type: 'success',
      title: 'Scene Duplicated',
      message: `Created duplicate of "${scene.title}".`,
    });
  };

  // Delete Scene confirmed
  const handleConfirmDelete = () => {
    if (!sceneToDelete) return;
    const filtered = scenes.filter((s) => s.id !== sceneToDelete.id);
    const updated = filtered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(updated);
    if (expandedSceneId === sceneToDelete.id) {
      setExpandedSceneId(updated[0]?.id || null);
    }
    onShowToast({
      type: 'info',
      title: 'Scene Deleted',
      message: `Deleted "${sceneToDelete.title}".`,
    });
    setSceneToDelete(null);
  };

  // Update single field of scene
  const handleSceneFieldChange = (sceneId: string, field: keyof Scene, value: any) => {
    if (field === 'narration' && script.isLocked) {
      onShowToast({
        type: 'error',
        title: 'Script is Locked',
        message: 'The script is currently locked. Unlock it in Script Studio or toggle lock before altering scene narration.',
      });
      return;
    }

    const updated = scenes.map((s) => {
      if (s.id === sceneId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onUpdateScenes(updated);
  };

  // Copy individual scene to clipboard
  const handleCopyScene = (scene: Scene) => {
    const text = `--- SCENE ${scene.sceneNumber}: ${scene.title.toUpperCase()} [~${scene.durationSeconds}s] ---
Camera / Direction: ${scene.shotDirection}
Narration: "${scene.narration}"
Visual Prompt: ${scene.visualPrompt}
${scene.onScreenText ? `On-Screen Text: "${scene.onScreenText}"\n` : ''}${scene.transition ? `Transition: ${scene.transition}\n` : ''}`;

    navigator.clipboard.writeText(text);
    onShowToast({
      type: 'success',
      title: 'Scene Copied',
      message: `Scene ${scene.sceneNumber} details copied to clipboard.`,
    });
  };

  // Regenerate Visual Prompt for single scene
  const handleRegenerateVisual = async (scene: Scene) => {
    setLoadingVisualSceneId(scene.id);
    try {
      const response = await fetch('/api/regenerate-scene-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle: scene.title,
          narration: scene.narration,
          style: project.style,
          platform: project.platform,
          format: project.format,
          currentVisualPrompt: scene.visualPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate visual prompt');

      const updated = scenes.map((s) => {
        if (s.id === scene.id) {
          return {
            ...s,
            visualPrompt: data.visualPrompt || s.visualPrompt,
            shotDirection: data.shotDirection || s.shotDirection,
          };
        }
        return s;
      });

      onUpdateScenes(updated);
      onShowToast({
        type: 'success',
        title: 'Visual Prompt Updated',
        message: `Scene ${scene.sceneNumber} visual prompt & camera direction enhanced.`,
      });
    } catch (err: any) {
      onShowToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Could not regenerate visual prompt. Existing prompt preserved.',
      });
    } finally {
      setLoadingVisualSceneId(null);
    }
  };

  // Regenerate Narration for single scene (ONLY allowed if unlocked)
  const handleRegenerateNarration = async (scene: Scene, index: number) => {
    if (script.isLocked) {
      onShowToast({
        type: 'error',
        title: 'Action Blocked: Script Locked',
        message: 'Scene narration cannot be rewritten while the script is locked. Unlock script in Script Studio first.',
      });
      return;
    }

    setLoadingNarrationSceneId(scene.id);
    try {
      const prevScene = index > 0 ? scenes[index - 1] : null;
      const nextScene = index < scenes.length - 1 ? scenes[index + 1] : null;

      const response = await fetch('/api/regenerate-scene-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle: scene.title,
          language: project.language,
          style: project.style,
          tone: project.tone,
          prevNarration: prevScene?.narration || '',
          nextNarration: nextScene?.narration || '',
          currentNarration: scene.narration,
          durationSeconds: scene.durationSeconds,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to rewrite narration');

      const updated = scenes.map((s) => {
        if (s.id === scene.id) {
          return { ...s, narration: data.narration || s.narration };
        }
        return s;
      });

      onUpdateScenes(updated);
      onShowToast({
        type: 'success',
        title: 'Narration Rewritten',
        message: `Scene ${scene.sceneNumber} narration refreshed seamlessly.`,
      });
    } catch (err: any) {
      onShowToast({
        type: 'error',
        title: 'Rewriting Failed',
        message: err.message || 'Could not rewrite narration. Current text preserved.',
      });
    } finally {
      setLoadingNarrationSceneId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-purple-400" />
              Scene Control Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sequence, timing, visual generation prompts, and camera directions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <span className="text-zinc-500">Total Runtime:</span>
              <span className="text-purple-300 font-bold">{durationFormatted}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-semibold">{scenes.length} Scenes</span>
            </div>

            <button
              type="button"
              onClick={handleAddScene}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scene</span>
            </button>
          </div>
        </div>

        {/* Lock advisory banner */}
        {script.isLocked && (
          <div className="mt-3 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Script is locked:</strong> You can edit visuals, shots, transitions, and durations freely. Narration text editing and AI narration rewrites are protected.
            </span>
          </div>
        )}
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        {scenes.map((scene, index) => {
          const isExpanded = expandedSceneId === scene.id;
          const isFirst = index === 0;
          const isLast = index === scenes.length - 1;
          const isVisualLoading = loadingVisualSceneId === scene.id;
          const isNarrationLoading = loadingNarrationSceneId === scene.id;

          return (
            <div
              key={scene.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-zinc-900 border-purple-500/80 shadow-xl ring-1 ring-purple-500/20'
                  : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Scene Card Header */}
              <div
                onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                className="p-4 sm:px-5 flex items-center justify-between gap-3 cursor-pointer select-none bg-zinc-900/90 border-b border-zinc-800/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Scene Number Badge */}
                  <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {scene.sceneNumber || index + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {scene.title || `Scene ${index + 1}`}
                      </span>
                      <span className="text-[11px] text-zinc-400 px-2 py-0.2 rounded-full bg-zinc-800 border border-zinc-700/60 shrink-0">
                        {scene.durationSeconds}s
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-md sm:max-w-xl">
                        "{scene.narration || '(No narration text)'}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Quick Controls */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Move Scene Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Move Scene Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Copy scene */}
                  <button
                    type="button"
                    onClick={() => handleCopyScene(scene)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Copy Scene"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate scene */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateScene(scene, index)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Duplicate Scene"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete scene */}
                  <button
                    type="button"
                    onClick={() => setSceneToDelete(scene)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4 bg-zinc-950/40">
                  {/* Title & Duration & Transition Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Scene Title
                      </label>
                      <input
                        type="text"
                        value={scene.title}
                        onChange={(e) => handleSceneFieldChange(scene.id, 'title', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={scene.durationSeconds}
                        onChange={(e) =>
                          handleSceneFieldChange(
                            scene.id,
                            'durationSeconds',
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                        Transition to Next
                      </label>
                      <input
                        type="text"
                        value={scene.transition || ''}
                        placeholder="e.g. Cut, Whip Pan, Dissolve"
                        onChange={(e) => handleSceneFieldChange(scene.id, 'transition', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Narration Text Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        Voiceover Narration
                        {script.isLocked && (
                          <span className="text-[10px] text-amber-400 font-semibold ml-1">
                            (Locked)
                          </span>
                        )}
                      </label>

                      {/* AI Rewrite Narration Button */}
                      <button
                        type="button"
                        disabled={script.isLocked || isNarrationLoading}
                        onClick={() => handleRegenerateNarration(scene, index)}
                        className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          script.isLocked
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-purple-300 hover:text-white'
                        }`}
                        title={
                          script.isLocked
                            ? 'Unlock script in Script Studio to allow AI narration rewrites'
                            : 'Ask Gemini to rewrite this scene narration to flow seamlessly'
                        }
                      >
                        {isNarrationLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>AI Rewrite Narration</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={scene.narration}
                      disabled={script.isLocked}
                      onChange={(e) => handleSceneFieldChange(scene.id, 'narration', e.target.value)}
                      placeholder="Enter spoken voiceover words for this scene..."
                      className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                        script.isLocked
                          ? 'border-zinc-800/80 bg-zinc-950/60 cursor-not-allowed text-zinc-400'
                          : 'border-zinc-800 focus:border-purple-500'
                      }`}
                    />
                  </div>

                  {/* Visual Generation Prompt Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                        Visual Generation Prompt (Midjourney / Imagen / SD)
                      </label>

                      {/* AI Regenerate Visual Prompt Button */}
                      <button
                        type="button"
                        disabled={isVisualLoading}
                        onClick={() => handleRegenerateVisual(scene)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-purple-300 hover:text-white transition-colors"
                      >
                        {isVisualLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>AI Enhance Visual Prompt</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={scene.visualPrompt}
                      onChange={(e) => handleSceneFieldChange(scene.id, 'visualPrompt', e.target.value)}
                      placeholder="Visual prompt details: subject, lighting, mood, camera lens, color grading..."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Shot Direction & On-Screen Text Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-blue-400" />
                        Shot / Camera Direction
                      </label>
                      <input
                        type="text"
                        value={scene.shotDirection}
                        placeholder="e.g. Extreme close-up tracking, drone overhead sweep"
                        onChange={(e) => handleSceneFieldChange(scene.id, 'shotDirection', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                        <TypeIcon className="w-3 h-3 text-emerald-400" />
                        On-Screen Text Overlay (Optional)
                      </label>
                      <input
                        type="text"
                        value={scene.onScreenText || ''}
                        placeholder="e.g. FACT #1, 10,000 METERS, KEY STAT"
                        onChange={(e) => handleSceneFieldChange(scene.id, 'onScreenText', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!sceneToDelete}
        title="Delete Scene"
        message={
          sceneToDelete
            ? `Are you sure you want to delete Scene ${sceneToDelete.sceneNumber} ("${sceneToDelete.title}")? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Scene"
        onConfirm={handleConfirmDelete}
        onCancel={() => setSceneToDelete(null)}
      />
    </div>
  );
};
