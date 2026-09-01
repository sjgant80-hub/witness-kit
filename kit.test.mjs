// kit.test.mjs — the wiring law, falsifiable. Load-bearing: detection never invents a pair,
// the plan refuses theatre by name, the generated workflow reads EVERY verdict, and the
// verdict parser judges from the whole output — including the noisy shapes that fooled the
// campaign's instruments three times.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detect, plan, workflowFor, verdictOf } from './kit.mjs';

const ESM_REPO = ['README.md', 'room.mjs', 'room.test.mjs', 'lib/law.mjs', 'lib/law.test.mjs',
  'scripts/wire.mjs', 'build-page.mjs', 'orphan.mjs', 'tests/old.test.mjs', 'deep/a/b/hidden.mjs'];
const STRYKER_REPO = ['package.json', 'stryker.config.json', 'vitest.config.ts', 'src/parser.ts', 'tests/parser.test.ts'];
const BARE_REPO = ['README.md', 'index.html', 'style.css'];

test('DETECT — pairs found at root and one level; build/wire noise and deep trees excluded', () => {
  const d = detect(ESM_REPO, false);
  assert.deepEqual(d.pairs, [{ kernel: 'room.mjs', test: 'room.test.mjs' }, { kernel: 'lib/law.mjs', test: 'lib/law.test.mjs' }]);
  assert.deepEqual(d.loneKernels, ['orphan.mjs'], 'a kernel with no test is named, not paired by hope');
  assert.deepEqual(d.loneTests, ['tests/old.test.mjs'], 'a test with no kernel is named too');
  assert.ok(!d.pairs.some((p) => p.kernel.includes('build-page')), 'build tooling is not a kernel');
  assert.ok(!d.pairs.some((p) => p.kernel.includes('scripts/')), 'wiring scripts are not kernels');
  assert.ok(!JSON.stringify(d).includes('hidden.mjs'), 'depth beyond root+1 is out of scope');
  // the depth fence, pinned: two directories deep is IN scope (src/lib/x.mjs is real code), three is not
  const deep2 = detect(['a/b/c.mjs', 'a/b/c.test.mjs'], false);
  assert.deepEqual(deep2.pairs, [{ kernel: 'a/b/c.mjs', test: 'a/b/c.test.mjs' }], 'depth 2 pairs — the fence is inclusive at 2');
});

test('DETECT — .js counts only when the repo is ESM; node_modules never counts', () => {
  const files = ['a.js', 'a.test.js', 'node_modules/x.mjs', 'node_modules/x.test.mjs'];
  assert.equal(detect(files, false).pairs.length, 0, 'CJS .js is not witnessable — no pair invented');
  assert.deepEqual(detect(files, true).pairs, [{ kernel: 'a.js', test: 'a.test.js' }], 'ESM .js pairs');
  assert.ok(!JSON.stringify(detect(files, true)).includes('node_modules'), 'vendored code is invisible');
  assert.match(detect([], false).why, /run `git ls-files`/);
  assert.match(detect(['ok', ''], false).why, /file listing/);
  assert.match(detect('x', false).why, /file listing/);
  assert.match(detect(['a.mjs'], 'yes').why, /esm must be a boolean/);
});

test('DETECT — an existing mutator is recognised: belief already installed', () => {
  const d = detect(STRYKER_REPO, false);
  assert.deepEqual(d.mutators, ['stryker.config.json']);
  assert.deepEqual(d.testRunners, ['vitest.config.ts']);
  assert.equal(d.pairs.length, 0, 'TS files are not witness pairs — no pretending');
});

test('PLAN — lane A when pairs exist; lane B when a mutator exists; THEATRE refused by name', () => {
  const a = plan(detect(ESM_REPO, false));
  assert.equal(a.lane, 'A');
  assert.match(a.say, /2 kernel\/test pair\(s\)/);
  assert.match(a.say, /EXACT pinned invocation/);
  assert.match(a.notes.join(' '), /kernel-shaped file\(s\) have no sibling test/);
  const b = plan(detect(STRYKER_REPO, false));
  assert.equal(b.lane, 'B');
  assert.match(b.say, /already mutates \(stryker\.config\.json\)/);
  assert.match(b.say, /READ the score and refuse below it/);
  assert.match(b.say, /No rip-and-replace/);
  const t = plan(detect(BARE_REPO, false));
  assert.equal(t.ok, false);
  assert.equal(t.lane, 'THEATRE');
  assert.match(t.why, /a gate here would be theatre/);
  assert.match(t.why, /extract ONE pure function/);
  assert.match(plan(null).why, /pass detect\(\) output/);
  assert.match(plan({ pairs: 'x', mutators: [] }).why, /pass detect\(\) output/);
  // notes stay SILENT when there is nothing to note — a "0 files" note is noise pretending to help
  assert.equal(b.notes.length, 0, 'no orphans, no notes');
  // hand-made detections without the orphan arrays are tolerated, not crashed on
  const bare = plan({ pairs: [{ kernel: 'k.mjs', test: 'k.test.mjs' }], mutators: [] });
  assert.equal(bare.lane, 'A');
  assert.deepEqual(bare.notes, [], 'absent orphan lists read as empty, never as a throw');
  // the ellipsis boundary: exactly three orphans are LISTED IN FULL — the '…' appears at four
  const three = plan(detect(['x.mjs', 'x.test.mjs', 'o1.mjs', 'o2.mjs', 'o3.mjs'], false));
  assert.match(three.notes[0], /o1\.mjs, o2\.mjs, o3\.mjs(?!…)/, 'three orphans, three names');
  assert.ok(!three.notes[0].includes('…'), 'no ellipsis at exactly three');
  const four = plan(detect(['x.mjs', 'x.test.mjs', 'o1.mjs', 'o2.mjs', 'o3.mjs', 'o4.mjs'], false));
  assert.ok(four.notes[0].includes('…'), 'four orphans earn the ellipsis');
});

test('GENERATE — the workflow is pinned, runs tests first, and reads EVERY verdict', () => {
  const pairs = [{ kernel: 'room.mjs', test: 'room.test.mjs' }, { kernel: 'lib/law.mjs', test: 'lib/law.test.mjs' }];
  const w = workflowFor(pairs);
  assert.ok(w.ok);
  assert.match(w.yml, /--branch v0\.6/, 'pinned by default');
  assert.match(w.yml, /node --test room\.test\.mjs lib\/law\.test\.mjs/, 'the suites run before anything mutates');
  assert.equal((w.yml.match(/git clone/g) || []).length, 1, 'witness cloned once, not per pair');
  assert.match(w.yml, /tee verdict-0\.txt/);
  assert.match(w.yml, /tee verdict-1\.txt/);
  assert.equal((w.yml.match(/grep -q '"clean": true'/g) || []).length, 2, 'every kernel has its own verdict READ');
  assert.match(w.yml, /::error::lib\/law\.mjs: mutants survived/);
  assert.match(w.yml, /An unpinned gate is a gate somebody else can change/);
  assert.match(w.yml, /\$\(\[ -f witness\.baseline\.json \]/, 'argued baselines ride along when present');
  const pinned = workflowFor(pairs, 'v1.2');
  assert.match(pinned.yml, /--branch v1\.2/);
  assert.match(workflowFor([], 'v0.6').why, /theatre, refused/);
  assert.match(workflowFor([{ kernel: 'a.mjs' }]).why, /each pair is/);
  assert.match(workflowFor([{ test: 't.test.mjs' }]).why, /each pair is/, 'a missing kernel alone refuses — no undefined in a shipped workflow');
  assert.match(workflowFor(pairs, 'main').why, /unpinned gate/);
  assert.match(workflowFor(pairs, '0.6').why, /unpinned gate/);
  // a SINGLE pair still clones witness — the clone rides pair 0, and pair 0 always exists
  const solo = workflowFor([{ kernel: 'a.mjs', test: 'a.test.mjs' }]);
  assert.equal((solo.yml.match(/git clone/g) || []).length, 1, 'one pair, one clone — never zero');
  // the generated SHELL is behavior too: the baseline ride-along and the refuse-clause are exact
  assert.match(w.yml, /\] && echo "--baseline witness\.baseline\.json"/, 'the baseline hook is a shell AND, verbatim');
  assert.match(w.yml, /verdict-0\.txt \|\| \{ echo "::error::/, 'the verdict grep FAILS the build with a shell OR, verbatim');
  // the bell step: every verdict becomes a link that rings it, ON FAILURE TOO — hearing the
  // crack is the point, so the step runs always() and the link carries the verdict by fragment
  assert.match(w.yml, /if: always\(\)/, 'the bell rings cracked gates too');
  assert.match(w.yml, /the-bell\/#v=\$\(tail -c 2000 "\$f" \| base64 -w0\)/, 'the verdict travels in the fragment — no server ever sees it');
  assert.match(w.yml, /GITHUB_STEP_SUMMARY/, 'the link lands in the job summary where a human will see it');
  assert.match(w.yml, /\[ -f "\$f" \] \|\| continue/, 'a missing verdict file is skipped, not exploded on');
  assert.ok(w.yml.indexOf('the bell') > w.yml.indexOf('verdict-1.txt'), 'the bell tolls after every gate has spoken');
});

test('VERDICT — judged from the WHOLE output: prose after JSON, prefixed noise, baseline shapes', () => {
  const clean = 'mutation gate: room.mjs · tests: node --test …\n{\n  "total": 39,\n  "killed": 39,\n  "survived": [],\n  "clean": true\n}\n✓ no test-theatre\n';
  const v = verdictOf(clean);
  assert.deepEqual(v, { ok: true, clean: true, killed: 39, total: 39, survived: 0 });
  const dirty = 'noise before\n{"total": 10, "killed": 8, "survived": [{"line":3},{"line":9}], "clean": false}\n✗ 2 mutant(s) SURVIVED — those lines are test-theatre.\n';
  const d = verdictOf(dirty);
  assert.deepEqual(d, { ok: true, clean: false, killed: 8, total: 10, survived: 2 });
  // the failure that fooled a sweep: judging the last LINE would read "}" — the law reads the object
  assert.notEqual(verdictOf(clean).ok, false, 'the trailing prose does not blind the parser');
  // two verdicts in one stream (a tee -a mistake): the LAST one is the ruling
  const twice = '{"clean": false, "total": 5, "killed": 3, "survived": [{"line":1},{"line":2}]}\nlater…\n{"clean": true, "total": 5, "killed": 5, "survived": []}';
  assert.equal(verdictOf(twice).clean, true, 'the last verdict rules');
  assert.match(verdictOf('').why, /produced nothing/);
  assert.match(verdictOf('it crashed before any verdict').why, /witness never finished; judge nothing/);
  // "clean" present but no JSON around it: that is MANGLED output, not a never-ran — the two
  // refusals must not blur, and "clean" at index 0 exactly is still a mangle, not a miss
  assert.match(verdictOf('"clean" appears but no braces anywhere').why, /mangled/);
  // a bare verdict at position 0 — nothing before the brace — still parses
  assert.deepEqual(verdictOf('{"clean": true, "total": 1, "killed": 1, "survived": []}'),
    { ok: true, clean: true, killed: 1, total: 1, survived: 0 }, 'a verdict at index 0 is a verdict');
});

test('THE FUZZ — 200 random listings: detection never invents, plan is total, workflows parse their own pairs back', () => {
  let seed = 20260901;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let t = 0; t < 200; t++) {
    const n = 1 + Math.floor(rnd() * 12);
    const files = [];
    for (let i = 0; i < n; i++) {
      const base = 'f' + Math.floor(rnd() * 6);
      const dir = rnd() > 0.6 ? 'lib/' : '';
      if (rnd() > 0.5) files.push(dir + base + '.mjs');
      if (rnd() > 0.5) files.push(dir + base + '.test.mjs');
      if (rnd() > 0.8) files.push('stryker.config.json');
    }
    if (!files.length) files.push('README.md');
    const uniq = [...new Set(files)];
    const d = detect(uniq, rnd() > 0.5);
    assert.ok(d.ok);
    for (const p of d.pairs) {
      assert.ok(uniq.includes(p.kernel) && uniq.includes(p.test), 'every pair exists in the listing — nothing invented');
    }
    const pl = plan(d);
    assert.ok(typeof pl.lane === 'string' || pl.why, 'the plan always speaks');
    if (d.pairs.length) {
      const w = workflowFor(d.pairs);
      assert.ok(w.ok);
      for (const p of d.pairs) assert.ok(w.yml.includes('mutate ' + p.kernel), 'every pair is gated, none dropped silently');
    }
  }
});
