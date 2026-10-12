#!/usr/bin/env node
// Self-check for the image → video instruction builder. Usage: node scripts/check-image-to-video.mjs [photo.jpg]
// With a JPEG argument it also prints the full instruction built from that photo's EXIF.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildImageToVideoInstruction, defaultDuration, dominantColors, nearestRatio, readExifFocal } from '../src/utils/imageToVideoBuilder.ts';

// Minimal little-endian JPEG: SOI + APP1 Exif → IFD0 (ExifIFD pointer) → ExifIFD (FocalLength 50/1, 35mm 75).
const tiff = [0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0,
  1, 0, 0x69, 0x87, 4, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0x0a, 0x92, 5, 0, 1, 0, 0, 0, 56, 0, 0, 0, 0x05, 0xa4, 3, 0, 1, 0, 0, 0, 75, 0, 0, 0, 0, 0, 0, 0,
  50, 0, 0, 0, 1, 0, 0, 0];
const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255, ...app1, 0xff, 0xd9]);
assert.deepEqual(readExifFocal(jpeg.buffer), { focalLength: 50, focal35: 75 });
assert.deepEqual(readExifFocal(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer), {}); // PNG → nothing
assert.deepEqual(readExifFocal(jpeg.slice(0, 20).buffer), {}); // truncated → nothing, no throw

assert.equal(nearestRatio(4080, 3072), '4:3');
assert.equal(nearestRatio(1080, 1920), '9:16');
assert.deepEqual(dominantColors([255, 0, 0, 255, 250, 5, 5, 255, 0, 0, 255, 255, 0, 0, 0, 0]), ['#FD0303', '#0000FF']);
assert.equal(defaultDuration('seedance-2.5'), 15);
assert.equal(defaultDuration('veo-3.1'), 8);

const base = { model: 'seedance-2.0', generateSec: 15, cuts: 3, ratio: 'auto', intent: '', facts: null };
const noImage = buildImageToVideoInstruction(base);
assert.match(noImage, /Seedance 2\.0/);
assert.match(noImage, /各カットの生成の長さ: 15秒（Seedance 2\.0 が1回で生成できる長さは 4〜15秒）/);
assert.match(noImage, /protagonist（主役）/);
assert.match(noImage, /画像の情報は読み取っていません/);
assert.match(buildImageToVideoInstruction({ ...base, model: 'veo-3.1', generateSec: 15 }), /生成の長さ: 8秒/); // out-of-range length falls back

const path = process.argv[2];
if (path) {
  const file = readFileSync(path);
  const exif = readExifFocal(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
  const colors = (process.env.COLORS ?? '').split(',').filter(Boolean);
  const [width, height] = (process.env.SIZE ?? '0x0').split('x').map(Number);
  console.log(JSON.stringify(exif));
  console.log(buildImageToVideoInstruction({ ...base, intent: process.env.INTENT ?? '', facts: { width, height, colors, ...exif } }));
}
console.error('PASS image-to-video builder');
