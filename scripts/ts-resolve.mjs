// Lets plain `node` run src/*.ts whose imports omit the extension. Usage: node --import ./scripts/ts-resolve.mjs <script>
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND' && /^\\.\\.?\\//.test(spec)) return next(spec + '.ts', ctx); throw e; }
}`));
