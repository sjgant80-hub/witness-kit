# The 60-second pitch (for the guild)

You already believe in mutation testing — some of you run Stryker. This kit adds the one
discipline that makes a mutation score mean something: **the verdict must be read, and the
build must refuse when it's bad.** A score that gets logged and scrolls away is decoration.

## The three rules (earned across 100+ gated repos)

1. **Pin the gate.** An unpinned mutation tool is a gate somebody else can change under you.
   Witness runs pinned at a tag; Stryker pins through your lockfile. Either way: the gate you
   reviewed is the gate that runs.
2. **Read the verdict.** CI must parse the result and `exit 1` on anything short of clean —
   `grep '"clean": true'` for witness, `thresholds.break` for Stryker. If your pipeline can't
   fail on a bad score, you don't have a gate, you have a dashboard.
3. **Kill or argue, never shrug.** A surviving mutant is test-theatre made visible. Either
   write the test that kills it, or record it in a baseline **with a reason a reviewer could
   dispute** — "boundary is float measure-zero because…" is an argument; a flag is a shrug.

## What the wire does

```
node wire.mjs /path/to/your/repo
```

- Finds what's honestly gateable (kernel + test pairs). Refuses to fake it where nothing is —
  *"a gate here would be theatre"* is a real answer you might get.
- If you already mutate (Stryker & co): tells you exactly which discipline is missing —
  usually a `thresholds.break` and a CI step that can fail. No rip-and-replace.
- Proves every pair CLEAN **locally with the exact pinned invocation** before any workflow is
  written. Then it stages the workflow and prints the git commands. **Your repo, your push.**

## Why care

A green test suite proves your tests ran. A clean mutation gate proves your tests would
*notice* if the code were wrong — that's the difference between coverage and evidence. See it
live: [the reply bot that cannot bluff](https://sjgant80-hub.github.io/fallbot/) runs on a
kernel where 26/26 mutants died; the page you're reading it on can't drift from the proven
code because CI diffs the rebuild.

*Built on the Konomi architecture, created by Thomas Frumkin. MIT.*
