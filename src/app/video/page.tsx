'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

// ── Types ───────────────────────────────────────────────────────────────────

type VideoTool =
  | 'kling'
  | 'hailuo'
  | 'seedance'
  | 'happyhorse'
  | 'runway'
  | 'luma'
  | 'vidu'
  | 'pika';

interface Variant {
  name: string;
  prompt: string;
  negative_prompt: string;
  parameters: string;
}

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: { id: VideoTool; label: string; sub: string; accent: string }[] = [
  { id: 'kling',       label: 'Kling',         sub: '快手 KlingAI',   accent: '#f59e0b' },
  { id: 'hailuo',      label: 'Hailuo',        sub: 'MiniMax',        accent: '#3b82f6' },
  { id: 'seedance',    label: 'Seedance',       sub: 'ByteDance',      accent: '#ec4899' },
  { id: 'happyhorse',  label: 'HappyHorse',     sub: 'Alibaba 1.0',    accent: '#f97316' },
  { id: 'runway',      label: 'Runway',         sub: 'Gen-3 Alpha',    accent: '#8b5cf6' },
  { id: 'luma',        label: 'Luma',           sub: 'Dream Machine',  accent: '#14b8a6' },
  { id: 'vidu',        label: 'Vidu',           sub: 'Vidu Studio',    accent: '#a78bfa' },
  { id: 'pika',        label: 'Pika',           sub: 'Pika 2.0',       accent: '#22c55e' },
];

const CAMERA_MOVEMENTS = [
  'スローズームイン', 'スローズームアウト', 'パン（左→右）', 'パン（右→左）',
  'ドリー前進', 'ドリー後退', 'ティルトアップ', 'ティルトダウン',
  'オービット', 'エアリアル・ドローン', 'トラッキングショット',
  'ハンドヘルド', '静止（スタティック）', 'クレーンアップ',
];

const STYLES = [
  'シネマティック', 'フォトリアリスティック', 'アニメ・3D', 'ドキュメンタリー',
  'ミュージックビデオ', 'CM・広告', 'ホラー', 'ファンタジー・魔法',
  'ノワール', 'スタジオ照明', 'ヴィンテージフィルム', 'サイバーパンク',
];

const MOODS = [
  'エピック・壮大', 'ロマンティック', 'セクシー・官能的', 'ミステリアス',
  'コメディ・ポップ', 'ダーク・スリラー', 'ドリーミー', 'インティメット',
  'アクション・ダイナミック', 'メランコリック', 'エレガント', 'サスペンス',
];

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9', '2:3'];

const DURATIONS = ['auto', '3秒', '5秒', '6秒', '8秒', '10秒'];

// ── Component ───────────────────────────────────────────────────────────────

export default function VideoPromptPage() {
  const [selectedTool, setSelectedTool] = useState<VideoTool>('kling');
  const [scene, setScene] = useState('');
  const [subject, setSubject] = useState('');
  const [action, setAction] = useState('');
  const [cameraMovement, setCameraMovement] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState('auto');
  const [nsfw, setNsfw] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');

  const [variants, setVariants] = useState<Variant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const currentTool = TOOLS.find(t => t.id === selectedTool)!;

  const handleGenerate = useCallback(async () => {
    if (!scene.trim() && !subject.trim()) return;
    setIsGenerating(true);
    setError('');
    setVariants([]);

    try {
      const res = await fetch('/api/media-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          tool: selectedTool,
          params: {
            scene, subject, action, cameraMovement,
            style, mood, aspectRatio, duration, nsfw,
            ...(additionalDetails && { additionalDetails }),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setVariants(data.variants ?? []);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  }, [scene, subject, action, cameraMovement, style, mood, aspectRatio, duration, nsfw, additionalDetails, selectedTool]);

  const handleCopy = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const canGenerate = scene.trim().length > 0 || subject.trim().length > 0;

  return (
    <div className="media-page" data-tool={selectedTool}>
      <style>{DARK_STYLES}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mp-header">
        <Link href="/" className="mp-logo">DIA</Link>
        <nav className="mp-nav">
          <Link href="/image" className="mp-nav-link">画像</Link>
          <Link href="/video" className="mp-nav-link mp-nav-active">動画</Link>
        </nav>
      </header>

      <main className="mp-main">

        {/* ── Hero ───────────────────────────────────────────── */}
        <div className="mp-hero">
          <div className="mp-hero-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }}>
            VIDEO PROMPT
          </div>
          <h1 className="mp-hero-title">動画生成プロンプト</h1>
          <p className="mp-hero-sub">ツールを選んでシーンとカメラを指定するだけで、各AIに最適化した動画プロンプトを3バリアント生成します。</p>
        </div>

        {/* ── Tool selector ──────────────────────────────────── */}
        <section className="mp-section">
          <div className="mp-section-label">ツールを選択</div>
          <div className="mp-tool-grid">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`mp-tool-chip ${selectedTool === tool.id ? 'mp-tool-chip-active' : ''}`}
                style={selectedTool === tool.id ? { '--chip-accent': tool.accent } as React.CSSProperties : undefined}
              >
                <span className="mp-tool-name">{tool.label}</span>
                <span className="mp-tool-sub">{tool.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Parameters ─────────────────────────────────────── */}
        <section className="mp-section">
          <div className="mp-section-label">シーン・パラメーター</div>

          <div className="mp-form">

            {/* Scene */}
            <div className="mp-field">
              <label className="mp-label">
                シーン・舞台設定 <span className="mp-required">必須</span>
              </label>
              <textarea
                className="mp-textarea"
                placeholder="例: 夕暮れの東京・新宿の路地裏、ネオンサインが反射する雨に濡れた石畳"
                value={scene}
                onChange={e => setScene(e.target.value)}
                rows={2}
              />
            </div>

            {/* Subject */}
            <div className="mp-field">
              <label className="mp-label">被写体・キャラクター</label>
              <textarea
                className="mp-textarea mp-textarea-sm"
                placeholder="例: 黒いコートを着た女性、傘を持ってゆっくり歩いている"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action */}
            <div className="mp-field">
              <label className="mp-label">動き・アクション</label>
              <input
                className="mp-input"
                placeholder="例: 振り返ってカメラを見る、髪が風に揺れる、スローモーション"
                value={action}
                onChange={e => setAction(e.target.value)}
              />
            </div>

            {/* Camera movement */}
            <div className="mp-field">
              <label className="mp-label">カメラワーク</label>
              <div className="mp-chip-wrap">
                {CAMERA_MOVEMENTS.map(cm => (
                  <button
                    key={cm}
                    onClick={() => setCameraMovement(cameraMovement === cm ? '' : cm)}
                    className={`mp-param-chip ${cameraMovement === cm ? 'mp-param-chip-on' : ''}`}
                    style={cameraMovement === cm ? { '--accent': currentTool.accent, borderColor: 'var(--chip-accent)', background: `color-mix(in srgb, ${currentTool.accent} 12%, transparent)` } as React.CSSProperties : undefined}
                  >{cm}</button>
                ))}
              </div>
            </div>

            {/* Style + Mood */}
            <div className="mp-row">
              <div className="mp-field mp-field-half">
                <label className="mp-label">スタイル・映像表現</label>
                <div className="mp-chip-wrap">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(style === s ? '' : s)}
                      className={`mp-param-chip ${style === s ? 'mp-param-chip-on' : ''}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="mp-field mp-field-half">
                <label className="mp-label">ムード・トーン</label>
                <div className="mp-chip-wrap">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(mood === m ? '' : m)}
                      className={`mp-param-chip ${mood === m ? 'mp-param-chip-on' : ''}`}
                    >{m}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect ratio + Duration */}
            <div className="mp-row">
              <div className="mp-field mp-field-half">
                <label className="mp-label">アスペクト比</label>
                <div className="mp-ar-grid">
                  {ASPECT_RATIOS.map(ar => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`mp-ar-chip ${aspectRatio === ar ? 'mp-ar-chip-on' : ''}`}
                    >{ar}</button>
                  ))}
                </div>
              </div>
              <div className="mp-field mp-field-half">
                <label className="mp-label">長さ</label>
                <div className="mp-ar-grid">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`mp-ar-chip ${duration === d ? 'mp-ar-chip-on' : ''}`}
                    >{d}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="mp-field">
              <label className="mp-label">追加指示（任意）</label>
              <input
                className="mp-input"
                placeholder="例: 4K quality, ultra-realistic, depth of field / 特定の雰囲気・演出など"
                value={additionalDetails}
                onChange={e => setAdditionalDetails(e.target.value)}
              />
            </div>

            {/* NSFW */}
            <div className="mp-nsfw-row">
              <button
                onClick={() => setNsfw(!nsfw)}
                className={`mp-toggle ${nsfw ? 'mp-toggle-on' : ''}`}
                aria-pressed={nsfw}
              >
                <span className="mp-toggle-thumb" />
              </button>
              <span className="mp-toggle-label">NSFW / アダルトコンテンツを含む</span>
            </div>

          </div>
        </section>

        {/* ── Generate ────────────────────────────────────────── */}
        <div className="mp-generate-wrap">
          {error && <div className="mp-error">{error}</div>}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="mp-generate-btn"
            style={{ '--btn-accent': currentTool.accent } as React.CSSProperties}
          >
            {isGenerating ? (
              <><span className="mp-spinner" />生成中…</>
            ) : (
              <><VideoIcon /> プロンプトを生成</>
            )}
          </button>
          <p className="mp-generate-hint">Gemini AI が {currentTool.label} 向けに最適化した3バリアントを生成します</p>
        </div>

        {/* ── Output ─────────────────────────────────────────── */}
        {variants.length > 0 && (
          <section className="mp-output" ref={outputRef}>
            <div className="mp-section-label">生成結果 — {currentTool.label}</div>
            <div className="mp-variants">
              {variants.map((v, i) => (
                <div key={i} className="mp-variant-card">
                  <div className="mp-variant-head">
                    <span
                      className="mp-variant-badge"
                      style={{ '--badge-accent': currentTool.accent } as React.CSSProperties}
                    >{v.name}</span>
                    <button
                      onClick={() => handleCopy(
                        [v.prompt, v.parameters].filter(Boolean).join('\n\n'),
                        i
                      )}
                      className="mp-copy-btn"
                    >
                      {copiedIdx === i ? <><CheckIcon /> コピー済み</> : <><CopyIcon /> コピー</>}
                    </button>
                  </div>
                  <div className="mp-variant-body">
                    <div className="mp-prompt-block">
                      <div className="mp-prompt-label">Prompt</div>
                      <div className="mp-prompt-text">{v.prompt}</div>
                    </div>
                    {v.parameters && (
                      <div className="mp-prompt-block mp-param-block">
                        <div className="mp-prompt-label">Parameters</div>
                        <div className="mp-prompt-text mp-param-text">{v.parameters}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function VideoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Dark styles (same as image page) ────────────────────────────────────────

const DARK_STYLES = `
  .media-page {
    --bg: #0d0d10;
    --surface: #16171b;
    --surface-2: #1e2026;
    --border: #272930;
    --border-2: #32353f;
    --text: #f0f1f3;
    --text-2: #9aa0ad;
    --text-muted: #50576a;
    --accent: #f59e0b;
    --radius: 10px;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    -webkit-font-smoothing: antialiased;
  }
  .mp-header {
    display: flex;
    align-items: center;
    padding: 0 24px;
    height: 52px;
    border-bottom: 1px solid var(--border);
    background: rgba(13,13,16,0.95);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .mp-logo {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.5px;
    margin-right: 24px;
  }
  .mp-nav { display: flex; gap: 4px; }
  .mp-nav-link {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    text-decoration: none;
    padding: 5px 12px;
    border-radius: 6px;
    transition: color 0.12s, background 0.12s;
  }
  .mp-nav-link:hover { color: var(--text); background: var(--surface-2); }
  .mp-nav-active { color: var(--text) !important; background: var(--surface-2) !important; }
  .mp-main { max-width: 820px; margin: 0 auto; padding: 40px 24px 80px; }
  .mp-hero { margin-bottom: 40px; }
  .mp-hero-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #f59e0b;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.25);
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
  .mp-hero-title {
    font-size: clamp(26px, 4vw, 36px);
    font-weight: 700;
    letter-spacing: -0.8px;
    margin-bottom: 10px;
    line-height: 1.2;
  }
  .mp-hero-sub { font-size: 15px; color: var(--text-2); max-width: 520px; line-height: 1.6; }
  .mp-section { margin-bottom: 32px; }
  .mp-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 14px;
  }
  .mp-tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
  .mp-tool-chip {
    display: flex; flex-direction: column; gap: 2px;
    padding: 12px 14px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--surface);
    cursor: pointer; transition: all 0.15s; text-align: left;
  }
  .mp-tool-chip:hover { border-color: var(--border-2); background: var(--surface-2); }
  .mp-tool-chip-active {
    border-color: var(--chip-accent, var(--accent)) !important;
    background: color-mix(in srgb, var(--chip-accent, var(--accent)) 10%, transparent) !important;
  }
  .mp-tool-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .mp-tool-sub { font-size: 11px; color: var(--text-muted); }
  .mp-form { display: flex; flex-direction: column; gap: 20px; }
  .mp-field { display: flex; flex-direction: column; gap: 8px; }
  .mp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .mp-field-half {}
  .mp-label { font-size: 12px; font-weight: 600; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
  .mp-required { font-size: 10px; font-weight: 700; color: #f97316; background: rgba(249,115,22,0.1); padding: 1px 6px; border-radius: 4px; }
  .mp-hint-label { font-size: 10px; color: var(--text-muted); font-weight: 400; }
  .mp-textarea {
    width: 100%; background: var(--surface-2); border: 1.5px solid var(--border);
    border-radius: 8px; padding: 10px 12px; font-size: 14px; color: var(--text);
    font-family: inherit; resize: vertical; transition: border-color 0.12s; line-height: 1.5;
  }
  .mp-textarea:focus { outline: none; border-color: var(--accent); }
  .mp-textarea::placeholder { color: var(--text-muted); }
  .mp-textarea-sm { min-height: 60px; }
  .mp-input {
    width: 100%; background: var(--surface-2); border: 1.5px solid var(--border);
    border-radius: 8px; padding: 9px 12px; font-size: 14px; color: var(--text);
    font-family: inherit; transition: border-color 0.12s;
  }
  .mp-input:focus { outline: none; border-color: var(--accent); }
  .mp-input::placeholder { color: var(--text-muted); }
  .mp-chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .mp-param-chip {
    font-size: 12px; font-weight: 500; padding: 4px 11px; border-radius: 20px;
    border: 1px solid var(--border); background: transparent; color: var(--text-2);
    cursor: pointer; transition: all 0.12s; white-space: nowrap;
  }
  .mp-param-chip:hover { border-color: var(--border-2); color: var(--text); }
  .mp-param-chip-on { border-color: var(--accent) !important; background: rgba(245,158,11,0.12) !important; color: var(--text) !important; }
  .mp-ar-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .mp-ar-chip {
    font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 6px;
    border: 1.5px solid var(--border); background: transparent; color: var(--text-2);
    cursor: pointer; transition: all 0.12s; font-variant-numeric: tabular-nums;
  }
  .mp-ar-chip:hover { border-color: var(--border-2); color: var(--text); }
  .mp-ar-chip-on { border-color: var(--accent) !important; background: rgba(245,158,11,0.12) !important; color: var(--text) !important; }
  .mp-nsfw-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--surface);
  }
  .mp-toggle {
    position: relative; width: 38px; height: 22px; border-radius: 11px;
    background: var(--border-2); border: none; cursor: pointer;
    flex-shrink: 0; transition: background 0.2s; padding: 0;
  }
  .mp-toggle-on { background: #f97316 !important; }
  .mp-toggle-thumb {
    position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
    border-radius: 50%; background: #fff; transition: transform 0.2s; display: block;
  }
  .mp-toggle-on .mp-toggle-thumb { transform: translateX(16px); }
  .mp-toggle-label { font-size: 13px; color: var(--text-2); }
  .mp-generate-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin: 8px 0 40px; }
  .mp-error {
    font-size: 13px; color: #f87171;
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
    border-radius: 8px; padding: 10px 16px; width: 100%; text-align: center;
  }
  .mp-generate-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 32px; border-radius: 10px;
    background: var(--btn-accent, var(--accent)); color: #fff;
    font-size: 15px; font-weight: 600; border: none; cursor: pointer;
    transition: opacity 0.15s, transform 0.1s; font-family: inherit; letter-spacing: -0.2px;
  }
  .mp-generate-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .mp-generate-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .mp-generate-hint { font-size: 12px; color: var(--text-muted); }
  .mp-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: mp-spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes mp-spin { to { transform: rotate(360deg); } }
  .mp-output { margin-top: 8px; }
  .mp-variants { display: flex; flex-direction: column; gap: 16px; }
  .mp-variant-card { border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
  .mp-variant-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--surface-2);
  }
  .mp-variant-badge {
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--badge-accent, var(--accent));
    background: color-mix(in srgb, var(--badge-accent, var(--accent)) 12%, transparent);
    padding: 3px 10px; border-radius: 20px;
  }
  .mp-copy-btn {
    display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500;
    color: var(--text-2); background: none; border: 1px solid var(--border); border-radius: 6px;
    padding: 4px 10px; cursor: pointer; transition: all 0.12s; font-family: inherit;
  }
  .mp-copy-btn:hover { color: var(--text); border-color: var(--border-2); background: var(--surface-2); }
  .mp-variant-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .mp-prompt-block { display: flex; flex-direction: column; gap: 6px; }
  .mp-prompt-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
  .mp-prompt-text { font-size: 13px; line-height: 1.65; color: var(--text); white-space: pre-wrap; word-break: break-word; }
  .mp-neg-block { opacity: 0.75; }
  .mp-neg-text { color: var(--text-2); }
  .mp-param-text {
    font-family: 'SFMono-Regular','Consolas','Monaco',monospace; font-size: 12px;
    color: #7dd3fc; background: rgba(125,211,252,0.06); border: 1px solid rgba(125,211,252,0.12);
    border-radius: 6px; padding: 6px 10px;
  }
  @media (max-width: 600px) {
    .mp-main { padding: 28px 16px 60px; }
    .mp-tool-grid { grid-template-columns: 1fr 1fr; }
    .mp-row { grid-template-columns: 1fr; }
    .mp-hero-title { font-size: 24px; }
  }
`;
