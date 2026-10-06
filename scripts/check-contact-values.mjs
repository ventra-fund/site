#!/usr/bin/env node
// Guards the contact reveal (docs/contact-reveal.md): the phone number must exist only as a secret.
// Fails if the configured CONTACT_PHONE (read from the local .env / .dev.vars files) appears in any
// file `git add -A` would stage, or in the build output under dist/ when there is one, or if anything
// but the reveal endpoint imports src/lib/contact/values.ts. Run after `pnpm build` to cover dist/:
//   pnpm check:contact
// Failures name the variable and the file, never the value.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ENV_FILES = ['.env', '.dev.vars', ...readdirSync('.').filter((f) => /^\.env\..+/.test(f) && f !== '.env.example')];
const VARS = ['CONTACT_PHONE'];
const VALUES_FILE = 'src/lib/contact/values.ts';
const IMPORTERS = ['src/pages/api/contact/reveal.ts'];
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|pdf|zip)$/i;

const formatPhone = (v) => {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(v);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : v;
};

/** Every configured value, in each shape it could leak in (as stored, digits only, formatted). */
const needles = [];
for (const source of ENV_FILES.filter(existsSync)) {
  for (const line of readFileSync(source, 'utf8').split('\n')) {
    const t = line.trim();
    const eq = t.indexOf('=');
    if (!t || t.startsWith('#') || eq === -1) continue;
    const name = t.slice(0, eq).trim();
    if (!VARS.includes(name)) continue;
    const raw = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '').split(/\s#/)[0].trim();
    if (!raw) continue;
    const digits = raw.replace(/\D/g, '');
    for (const needle of new Set([raw, digits, digits.slice(-10), formatPhone(raw)])) {
      if (needle.length >= 7) needles.push({ name, source, needle });
    }
  }
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).split('\0').filter(Boolean);
const committable = [...new Set([...git(['ls-files', '-z']), ...git(['ls-files', '-z', '--others', '--exclude-standard'])])];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

const problems = new Set();
for (const file of [...committable, ...walk('dist')]) {
  if (BINARY.test(file)) continue;
  let text;
  try {
    if (statSync(file).size > 8 * 1024 * 1024) continue;
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const n of needles) if (text.includes(n.needle)) problems.add(`${file} contains ${n.name} (from ${n.source})`);
}

for (const file of committable) {
  if (file === VALUES_FILE || IMPORTERS.includes(file) || !/\.(ts|astro|mjs|js)$/.test(file) || !existsSync(file)) continue;
  if (/contact\/values['"]/.test(readFileSync(file, 'utf8'))) problems.add(`${file} imports ${VALUES_FILE} (only the reveal endpoint may)`);
}

if (needles.length === 0) console.warn('check:contact: no CONTACT_PHONE in the local env files, so only the import rule was checked.');
if (problems.size > 0) {
  console.error(`check:contact failed:\n  ${[...problems].join('\n  ')}`);
  process.exit(1);
}
console.log(`check:contact: ok (${committable.length} committable files${existsSync('dist') ? ' and dist/' : ''} scanned)`);
