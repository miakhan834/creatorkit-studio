import { Project } from '../types/creator';
import { buildSRTString, buildTranscriptString } from './subtitles';

/**
 * Triggers a real browser file download with specified filename and MIME type.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sanitizes project title for safe filenames
 */
export function sanitizeFilename(title: string, fallback = 'project'): string {
  const safe = (title || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return safe || fallback;
}

/**
 * Exports the Complete Production Plan as TXT
 */
export function exportProductionPlanTXT(project: Project): void {
  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  let content = `=================================================================
CREATORKIT — SCENE CONTROL PRODUCTION PLAN
=================================================================
Project Title:      ${project.title}
Topic:              ${project.topic}
Target Platform:    ${project.platform}
Language:           ${project.language}
Format:             ${project.format} (Target: ${project.targetDuration})
Aesthetic / Style:  ${project.style}
Tone / Vibe:        ${project.tone || 'Dynamic & engaging'}
Target Audience:    ${project.intendedAudience || 'General audience'}
Total Scenes:       ${project.scenes.length}
Est. Total Runtime: ${durationFormatted} (${totalDuration} seconds)
Last Updated:       ${new Date(project.updatedAt).toLocaleString()}
=================================================================

-----------------------------------------------------------------
1. SCRIPT OVERVIEW
-----------------------------------------------------------------
[HOOK / OPENING 3-5 SECONDS]
${project.script.hook || 'N/A'}

[MAIN BODY NARRATION]
${project.script.body || 'N/A'}

[CONCLUSION / OUTRO / CTA]
${project.script.conclusion || 'N/A'}

${project.script.factVerificationNotes && project.script.factVerificationNotes.length > 0 ? `
[FACT VERIFICATION NOTES]
The creator should verify the following claims before publishing:
${project.script.factVerificationNotes.map((note, i) => `  ${i + 1}. ${note}`).join('\n')}
` : ''}

-----------------------------------------------------------------
2. VOICEOVER DELIVERY GUIDELINES
-----------------------------------------------------------------
${project.voiceoverInstructions || 'Pacing: Confident and clear with intentional pauses between key revelations.'}

-----------------------------------------------------------------
3. SCENE-BY-SCENE PRODUCTION BREAKDOWN
-----------------------------------------------------------------
`;

  project.scenes.forEach((scene, index) => {
    content += `
--- SCENE ${scene.sceneNumber || index + 1}: ${scene.title.toUpperCase()} [~${scene.durationSeconds}s] ---
Shot / Camera Direction:
  ${scene.shotDirection || 'Static medium shot'}

Voiceover Narration:
  "${scene.narration}"

Visual Generation Prompt:
  ${scene.visualPrompt}

${scene.onScreenText ? `On-Screen Text Overlay:\n  "${scene.onScreenText}"\n` : ''}${scene.transition ? `Transition to Next Scene:\n  ${scene.transition}\n` : ''}`;
  });

  content += `
=================================================================
Generated via CreatorKit — Scene Control Studio
From Idea to Editable Video Plan
=================================================================
`;

  const filename = `${sanitizeFilename(project.title)}-production-plan.txt`;
  triggerFileDownload(content, filename);
}

/**
 * Exports Script as TXT
 */
export function exportScriptTXT(project: Project): void {
  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) || project.script.estimatedDurationSeconds || 60;
  const content = `TITLE: ${project.title}
PLATFORM: ${project.platform}
EST. DURATION: ${totalDuration} seconds
LANGUAGE: ${project.language}

=== HOOK ===
${project.script.hook}

=== FULL NARRATION SCRIPT ===
${project.script.fullNarration || project.scenes.map(s => s.narration).join('\n\n')}

=== CONCLUSION / CTA ===
${project.script.conclusion}

${project.script.factVerificationNotes && project.script.factVerificationNotes.length > 0 ? `
=== FACT VERIFICATION NOTES ===
${project.script.factVerificationNotes.map((note, i) => `${i + 1}. ${note}`).join('\n')}
` : ''}`;

  const filename = `${sanitizeFilename(project.title)}-script.txt`;
  triggerFileDownload(content, filename);
}

/**
 * Exports Storyboard as JSON
 */
export function exportStoryboardJSON(project: Project): void {
  const data = JSON.stringify(project, null, 2);
  const filename = `${sanitizeFilename(project.title)}-storyboard.json`;
  triggerFileDownload(data, filename, 'application/json');
}

/**
 * Exports Subtitles as SRT
 */
export function exportSubtitlesSRT(project: Project): void {
  const srtContent = buildSRTString(project.subtitles);
  const filename = `${sanitizeFilename(project.title)}-subtitles.srt`;
  triggerFileDownload(srtContent, filename, 'text/plain;charset=utf-8');
}

/**
 * Exports Scene Prompts as TXT
 */
export function exportScenePromptsTXT(project: Project): void {
  const isVertical = project.format === 'Short' || project.platform !== 'YouTube';
  const ratio = isVertical ? '--ar 9:16' : '--ar 16:9';

  let content = `=================================================================
SCENE VISUAL PROMPTS FOR AI GENERATORS (Midjourney / Imagen / SD)
Project: ${project.title}
Aspect Ratio: ${isVertical ? '9:16 (Vertical)' : '16:9 (Widescreen)'}
=================================================================\n\n`;

  project.scenes.forEach((scene, index) => {
    content += `[SCENE ${scene.sceneNumber || index + 1}] ${scene.title} (~${scene.durationSeconds}s)
Camera/Direction: ${scene.shotDirection}
Visual Prompt:
${scene.visualPrompt} ${ratio}

Narration Context: "${scene.narration}"
-----------------------------------------------------------------\n\n`;
  });

  const filename = `${sanitizeFilename(project.title)}-scene-prompts.txt`;
  triggerFileDownload(content, filename);
}

/**
 * Exports plain text transcript
 */
export function exportTranscriptTXT(project: Project): void {
  const content = buildTranscriptString(project.subtitles);
  const filename = `${sanitizeFilename(project.title)}-transcript.txt`;
  triggerFileDownload(content, filename);
}
