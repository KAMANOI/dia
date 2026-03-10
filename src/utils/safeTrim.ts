/**
 * safeTrim — 安全な trim ラッパー
 *
 * value が string でない場合は '' を返す。
 * undefined / null / number が紛れ込んでも TypeError にならない。
 *
 * 使い方:
 *   safeTrim(someValue)          // string → trimmed, 非string → ''
 *   arr.map(safeTrim).filter(Boolean)
 */
export const safeTrim = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';
