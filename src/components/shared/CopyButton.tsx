'use client';

import { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({ text, className = '', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // フォールバック
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const sizeClass = size === 'sm' ? 'h-7 px-2.5 text-xs gap-1.5' : 'h-9 px-4 text-sm gap-2';

  return (
    <button
      onClick={handleCopy}
      className={[
        'inline-flex items-center justify-center font-medium rounded-btn select-none',
        'transition-all duration-200 active:scale-[0.96]',
        copied
          ? 'bg-[#10B981] text-white'
          : 'bg-primary text-white hover:bg-primary-dark',
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {copied ? (
        <>
          <CheckIcon />
          コピーしました
        </>
      ) : (
        <>
          <CopyIcon />
          コピー
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
