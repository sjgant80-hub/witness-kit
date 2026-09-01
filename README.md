# witness-kit — wire a mutation gate into any repo, honestly

**LIVE: https://sjgant80-hub.github.io/witness-kit/**

One command turns a repo with real kernels and real tests into a repo whose CI **proves its
tests would notice if the code were wrong** — and refuses to fake it anywhere that proof
isn't possible.

```
git clone https://github.com/sjgant80-hub/witness-kit
node witness-kit/wire.mjs /path/to/your/repo
```

## What you get (one of three honest answers)

- **LANE A — wired.** Kernel/test pairs found → every pair is proven CLEAN locally with the
  **exact pinned invocation** the workflow will run → `.github/workflows/witness-gate.yml`
  is staged with the verdict-read built in (`tee` + `grep '"clean": true'` per kernel —
  anything less fails the build). You review, you push. Survivors block the wire until each
  is **killed at source or argued in a baseline** with a reason a reviewer could dispute.
- **LANE B — discipline, not replacement.** You already run a mutator (Stryker, mutmut,
  Infection)? Belief is installed; the kit tells you the missing discipline: pin the tool,
  set a breaking threshold, make CI *read* the score and refuse below it. A gate that
  reports and exits zero is decorative.
- **THEATRE — refused, with directions.** No pairs, no mutator → no workflow, and the wire
  says why: *extract ONE pure function into its own module with a falsifiable test, then
  wire that. The gate follows the kernel, never the other way round.*

## The law — [`kit.mjs`](kit.mjs) · witness **40/44 + 4 argued equivalents, CLEAN**

The kit eats its own cooking: its detection, planning, workflow generation and verdict
parsing are a mutation-gated kernel, and the arguments for the four surviving equivalents
are in [witness.baseline.json](witness.baseline.json) — each one a sentence you could
dispute, never a flag. The verdict parser reads the **whole** output (the last balanced JSON
object carrying `"clean"`) because judging by the last line once mis-read `}` as a verdict.

Proven on real repos before shipping: lane A end-to-end on an ESM repo (pair detected,
39/39 proven with the pinned invocation, workflow staged) and lane B on a TypeScript +
vitest + Stryker repo (mutator recognised, the missing-threshold diagnosis delivered, no
fake wiring attempted).

## The pitch for your team

[PITCH.md](PITCH.md) — the 60-second version: pin the gate · read the verdict · kill or
argue, never shrug.

```bash
node --test        # the wiring law against its falsifiable examples
```

---

*Built on the Konomi architecture, created by Thomas Frumkin. The estate builds WITH
Konomi. MIT.*
