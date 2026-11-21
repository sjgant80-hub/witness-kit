// genome.test.mjs — witness-kit as a cell of the estate genome: its judge, its lane and its health.
// Run: node --test genome.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, inLane, health, lane, LANES } from './genome/cell.mjs';

const seed = JSON.parse(readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
// the fixtures of kit.test.mjs
const ESM_REPO = ['README.md', 'room.mjs', 'room.test.mjs', 'lib/law.mjs', 'lib/law.test.mjs',
  'scripts/wire.mjs', 'build-page.mjs', 'orphan.mjs', 'tests/old.test.mjs', 'deep/a/b/hidden.mjs'];
const STRYKER_REPO = ['package.json', 'stryker.config.json', 'vitest.config.ts', 'src/parser.ts', 'tests/parser.test.ts'];
const BARE_REPO = ['README.md', 'index.html', 'style.css'];

test('the seed: a bare repository refused as theatre is verified; the same one claimed ready to wire is not', async () => {
  assert.equal(await judge(seed.judge.cases.good), 'verified');
  assert.equal(await judge(seed.judge.cases.bad), 'unverified');
  assert.deepEqual(seed.judge.cases.good.files, BARE_REPO);
});

test('the judge reads with the wiring law, lane by lane', async () => {
  assert.equal(lane({ files: ESM_REPO, esm: false }), 'A');
  assert.equal(lane({ files: STRYKER_REPO, esm: false }), 'B');
  assert.equal(lane({ files: BARE_REPO, esm: false }), 'THEATRE');
  assert.equal(await judge({ files: ESM_REPO, esm: false, claim: 'A' }), 'verified');
  assert.equal(await judge({ files: ESM_REPO, esm: false, claim: 'THEATRE' }), 'unverified');
  assert.equal(await judge({ files: STRYKER_REPO, esm: false, claim: 'B' }), 'verified');
  assert.equal(await judge({ files: STRYKER_REPO, esm: false, claim: 'A' }), 'unverified');
  // .js pairs count only in an ES module repository: the same listing, two lanes
  assert.equal(await judge({ files: ['a.js', 'a.test.js'], esm: true, claim: 'A' }), 'verified');
  assert.equal(await judge({ files: ['a.js', 'a.test.js'], esm: false, claim: 'A' }), 'unverified');
});

test('refusals: a claim that is not a lane, or an input that is not a listing', async () => {
  for (const x of [
    { files: ESM_REPO, esm: false, claim: 'C' }, { files: ESM_REPO, esm: false, claim: 'a' }, { files: ESM_REPO, esm: false },
    { ...seed.boundary.outOfLane, claim: 'A' }, { files: ESM_REPO, esm: 'yes', claim: 'A' }, { files: [], esm: false, claim: 'THEATRE' },
    null, 'x', {},
  ]) assert.equal(await judge(x), 'refused', JSON.stringify(x));
});

test('the lane is exactly what detect() accepts', async () => {
  assert.equal(await inLane(seed.boundary.inLane), true);
  assert.equal(await inLane(seed.boundary.outOfLane), false);
  assert.equal(await inLane({ files: ['ok', ''], esm: false }), false);
  assert.equal(await inLane({ files: 'x', esm: false }), false);
  assert.equal(await inLane({ files: ['a.mjs'], esm: true }), true);
  assert.equal(await inLane({ files: ['a.mjs'] }), false);
  assert.equal(await inLane(null), false);
});

test('health says what it cannot measure from inside the repository; the claims are the three lanes', async () => {
  assert.deepEqual(await health(), { used: null, dependedOn: null, lastEarned: null });
  assert.deepEqual(LANES, ['A', 'B', 'THEATRE']);
});
