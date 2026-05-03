import { NextRequest, NextResponse } from 'next/server';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// ── System prompts ──────────────────────────────────────────────────────────

function buildImageSystemPrompt(): string {
  return `You are an expert AI image generation prompt engineer with deep knowledge of every major tool's syntax, tag conventions, and best practices.

TOOL SYNTAX REFERENCE:
- Midjourney: weighted tags/phrases, "--ar W:H --v 6.1 --q 2 --style raw", negative via "--no x,y,z"
- NovelAI (NAI3): comma-separated anime quality tags first (masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest), then character/scene tags. Separate negative prompt block.
- Stable Diffusion / Forge / ComfyUI: quality tags (masterpiece, best quality, ultra-detailed), subject tags, style tags. Separate negative prompt with anti-quality tags.
- nanobananaPRO: anime/illustration tag format similar to NAI3 but with platform-specific quality boosters
- Flux.1 (dev/schnell): pure natural language, no quality tags needed, very detailed descriptive sentences
- GPT Image 2 (gpt-image-1): rich natural language, describe scene/subject/lighting/style explicitly
- niji・journey: MJ tag syntax but anime-optimized, "--niji 6 --ar W:H --style expressive" or "--style cute"
- DALL-E 3: natural descriptive language, vivid and specific details

NSFW HANDLING:
- When NSFW=true: include appropriate mature/explicit content descriptors for the tool
- NAI3/SD/nanobananaPRO: use standard adult content tag conventions
- MJ/DALL-E: these tools filter NSFW; note limitations in output
- Flux/GPT Image 2: describe mature content in natural language

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "variants": [
    {
      "name": "Standard",
      "prompt": "...",
      "negative_prompt": "...",
      "parameters": "..."
    },
    {
      "name": "Creative",
      "prompt": "...",
      "negative_prompt": "...",
      "parameters": "..."
    },
    {
      "name": "Detailed",
      "prompt": "...",
      "negative_prompt": "...",
      "parameters": "..."
    }
  ]
}

Notes:
- "negative_prompt" and "parameters" may be empty string "" if not applicable for the tool
- "parameters" = tool flags/settings separate from the prompt text (e.g. "--ar 16:9 --v 6.1" for MJ)
- Each variant should be meaningfully different: Standard=balanced, Creative=bold/experimental, Detailed=maximum specificity
- Use English for all prompts regardless of input language`;
}

function buildVideoSystemPrompt(): string {
  return `You are an expert AI video generation prompt engineer with deep knowledge of every major tool's prompt structure, camera terminology, and cinematic language.

TOOL SYNTAX REFERENCE:
- Kling (快手): natural language, good with camera movement instructions, supports cinematic style descriptions
- Hailuo (MiniMax): natural language, strong motion understanding, specify subject action + camera behavior
- Seedance (ByteDance): natural language, scene description + motion + camera angle, cinematic quality
- HappyHorse 1.0 (Alibaba): natural language video description with subject, scene, motion, and style details
- Runway Gen-3 Alpha: natural language, supports detailed camera instructions (dolly in/out, pan, orbit, etc.)
- Luma Dream Machine: natural language, specify subject + environment + motion + camera behavior
- Vidu: natural language + style tags, good for dynamic motion
- Pika: natural language + optional style modifiers like "--ar 16:9"

CAMERA MOVEMENT VOCABULARY:
Push in / Pull out / Dolly forward / Dolly back / Pan left / Pan right / Tilt up / Tilt down /
Orbit / Arc shot / Crane up / Crane down / Tracking shot / Handheld / Static / Aerial /
Drone shot / Whip pan / Slow zoom / Dutch angle

MOTION VOCABULARY:
Slow motion / Time lapse / Freeze frame / Fast motion / Seamless loop / Reverse /
Subtle movement / Dynamic action / Floating / Drifting / Cascading / Swirling

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "variants": [
    {
      "name": "Standard",
      "prompt": "...",
      "negative_prompt": "",
      "parameters": ""
    },
    {
      "name": "Cinematic",
      "prompt": "...",
      "negative_prompt": "",
      "parameters": ""
    },
    {
      "name": "Detailed",
      "prompt": "...",
      "negative_prompt": "",
      "parameters": ""
    }
  ]
}

Notes:
- Video prompts should be 2-5 sentences, not a list of tags
- Always include: scene/subject + key action + camera movement + mood/style
- Each variant: Standard=clear and direct, Cinematic=film-language rich, Detailed=maximum control`;
}

// ── Request handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured (set GEMINI_API_KEY or GOOGLE_API_KEY).' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { type, tool, params } = body as {
    type: 'image' | 'video';
    tool: string;
    params: Record<string, string | boolean>;
  };

  if (!type || !tool || !params) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Build user message
  const userMessage =
    type === 'image'
      ? buildImageUserMessage(tool, params)
      : buildVideoUserMessage(tool, params);

  const systemPrompt =
    type === 'image' ? buildImageSystemPrompt() : buildVideoSystemPrompt();

  try {
    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
      },
    });

    let geminiRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1500));
      geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: requestBody,
      });
      if (geminiRes.ok || ![503, 429].includes(geminiRes.status)) break;
    }

    if (!geminiRes!.ok) {
      const errText = await geminiRes!.text();
      console.error('Gemini API error:', geminiRes!.status, errText);
      return NextResponse.json(
        { error: 'Prompt generation failed. Please try again.' },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsed: { variants: Variant[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback: try to extract JSON from text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: 'Failed to parse Gemini response.' },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({ variants: parsed.variants ?? [] });
  } catch (err) {
    console.error('Media prompt generation error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ── Message builders ────────────────────────────────────────────────────────

type Params = Record<string, string | boolean>;

function cap(val: unknown, max = 300): string {
  const s = typeof val === 'string' ? val : '';
  return s.slice(0, max);
}

function buildImageUserMessage(tool: string, params: Params): string {
  const lines = [
    `TOOL: ${cap(tool, 50)}`,
    `SUBJECT/SCENE: ${cap(params.subject) || '(not specified)'}`,
    `STYLE: ${cap(params.style) || '(not specified)'}`,
    `MOOD/ATMOSPHERE: ${cap(params.mood) || '(not specified)'}`,
    `LIGHTING: ${cap(params.lighting) || '(not specified)'}`,
    `COMPOSITION: ${cap(params.composition) || '(not specified)'}`,
    `ASPECT RATIO: ${cap(params.aspectRatio, 20) || '1:1'}`,
    `NSFW: ${params.nsfw ? 'YES — include mature/adult content appropriate for this tool' : 'NO — keep safe for work'}`,
  ];

  if (params.characterDetail) lines.push(`CHARACTER DETAIL: ${cap(params.characterDetail)}`);
  if (params.additionalTags) lines.push(`ADDITIONAL TAGS/DETAILS: ${cap(params.additionalTags)}`);
  if (params.negativePrompt) lines.push(`REQUESTED NEGATIVE PROMPT ELEMENTS: ${cap(params.negativePrompt)}`);
  if (params.mjVersion) lines.push(`MIDJOURNEY VERSION: v${cap(params.mjVersion, 10)}`);

  lines.push('\nGenerate 3 optimized prompt variants for this tool and input.');
  return lines.join('\n');
}

function buildVideoUserMessage(tool: string, params: Params): string {
  const lines = [
    `TOOL: ${cap(tool, 50)}`,
    `SCENE/SETTING: ${cap(params.scene) || '(not specified)'}`,
    `SUBJECT/CHARACTER: ${cap(params.subject) || '(not specified)'}`,
    `ACTION/MOTION: ${cap(params.action) || '(not specified)'}`,
    `CAMERA MOVEMENT: ${cap(params.cameraMovement) || '(not specified)'}`,
    `STYLE/AESTHETIC: ${cap(params.style) || '(not specified)'}`,
    `MOOD/ATMOSPHERE: ${cap(params.mood) || '(not specified)'}`,
    `ASPECT RATIO: ${cap(params.aspectRatio, 20) || '16:9'}`,
    `DURATION: ${cap(params.duration, 20) || 'auto'}`,
    `NSFW: ${params.nsfw ? 'YES — include mature/adult content appropriate for this tool' : 'NO — keep safe for work'}`,
  ];

  if (params.additionalDetails) lines.push(`ADDITIONAL DETAILS: ${cap(params.additionalDetails)}`);

  lines.push('\nGenerate 3 optimized video prompt variants for this tool and input.');
  return lines.join('\n');
}

interface Variant {
  name: string;
  prompt: string;
  negative_prompt: string;
  parameters: string;
}
