#!/usr/bin/env node
// Generate a white, label-free SVG contact sheet. No npm packages required.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALIASES = new Set(['settings.svg', 'settings-solid.svg']);

function generatePreview(icons, columns = 8) {
  if (!Number.isInteger(columns) || columns < 1) throw Error('columns must be a positive integer');
  if (icons.length === 0) throw Error('No SVG icons found');
  const cell = 104, iconSize = 56, padding = 24;
  const cols = Math.min(columns, icons.length);
  const width = 2 * padding + cols * cell;
  const height = 2 * padding + Math.ceil(icons.length / cols) * cell;
  const tiles = icons.map(({ name, source }, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = padding + col * cell + (cell - iconSize) / 2;
    const y = padding + row * cell + (cell - iconSize) / 2;
    const match = source.match(/<svg\b[^>]*>/);
    if (!match || !/viewBox="0 0 24 24"/.test(match[0])) throw Error(`Invalid 24px icon: ${name}`);
    const opening = match[0]
      .replace(/\s+id="[^"]*"/, '')
      .replace('<svg ', `<svg x="${x}" y="${y}" width="${iconSize}" height="${iconSize}" `);
    return source.trim().replace(match[0], opening).replaceAll('currentColor', '#111111');
  });
  return [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Tzeroky icon pack overview">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    ...tiles,
    '</svg>',
    '',
  ].join('\n');
}

const args = process.argv.slice(2);
if (args.length > 2 || (args.length === 2 && args[0] !== '--columns')) {
  throw Error('Usage: node scripts/generate-preview.mjs [--columns N]');
}
const columns = args.length ? Number(args.at(-1)) : 8;
const paths = readdirSync(ROOT).filter(name => name.endsWith('.svg') && !ALIASES.has(name)).sort();
const icons = paths.map(name => ({ name, source: readFileSync(join(ROOT, name), 'utf8') }));
const output = join(ROOT, 'assets', 'icon-overview.svg');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, generatePreview(icons, columns), 'utf8');
console.log(`Generated ${output} (${icons.length} icons)`);
