import { ImageResponse } from 'next/og';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * @vercel/og 同梱の Latin TTF（日本語フォントが取れない時のフォールバック）。
 * ファイル名は Next のバージョンで変わる（16 で noto-sans-v27-latin-regular.ttf →
 * Geist-Regular.ttf にリネームされ、決め打ちしていたパスがビルドを落とした）。
 * 名前を決め打ちせずディレクトリ内の .ttf を拾い、取れなければ null を返して
 * ImageResponse の既定フォントに委ねる＝OG画像のためにビルドを落とさない。
 */
function loadLocalFont(): ArrayBuffer | null {
  try {
    const dir = join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og');
    const file = readdirSync(dir).find(f => f.endsWith('.ttf'));
    if (!file) return null;
    const buf = readFileSync(join(dir, file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

/** Noto Sans JP（日本語グリフ用・ネットワーク不達時は null） */
async function fetchNotoSansJP(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then((r) => r.text());
    const match = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
    if (!match) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OGImage() {
  const latinData = loadLocalFont();
  const notoData = await fetchNotoSansJP();

  type W = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  const fonts: { name: string; data: ArrayBuffer; weight: W }[] = [];
  if (latinData) {
    fonts.push({ name: 'Fallback', data: latinData, weight: 400 });
  }
  if (notoData) {
    fonts.push({ name: 'NotoSansJP', data: notoData, weight: 700 });
  }

  // 日本語フォントが取得できた場合のみ日本語フォントを適用
  const fontFamily = notoData ? 'NotoSansJP, Fallback' : 'Fallback';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily,
        }}
      >
        {/* ロゴ */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-4px',
            lineHeight: 1,
          }}
        >
          DIA
        </div>

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: '#999999',
            marginTop: 20,
            letterSpacing: '0.5px',
          }}
        >
          AI Prompt Generator
        </div>

        {/* サブコピー */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#555555',
            marginTop: 36,
          }}
        >
          {notoData ? '日本語 → AIプロンプト生成' : 'Nihongo -> AI Prompt'}
        </div>
      </div>
    ),
    // fonts が空なら渡さない（ImageResponse の既定フォントに委ねる）
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
