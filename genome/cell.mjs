// cell.mjs — witness-kit's three answers for the birth check (seed.json, genome/).
//
// judge  a claimed lane for a repository is verified when witness-kit's own wiring law, detect() then plan(), names
//        the same lane for that file listing: A (wire witness), B (the repository already mutates: add the
//        discipline) or THEATRE (refuse). Unverified when it names another. Refused when the input is out of lane or
//        the claim is not A, B or THEATRE. The birth check's bad case is what this kit exists to refuse: a
//        repository with nothing a mutation gate could judge, claimed ready to wire.
// lane   exactly what detect() accepts: a non-empty listing of repo-relative paths and an esm boolean. A request
//        with no file listing is out of lane and goes to Kar.
import { detect, plan } from '../kit.mjs';

export const LANES = ['A', 'B', 'THEATRE'];

// lane(input) → the wiring law's own lane for the listing
export const lane = (input) => plan(detect(input.files, input.esm)).lane;

export async function judge(input) {
  if (!(await inLane(input)) || !LANES.includes(input.claim)) return 'refused';
  return lane(input) === input.claim ? 'verified' : 'unverified';
}

export async function inLane(input) {
  return detect(input?.files, input?.esm).ok;
}

// health: witness-kit is a tool and a page; from inside the repository it cannot see which repositories were wired
// with it or when it last refused theatre, so it says so
export async function health() {
  return { used: null, dependedOn: null, lastEarned: null };
}
