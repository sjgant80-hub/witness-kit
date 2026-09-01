#!/usr/bin/env node
// witness-kit · wire.mjs — the I/O shell over kit.mjs (the law stays pure; this walks, runs,
// and writes). Usage:  node wire.mjs /path/to/their/repo
//
// What it does, in order — and what it refuses:
//   1. walks the repo (root + two levels, node_modules and .git invisible), reads package.json
//   2. DETECT + PLAN — lane A (wire witness), lane B (they already mutate: discipline, not
//      replacement), or THEATRE (refused, with what to extract first)
//   3. lane A only: clones witness at the PINNED tag and proves every pair CLEAN with the
//      EXACT invocation the workflow will run — a gate is never shipped on a local
//      approximation (the version-skew lesson: a runner that takes different flags silently
//      ran a third of a suite once)
//   4. all clean → writes .github/workflows/witness-gate.yml and prints the git commands.
//      It STAGES; the repo's owner ships. Survivors → the kill-or-argue guidance, no workflow.
// Git is never invoked here at all — arg-array or not, pushing a stranger's repo is theirs.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { detect, plan, workflowFor, verdictOf } from './kit.mjs';

const TAG = 'v0.6';
const repo = process.argv[2];
if (!repo || !existsSync(repo)) { console.error('usage: node wire.mjs /path/to/repo'); process.exit(2); }

const files = [];
(function walk(dir, depth) {
  if (depth > 2) return;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.git') continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, depth + 1);
    else files.push(relative(repo, p).split('\\').join('/'));
  }
})(repo, 0);

let esm = false;
try { esm = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).type === 'module'; } catch {}

const d = detect(files, esm);
if (!d.ok) { console.error('REFUSED: ' + d.why); process.exit(1); }
const p = plan(d);
console.log('\n' + (p.say || p.why));
for (const n of (p.notes || [])) console.log('  · ' + n);

if (!p.ok) process.exit(1);                    // THEATRE — the refusal already spoke
if (p.lane === 'B') {
  console.log('\nNext: pin the mutator version, set its breaking threshold, and make CI fail on it.');
  console.log('For Stryker: thresholds.break in ' + d.mutators[0] + ' + `--reporters clear-text` in CI — the score must be READ, not logged.');
  process.exit(0);
}

// ── lane A: prove first, ship second ──
const wdir = join(tmpdir(), 'witness-' + TAG);
if (!existsSync(join(wdir, 'witness.mjs'))) {
  console.log('\nfetching witness ' + TAG + ' (pinned)…');
  execFileSync('git', ['clone', '--depth', '1', '--branch', TAG, 'https://github.com/sjgant80-hub/witness.git', wdir], { stdio: 'pipe' });
}
const hasBase = existsSync(join(repo, 'witness.baseline.json'));
let allClean = true;
for (const pair of d.pairs) {
  const args = ['mutate', pair.kernel, '--timeout', '60000', '--cap', '800',
    ...(hasBase ? ['--baseline', 'witness.baseline.json'] : []), '--test', 'node', '--test', pair.test];
  console.log('\nproving ' + pair.kernel + ' with the EXACT pinned invocation…');
  let out = '';
  try { out = execFileSync('node', [join(wdir, 'witness.mjs'), ...args], { cwd: repo, stdio: 'pipe', timeout: 600000 }).toString(); }
  catch (e) { out = (e.stdout || '').toString() + (e.stderr || '').toString(); }
  const v = verdictOf(out);
  if (!v.ok) { console.error('  ✗ ' + v.why); allClean = false; continue; }
  console.log('  ' + (v.clean ? '✓ CLEAN' : '✗ NOT CLEAN') + ' — ' + v.killed + '/' + v.total + ' killed, ' + v.survived + ' survived');
  if (!v.clean) allClean = false;
}
if (!allClean) {
  console.log('\nNo workflow shipped — survivors first. For each: KILL it at source (a test that');
  console.log('distinguishes the mutant) or ARGUE it in witness.baseline.json with a reason a');
  console.log('reviewer could dispute. A shrug is not an argument. Then run this wire again.');
  process.exit(1);
}
const wf = workflowFor(d.pairs, TAG);
const wfDir = join(repo, '.github', 'workflows');
mkdirSync(wfDir, { recursive: true });
const target = join(wfDir, 'witness-gate.yml');
if (existsSync(target) && /witness(\.mjs)?\s+mutate/.test(readFileSync(target, 'utf8'))) {
  console.log('\nalready wired: ' + target + ' carries a witness gate — nothing overwritten.');
  process.exit(0);
}
writeFileSync(target, wf.yml);
console.log('\n✓ every pair CLEAN against the pinned invocation. Wrote .github/workflows/witness-gate.yml');
console.log('\nShip it (your repo, your hands):');
console.log('  git checkout -b witness-gate');
console.log('  git add .github/workflows/witness-gate.yml' + (hasBase ? ' witness.baseline.json' : ''));
console.log('  git commit -m "proof-of-play: a pinned mutation gate that reads its own verdict"');
console.log('  git push -u origin witness-gate   # then open the PR');
