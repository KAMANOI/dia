import { safeTrim } from './safeTrim';

export type MediaKind = 'image' | 'video';
export const IMAGE_TOOLS = [
  ['midjourney', 'Midjourney'], ['niji', 'niji・journey'],
  ['novelai', 'NovelAI'], ['sd', 'Stable Diffusion'],
  ['flux', 'Flux'], ['gpt-image', 'GPT Image'], ['dalle', 'DALL·E'],
  ['nanobanana', 'nanobananaPRO'],
] as const;
export const VIDEO_TOOLS = [
  ['kling', 'Kling'], ['hailuo', 'Hailuo'], ['seedance', 'Seedance'],
  ['happyhorse', 'HappyHorse'], ['runway', 'Runway'], ['luma', 'Luma'],
  ['vidu', 'Vidu'], ['pika', 'Pika'],
] as const;
export type MediaTool = (typeof IMAGE_TOOLS)[number][0] | (typeof VIDEO_TOOLS)[number][0];
export const STYLES = [['photorealistic', '写真風'], ['anime illustration', 'アニメ・イラスト'], ['watercolor', '水彩画'], ['cinematic', 'シネマティック'], ['minimalist', 'ミニマル']] as const;
export const MOODS = [['calm', '穏やか'], ['cheerful', '明るい'], ['mysterious', 'ミステリアス'], ['dramatic', 'ドラマティック'], ['dreamlike', '幻想的']] as const;
export const LIGHTING = [['natural light', '自然光'], ['golden hour', 'ゴールデンアワー'], ['soft studio lighting', '柔らかいスタジオ照明'], ['backlighting', '逆光']] as const;
export const COMPOSITION = [['rule of thirds', '三分割法'], ['close-up', 'クローズアップ'], ['wide shot', 'ワイドショット'], ['eye-level view', 'アイレベル'], ['overhead view', '俯瞰']] as const;
export const CAMERAS = [['static camera', '固定カメラ'], ['slow dolly forward', 'ドリー前進'], ['slow dolly back', 'ドリー後退'], ['pan left to right', '左から右へパン'], ['tilt up', 'ティルトアップ'], ['orbit around the subject', '被写体の周囲を回る'], ['tracking shot', 'トラッキング'], ['aerial shot', '空撮']] as const;
export const MOTIONS = [['natural speed', '通常速度'], ['slow motion', 'スローモーション'], ['subtle movement', '控えめな動き'], ['dynamic action', 'ダイナミックな動き'], ['time lapse', 'タイムラプス']] as const;
export const RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'] as const;

export interface MediaInput {
  kind: MediaKind;
  tool: MediaTool;
  subject: string;
  scene: string;
  action: string;
  details: string;
  negative: string;
  style: string;
  mood: string;
  lighting: string;
  composition: string;
  camera: string;
  motion: string;
  ratio: string;
  version: string;
  duration: string;
}
export interface MediaVariant {
  name: 'Standard' | 'Creative' | 'Detailed';
  prompt: string;
  negative: string;
  settings: string;
}
export function initialMediaInput(kind: MediaKind): MediaInput {
  return { kind, tool: kind === 'image' ? 'midjourney' : 'kling', subject: '', scene: '', action: '', details: '', negative: '', style: '', mood: '', lighting: '', composition: '', camera: 'static camera', motion: 'natural speed', ratio: kind === 'image' ? '1:1' : '16:9', version: '6.1', duration: 'auto' };
}
const join = (parts: string[], separator = ', ') => parts.map(safeTrim).filter(Boolean).join(separator);
// Strip trailing sentence punctuation from free text so templates don't produce "猫。."
export const clean = (s: string) => safeTrim(s).replace(/[\s.。．!！?？]+$/u, '');
export const hasSeparateNegative = (tool: MediaTool) => tool === 'novelai' || tool === 'sd';

// Pure templates: identical input always produces identical output; free text is preserved.
export function buildMediaPrompts(input: MediaInput): MediaVariant[] {
  const p = { ...input, subject: clean(input.subject), scene: clean(input.scene), action: clean(input.action), details: clean(input.details), negative: clean(input.negative) };
  if (!p.subject && !(p.kind === 'video' && p.scene)) return [];
  const names = ['Standard', 'Creative', 'Detailed'] as const;
  return names.map((name, index) => {
    if (p.kind === 'video') {
      const context = join([p.subject && `Subject: ${p.subject}.`, p.scene && `Setting: ${p.scene}.`], ' ');
      const action = p.action ? `Action: ${p.action}; ${p.motion}.` : `Motion: ${p.motion}.`;
      const camera = `Camera: ${p.camera}.`;
      const treatmentParts = join([p.style, p.mood, p.lighting]);
      const style = treatmentParts ? `Visual treatment: ${treatmentParts}.` : '';
      const treatment = ['', ' Use expressive visual rhythm and layered depth while preserving the chosen action and camera movement.', ' Maintain consistent subject appearance, spatial continuity, and coherent motion throughout the shot.'][index];
      // Motion-first tools and camera-first tools retain the same selected constraints.
      const clauses = p.tool === 'runway' ? [camera, context, action, style]
        : p.tool === 'hailuo' || p.tool === 'vidu' ? [context, action, camera, style]
        : [context, style, action, camera];
      return { name, prompt: join([...clauses, p.details && `Additional details: ${p.details}.`], ' ') + treatment,
        negative: '', settings: `画面比率: ${p.ratio} / 長さ: ${p.duration === 'auto' ? 'ツール側で指定' : `${p.duration}秒`}（対応する設定をツール側で選択）` };
    }
    const tags = join([p.subject, p.style, p.mood, p.lighting, p.composition, p.details]);
    const extraTags = ['', 'expressive visual storytelling, layered depth', 'precise textures, coherent perspective, carefully resolved details'][index];
    if (p.tool === 'midjourney' || p.tool === 'niji') {
      const flags = join([`--ar ${p.ratio}`, p.tool === 'niji' ? '--niji 6' : p.version ? `--v ${p.version}` : '', p.negative ? `--no ${p.negative}` : ''], ' ');
      return { name, prompt: `${join([tags, extraTags])} ${flags}`, negative: '', settings: '' };
    }
    if (hasSeparateNegative(p.tool)) {
      const quality = p.tool === 'novelai' ? 'masterpiece, best quality, amazing quality, very aesthetic' : 'masterpiece, best quality, ultra-detailed';
      return { name, prompt: join([quality, tags, extraTags]), negative: join(['low quality, blurry, artifacts', p.negative]), settings: `画面比率: ${p.ratio}（サイズはツール側で指定）` };
    }
    const extra = ['', ' Use expressive visual storytelling and layered depth while preserving the specified subject and style.', ' Render precise textures, coherent perspective, and clearly resolved details while preserving the specified composition.'][index];
    return { name, prompt: join([
      `Create an image of ${p.subject}.`, p.style && `Style: ${p.style}.`, p.mood && `Mood: ${p.mood}.`,
      p.lighting && `Lighting: ${p.lighting}.`, p.composition && `Composition: ${p.composition}.`,
      p.details && `Additional details: ${p.details}.`, p.negative && `Avoid: ${p.negative}.`,
    ], ' ') + extra, negative: '', settings: `画面比率の希望: ${p.ratio}（対応するサイズをツール側で選択）` };
  });
}
