// witness-kit · kit.mjs — THE WIRING LAW: witness into a stranger's repo, honestly.
//
// The one move the estate has never made is landing its gate in an EXTERNAL team's CI. This
// kit makes that a paste — and refuses to fake it where it would be theatre. Three laws:
//
//   · DETECT — from a file listing, find what witness can actually mutate (X.mjs + X.test.mjs
//     pairs; .js pairs only when the repo is ESM), what tests exist without kernels, and
//     whether the repo ALREADY runs a mutator (Stryker & co — belief already installed).
//   · PLAN   — the honest lane: A = wire witness (pairs exist); B = the repo already mutates,
//     so the estate's contribution is the DISCIPLINE (pin the tool, make CI read the score
//     and refuse below threshold — a gate that reports and exits zero is decorative);
//     THEATRE = nothing to mutate and no mutator: refuse, and say what to extract first.
//   · GENERATE — the pinned, verdict-reading workflow: witness cloned at a TAG (an unpinned
//     gate is a gate somebody else can change), one verdict file per kernel, CI greps
//     '"clean": true' for EVERY one — the lessons of ninety-odd gated repos, compiled.
//
// Plus VERDICT — parse a witness run from its WHOLE output (some modes print the JSON last,
// some print prose after; judging by the last line once mis-read "}" as the verdict).
//
// Pure and total: garbage in → { ok:false, why }, never a throw mid-wire.

const S = (v) => (typeof v === 'string' ? v : '');

const MUTATOR_CONFIGS = ['stryker.config.json', 'stryker.config.js', 'stryker.config.mjs', 'stryker.conf.js', '.mutmut.toml', 'infection.json', 'infection.json5'];

/**
 * DETECT — files: repo-relative paths ('/' separators). esm: does package.json say
 * "type":"module" (the shell reads that; this law stays pure). Depth ≤ 2 (root + one
 * directory) — deeper trees hide generated code and vendored noise.
 */
export function detect(files, esm) {
  if (!Array.isArray(files) || files.length === 0 || !files.every((f) => S(f).length > 0))
    return { ok: false, why: 'a file listing is required — run `git ls-files` and bring the output' };
  if (typeof esm !== 'boolean') return { ok: false, why: 'esm must be a boolean — the shell reads package.json "type"' };
  const depth = (f) => f.split('/').length - 1;
  const inScope = files.filter((f) => depth(f) <= 2 && !f.includes('node_modules/') && !f.startsWith('.git/'));
  const isKernelExt = (f) => f.endsWith('.mjs') || (esm && f.endsWith('.js'));
  const testOf = (f) => f.replace(/\.(mjs|js)$/, '.test.$1');
  const pairs = [], loneKernels = [], loneTests = [];
  for (const f of inScope) {
    if (!isKernelExt(f) || /\.test\.(mjs|js)$/.test(f)) continue;
    if (/(^|\/)(build|wire|scripts?\/)/.test(f) || /build-page/.test(f)) continue;
    const t = testOf(f);
    if (inScope.includes(t)) pairs.push({ kernel: f, test: t });
    else loneKernels.push(f);
  }
  for (const f of inScope) {
    if (/\.test\.(mjs|js)$/.test(f) && !pairs.some((p) => p.test === f)) loneTests.push(f);
  }
  const mutators = inScope.filter((f) => MUTATOR_CONFIGS.includes(f.split('/').pop()));
  const testRunners = inScope.filter((f) => /^(vitest|jest|karma|ava)\.config\.[a-z]+$/.test(f.split('/').pop() || ''));
  return { ok: true, pairs, loneKernels, loneTests, mutators, testRunners };
}

/** PLAN — the honest lane, named. Never a gate where a gate would be theatre. */
export function plan(detection) {
  const d = detection && typeof detection === 'object' && !Array.isArray(detection) ? detection : null;
  if (!d || !Array.isArray(d.pairs) || !Array.isArray(d.mutators)) return { ok: false, why: 'pass detect() output' };
  const notes = [];
  if (Array.isArray(d.loneKernels) && d.loneKernels.length) notes.push(d.loneKernels.length + ' kernel-shaped file(s) have no sibling test — witness cannot judge what nothing exercises: ' + d.loneKernels.slice(0, 3).join(', ') + (d.loneKernels.length > 3 ? '…' : ''));
  if (Array.isArray(d.loneTests) && d.loneTests.length) notes.push(d.loneTests.length + ' test file(s) have no sibling kernel by name — if they test something real, tell the wire where it lives');
  if (d.pairs.length > 0) {
    return { ok: true, lane: 'A', notes,
      say: 'LANE A — wire witness: ' + d.pairs.length + ' kernel/test pair(s) it can mutate. The wire proves each CLEAN locally with the EXACT pinned invocation before any workflow ships; survivors are killed at source or argued in a baseline — a sentence you could argue with, never a flag.' };
  }
  if (d.mutators.length > 0) {
    return { ok: true, lane: 'B', notes,
      say: 'LANE B — this repo already mutates (' + d.mutators.join(', ') + '), so belief is installed; what the estate adds is the DISCIPLINE: pin the mutator version, set a breaking threshold, and make CI READ the score and refuse below it. A gate that reports and exits zero is decorative. No rip-and-replace.' };
  }
  return { ok: false, lane: 'THEATRE',
    why: 'no kernel/test pairs witness can mutate and no existing mutator — a gate here would be theatre. Start smaller: extract ONE pure function into its own module with a falsifiable test, then wire that. The gate follows the kernel, never the other way round.' };
}

/**
 * GENERATE — the pinned, verdict-reading workflow for lane A. One verdict file per pair;
 * every verdict grepped; test step runs every suite first.
 */
export function workflowFor(pairs, tag = 'v0.6') {
  if (!Array.isArray(pairs) || pairs.length === 0) return { ok: false, why: 'no pairs — a workflow over nothing is theatre, refused' };
  for (const p of pairs) {
    if (!p || !S(p.kernel) || !S(p.test)) return { ok: false, why: 'each pair is { kernel, test }' };
  }
  if (!/^v\d+\.\d+$/.test(tag)) return { ok: false, why: 'tag must look like v0.6 — an unpinned gate is a gate somebody else can change' };
  const tests = pairs.map((p) => p.test).join(' ');
  let steps = '';
  pairs.forEach((p, i) => {
    steps += `      - name: witness — try to break ${p.kernel}, then READ the verdict (must be CLEAN)
        run: |
          ${i === 0 ? `git clone --depth 1 --branch ${tag} https://github.com/sjgant80-hub/witness.git /tmp/witness\n          ` : ''}node /tmp/witness/witness.mjs mutate ${p.kernel} \\
            --timeout 60000 --cap 800 $([ -f witness.baseline.json ] && echo "--baseline witness.baseline.json") \\
            --test node --test ${p.test} | tee verdict-${i}.txt
          grep -q '"clean": true' verdict-${i}.txt || { echo "::error::${p.kernel}: mutants survived — the gate is not clean"; exit 1; }
`;
  });
  const yml = `name: proof-of-play
# ⚑ Pinned at ${tag}. An unpinned gate is a gate somebody else can change.
# A verdict nobody reads is decoration: every witness run below is tee'd and grepped —
# anything short of '"clean": true' fails the build, by design.
on: [push, pull_request, workflow_dispatch]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - name: the tests themselves, before anything is mutated
        run: node --test ${tests}
${steps}`;
  return { ok: true, yml };
}

/**
 * VERDICT — parse one witness run from its WHOLE output: the verdict is the LAST balanced
 * JSON object that carries a "clean" key. Prose before or after is ignored; a run with no
 * verdict anywhere is named, never guessed.
 */
export function verdictOf(output) {
  if (!S(output)) return { ok: false, why: 'no output — the run produced nothing to judge' };
  const at = output.lastIndexOf('"clean"');
  if (at < 0) return { ok: false, why: 'no verdict in the output — witness never finished; judge nothing' };
  let start = output.lastIndexOf('{', at);
  while (start >= 0) {
    let depth = 0, end = -1;
    for (let i = start; i < output.length; i++) {
      const c = output[i];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > at) {
      try {
        const o = JSON.parse(output.slice(start, end + 1));
        if (typeof o.clean === 'boolean') {
          return { ok: true, clean: o.clean, killed: o.killed ?? null, total: o.total ?? null,
            survived: Array.isArray(o.survived) ? o.survived.length : 0 };
        }
      } catch { /* widen and retry */ }
    }
    start = output.lastIndexOf('{', start - 1);
  }
  return { ok: false, why: 'a "clean" key exists but no balanced JSON verdict around it — the output is mangled; rerun rather than guess' };
}
