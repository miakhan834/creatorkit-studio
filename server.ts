import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init of GoogleGenAI using environment variable
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/generate-plan
app.post('/api/generate-plan', async (req, res) => {
  try {
    const {
      title,
      topic,
      platform,
      language,
      format,
      targetDuration,
      style,
      tone,
      intendedAudience,
    } = req.body;

    if (!topic || !title) {
      return res.status(400).json({ error: 'Project title and video topic are required.' });
    }

    const ai = getAIClient();

    const isShort = format === 'Short' || platform === 'YouTube Shorts' || platform === 'TikTok' || platform === 'Instagram Reels';
    const aspectRatio = isShort ? '9:16 vertical video' : '16:9 widescreen video';
    const approxSceneCount = isShort ? '4 to 6 concise scenes' : '6 to 10 detailed scenes';

    const prompt = `You are CreatorKit AI, a top-tier video director and production planner for faceless YouTube, TikTok, and Instagram content creators.
Generate a complete, production-ready video production plan for:
- Title: ${title}
- Topic: ${topic}
- Target Platform: ${platform} (${aspectRatio})
- Language: ${language} (Write all narration, hook, subtitles, and conclusions strictly in ${language})
- Format: ${format}
- Target Duration: ${targetDuration}
- Style: ${style}
- Tone: ${tone || 'Engaging & retention-focused'}
- Target Audience: ${intendedAudience || 'General curious audience'}

CRITICAL FACTUALITY RULES:
- Do not invent factual claims, historical details, numbers, or attributions.
- Stick to verified facts. If any specific detail or claim might be disputed or requires the creator to double-check before publishing, explicitly list it in 'factVerificationNotes'.

STRUCTURE RULES:
- A gripping opening hook that arrests attention in the first 3 seconds.
- Scene-by-scene progression (${approxSceneCount}) where each scene has:
  * sceneNumber (sequential integer starting at 1)
  * title (descriptive short title)
  * narration (clear, spoken lines in ${language})
  * visualPrompt (rich, cinematic visual prompt optimized for Midjourney/Imagen/Stable Diffusion with subject, lighting, camera angle, mood, color palette, and mention of ${aspectRatio})
  * shotDirection (e.g., 'Macro slow-motion tracking shot', 'Drone aerial sweep', 'Fast dynamic zoom-in')
  * durationSeconds (integer seconds appropriate for the pace, sum should match target duration approx)
  * onScreenText (optional punchy text overlay or key stat)
  * transition (e.g. 'Match cut', 'Fast whip pan', 'Subtle dissolve', 'Glitch snap')
- The full narration must match the concatenation of all scenes in order.
- Estimated total duration in seconds.
- Voiceover delivery instructions (tempo, emotional inflection, pauses).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert video director specializing in high-retention faceless social video plans. Always respond with valid JSON strictly conforming to the requested schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                body: { type: Type.STRING },
                conclusion: { type: Type.STRING },
                fullNarration: { type: Type.STRING },
                estimatedDurationSeconds: { type: Type.NUMBER },
                factVerificationNotes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['hook', 'body', 'conclusion', 'fullNarration', 'estimatedDurationSeconds'],
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  shotDirection: { type: Type.STRING },
                  durationSeconds: { type: Type.NUMBER },
                  onScreenText: { type: Type.STRING },
                  transition: { type: Type.STRING },
                },
                required: ['sceneNumber', 'title', 'narration', 'visualPrompt', 'shotDirection', 'durationSeconds'],
              },
            },
            voiceoverInstructions: { type: Type.STRING },
          },
          required: ['script', 'scenes', 'voiceoverInstructions'],
        },
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('Empty response received from AI model.');
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Error generating plan:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate production plan. Please check your network and try again.',
    });
  }
});

// POST /api/regenerate-script
app.post('/api/regenerate-script', async (req, res) => {
  try {
    const {
      title,
      topic,
      platform,
      language,
      format,
      style,
      tone,
      customInstructions,
      existingScript,
    } = req.body;

    const ai = getAIClient();

    const prompt = `You are revising the video script for:
- Title: ${title}
- Topic: ${topic}
- Platform: ${platform}
- Language: ${language}
- Format: ${format}
- Style: ${style}
- Tone: ${tone}
${customInstructions ? `- Creator instructions for revision: "${customInstructions}"` : ''}
${existingScript ? `- Previous script baseline: "${existingScript.slice(0, 500)}..."` : ''}

Provide a refined, high-retention script with a punchy hook, seamless body paragraphs, and strong conclusion in ${language}. Do not invent unverified historical or factual claims; list any questionable claims in factVerificationNotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            body: { type: Type.STRING },
            conclusion: { type: Type.STRING },
            fullNarration: { type: Type.STRING },
            estimatedDurationSeconds: { type: Type.NUMBER },
            factVerificationNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['hook', 'body', 'conclusion', 'fullNarration', 'estimatedDurationSeconds'],
        },
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('Empty response from AI model.');
    }
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Error regenerating script:', error);
    return res.status(500).json({
      error: error.message || 'Failed to regenerate script. Please try again.',
    });
  }
});

// POST /api/regenerate-scene-visual
app.post('/api/regenerate-scene-visual', async (req, res) => {
  try {
    const {
      sceneTitle,
      narration,
      style,
      platform,
      format,
      currentVisualPrompt,
    } = req.body;

    const ai = getAIClient();
    const isVertical = format === 'Short' || platform === 'YouTube Shorts' || platform === 'TikTok' || platform === 'Instagram Reels';
    const ratio = isVertical ? '9:16 vertical composition' : '16:9 cinematic widescreen';

    const prompt = `Generate a compelling, photorealistic / artistic visual generation prompt and camera shot direction for this video scene:
- Scene Title: ${sceneTitle}
- Scene Narration: "${narration}"
- Video Aesthetic/Style: ${style}
- Aspect Ratio Requirement: ${ratio}
${currentVisualPrompt ? `- Previous Prompt was: "${currentVisualPrompt}"` : ''}

Create a prompt optimized for state-of-the-art text-to-image/video AI models (Midjourney v6, Imagen 3, Stable Diffusion).
Include: lighting (e.g. volumetric, rim light, golden hour, moody chiaroscuro), textures, focal length, depth of field, color grading, atmosphere, and exact composition (${ratio}).
Also give an engaging camera shot direction (e.g. 'Low-angle slow tracking backward', 'Hyperlapse rotation', 'Handheld close-up with shallow depth').`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            shotDirection: { type: Type.STRING },
          },
          required: ['visualPrompt', 'shotDirection'],
        },
      },
    });

    const text = response.text?.trim() || '';
    if (!text) throw new Error('Empty response from AI.');
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Error regenerating visual prompt:', error);
    return res.status(500).json({
      error: error.message || 'Failed to regenerate visual prompt.',
    });
  }
});

// POST /api/regenerate-scene-narration
app.post('/api/regenerate-scene-narration', async (req, res) => {
  try {
    const {
      sceneTitle,
      language,
      style,
      tone,
      prevNarration,
      nextNarration,
      currentNarration,
      durationSeconds,
    } = req.body;

    const ai = getAIClient();

    const prompt = `You are a script doctor rewriting the voiceover narration for ONE scene in a video plan:
- Scene: ${sceneTitle}
- Target Duration: ~${durationSeconds || 5} seconds (around ${Math.round((durationSeconds || 5) * 2.3)} words)
- Language: ${language} (Write strictly in ${language})
- Style: ${style}
- Tone: ${tone}
${prevNarration ? `- Previous scene narration ended with: "${prevNarration}"` : '- This is the first scene.'}
${currentNarration ? `- Current draft to improve: "${currentNarration}"` : ''}
${nextNarration ? `- Next scene will continue with: "${nextNarration}"` : '- This is the final scene.'}

Provide revised narration that flows seamlessly into surrounding scenes, maintains viewer attention, and matches the target duration.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narration: { type: Type.STRING },
          },
          required: ['narration'],
        },
      },
    });

    const text = response.text?.trim() || '';
    if (!text) throw new Error('Empty response from AI.');
    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Error regenerating narration:', error);
    return res.status(500).json({
      error: error.message || 'Failed to regenerate scene narration.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CreatorKit server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
