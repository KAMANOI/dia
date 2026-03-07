'use client';

import React from 'react';

/* ============================================================
   テキスト入力
   ============================================================ */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full border rounded-input px-3.5 py-2.5',
          'text-ink text-sm placeholder:text-ink-muted',
          'focus:outline-none transition-colors duration-150',
          error
            ? 'border-[#EF4444] focus:border-[#EF4444]'
            : 'border-line focus:border-primary',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}

/* ============================================================
   テキストエリア
   ============================================================ */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
  maxCount?: number;
}

export function Textarea({
  label,
  hint,
  error,
  showCount = false,
  maxCount,
  className = '',
  id,
  value,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label;
  const count = typeof value === 'string' ? value.length : 0;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          value={value}
          className={[
            'w-full border rounded-input px-3.5 py-3',
            'text-ink text-sm placeholder:text-ink-muted leading-relaxed',
            'focus:outline-none transition-colors duration-150',
            showCount ? 'pb-8' : '',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444]'
              : 'border-line focus:border-primary',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {showCount && (
          <div className="absolute bottom-2.5 right-3">
            <span className={`text-xs ${maxCount && count > maxCount ? 'text-[#EF4444]' : 'text-ink-muted'}`}>
              {count}{maxCount ? `/${maxCount}` : ''}
            </span>
          </div>
        )}
      </div>
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
