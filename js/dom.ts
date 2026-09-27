// ---------------------------------------------------------------------
// DOM ACCESS HELPER
// ---------------------------------------------------------------------
// document.getElementById returns `HTMLElement | null` typed generically —
// every view module here calls it dozens of times for a *specific* known
// element (a <select>'s .value, a <textarea>'s .value, and so on), and the
// original JS never null-checked most of those calls either — it just
// trusted the id existed and let a missing element throw at runtime.
// This one small generic wrapper is used everywhere instead of scattering
// `document.getElementById(id) as HTMLSelectElement` casts across five
// files (rule of three, many times over): callers that already guard with
// an `if (!x) return` (see evidence.ts's populateEvidenceDropdowns) get the
// honest `T | null` back; callers that never guarded in the original code
// either use `el<T>(id)!` to make that same pre-existing assumption
// explicit, or (for the small number of unconditional, load-bearing
// lookups) accept the small risk as-is, exactly matching pre-migration
// behavior either way — this file changes how the cast is spelled, not
// what happens at runtime.
export function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
