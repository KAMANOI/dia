'use client';

import type {
  PromptInput,
  SecurityLevel,
  MarkdownLevel,
  TargetAI,
} from '@/types';
import { ARTIFACT_TYPES, AI_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface InputPanelProps {
  input: PromptInput;
  onChange: (updates: Partial<PromptInput>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SECURITY_OPTIONS: { level: SecurityLevel; label: string; desc: string; dot: string }[] = [
  { level: 'level1', label: '公開向け',  desc: '固有名詞などをそのまま使います', dot: 'bg-security-1' },
  { level: 'level2', label: '配慮あり',  desc: '具体情報を少し一般化します',     dot: 'bg-security-2' },
  { level: 'level3', label: '秘匿優先',  desc: '機密情報を抽象化します',         dot: 'bg-security-3' },
];

const MARKDOWN_OPTIONS: { level: MarkdownLevel; label: string }[] = [
  { level: 'md1', label: '制限なし' },
  { level: 'md2', label: '軽制限' },
  { level: 'md3', label: 'プレーンのみ' },
];

export function InputPanel({ input, onChange, onGenerate, isGenerating }: InputPanelProps) {
  const canGenerate = typeof input.description === 'string' && input.description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 成果物タイプ */}
      <FieldGroup label="何を作りますか？" desc="用途を選ぶと、最適なプロンプト構造を作ります。">
        <div className="grid grid-cols-2 gap-1.5">
          {ARTIFACT_TYPES.map((type) => (
            <SelectChip
              key={type}
              label={type}
              isSelected={input.artifactType === type}
              onClick={() => onChange({ artifactType: type })}
            />
          ))}
        </div>
      </FieldGroup>

      <Divider />

      {/* 情報の公開レベル */}
      <FieldGroup label="情報の公開レベル" desc="AIへ渡す情報の安全性を調整します。">
        <div className="space-y-1.5">
          {SECURITY_OPTIONS.map(({ level, label, desc, dot }) => {
            const isSelected = input.securityLevel === level;
            return (
              <button
                key={level}
                onClick={() => onChange({ securityLevel: level })}
                className={[
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-card border text-left',
                  'transition-all duration-150',
                  isSelected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-line hover:border-ink/20',
                ].join(' ')}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-ink'}`}>
                    {label}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <Divider />

      {/* 出力形式 + 優先AI (横並び) */}
      <div className="grid grid-cols-2 gap-5">
        <FieldGroup label="出力形式" desc="AIの回答形式を指定できます。">
          <div className="flex flex-col gap-1.5">
            {MARKDOWN_OPTIONS.map(({ level, label }) => (
              <SelectChip
                key={level}
                label={`${level.toUpperCase()} — ${label}`}
                isSelected={input.markdownLevel === level}
                onClick={() => onChange({ markdownLevel: level })}
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="優先AI（任意）">
          <div className="flex flex-col gap-1.5">
            {(Object.entries(AI_LABELS) as [TargetAI, string][]).map(([ai, label]) => (
              <SelectChip
                key={ai}
                label={label}
                isSelected={input.targetAI === ai}
                onClick={() => onChange({ targetAI: ai })}
              />
            ))}
          </div>
        </FieldGroup>
      </div>

      <Divider />

      {/* 概要入力 */}
      <FieldGroup label="作りたい内容" desc="日本語で簡単に書いてください。">
        <Textarea
          value={input.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="新しいコーヒーショップのブランドコンセプトを考えたい。&#10;ターゲットは20〜30代のビジネスパーソン。"
          rows={6}
          showCount
        />
      </FieldGroup>

      {/* 生成ボタン */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onGenerate}
        disabled={!canGenerate}
        loading={isGenerating}
      >
        {isGenerating ? '生成中...' : 'プロンプトを生成する'}
      </Button>
    </div>
  );
}

function FieldGroup({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
        {desc && <p className="text-xs text-ink-muted mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SelectChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full px-3 py-2.5 rounded-card border text-sm font-medium text-left',
        'transition-all duration-150',
        isSelected
          ? 'border-primary bg-primary-subtle text-primary'
          : 'border-line text-ink hover:border-ink/20',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="border-t border-line" />;
}
