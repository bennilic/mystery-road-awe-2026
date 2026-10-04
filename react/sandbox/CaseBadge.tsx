// Exercise 3 / Demo 5 — Task 1: a deliberately tiny component. No props, no
// state: it only proves JSX can render a piece of static data. It is not
// mounted anywhere in the app; `npm run typecheck` still compiles it.
const CASE_ID = "REMOTION-2026-10";
const CASE_STATUS = "open";

export function CaseBadge() {
  return (
    <p>
      Case <strong>{CASE_ID}</strong> is <span className="badge badge-flagged">{CASE_STATUS}</span>
    </p>
  );
}
