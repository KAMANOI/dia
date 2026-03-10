import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** @vercel/og 同梱の Noto Sans Latin TTF（常に利用可能・フォールバック用） */
function loadLocalFont(): ArrayBuffer {
  const p = join(
    process.cwd(),
    'node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf'
  );
  const buf = readFileSync(p);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
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
  const geistData = loadLocalFont();
  const notoData = await fetchNotoSansJP();

  type W = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  const fonts: { name: string; data: ArrayBuffer; weight: W }[] = [
    { name: 'NotoSans', data: geistData, weight: 400 },
  ];
  if (notoData) {
    fonts.push({ name: 'NotoSansJP', data: notoData, weight: 700 });
  }

  // 日本語フォントが取得できた場合のみ日本語フォントを適用
  const fontFamily = notoData ? 'NotoSansJP, NotoSans' : 'NotoSans';

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
    { ...size, fonts }
  );
}
