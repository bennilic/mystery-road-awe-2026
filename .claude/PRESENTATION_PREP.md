# Presentation Prep

Course-wide rules for how exercise presentations are graded and run. Applies to every exercise
(`EXERCISE_1.md` and onward), not just Exercise 1 — kept separate from the root `CLAUDE.md`
(repo/agent conventions) and `EXERCISE_1.md` (this exercise's task content).

## Grading — 30 points per successful presentation

| Criterion | Points |
|---|---|
| Demonstration and correctness of the solution | 10 |
| Explanation of the implementation and decisions | 10 |
| Understanding of related theory and answers to follow-up questions | 10 |
| **Total** | **30** |

A presentation is **successful** only if both hold:
- Score ≥ 15/30, **and**
- Sufficient understanding demonstrated in **all three** areas (not just a high total).

Checking a task off in Moodle's per-exercise checklist is a commitment: it confirms you completed
it, can demonstrate and explain it live, understand the underlying concepts, and can answer
follow-up questions on it — not just that the code runs.

## Format & logistics

- 7–15 minutes per presentation, **including questions**.
- Lecturers choose who presents each session — except the **first session**, where the class picks
  among itself (lecturers assign if nobody volunteers).
- Presentations are always **individual**, even if the exercise was solved in a pair/team.

## Consequences

- **Failed presentation** (task was marked done but the solution is missing, or you can't
  sufficiently explain it): costs **two additional required successful presentations** to make up
  for it.
- **Absence** (including illness): that session's tasks are simply excluded from your 70%
  requirement — no penalty, but no credit either.

## Rules for solving exercises

- Solving in pairs/teams is fine; presenting is always solo.
- AI tools are allowed for solving — but you're personally responsible for understanding and being
  able to explain the resulting solution, unassisted, live.
- Notes and code comments are allowed as memory aids. **Reading prepared notes/comments aloud
  during the presentation does not satisfy the "explain" or "understanding" criteria.**

## Presentation-format guidance: keep it live, skip building "interactive" extras

**Recommendation: don't build a separate interactive-presentation format (slides with polls,
quizzes, clickable decks, etc.) — the live running app plus live commit diffs already are the
interactive element the rubric rewards.**

Why:
- None of the 30 points are for presentation polish or format — they're demo-correctness (10),
  explanation (10), theory/follow-ups (10). Time spent building presentation tooling doesn't move
  any of those three numbers.
- `EXERCISE_1.md` already asks for genuine interactivity that counts: being ready to open DevTools
  live on request, and diffing pre-fix vs. post-fix commits on demand rather than describing them.
  Let the lecturer steer what to click, which bug to see, which commit to diff — that's the
  "interactive" that's actually graded.
- A 7–15 minute slot is tight. Extra format (embedded quizzes, audience interaction beyond
  Q&A) eats minutes you need for explanation and follow-up questions, where the actual points are.
- It also risks reading as a rehearsed script — which the rules explicitly say isn't sufficient
  even for plain notes, let alone a built interactive walkthrough.

**Practical prep, per task:**
1. Have the pre-fix commit (or noted hash) ready to check out/diff live for any bug fix.
2. Be ready to navigate the running app itself on request, not a recording or slides.
3. Prepare short, spoken explanations of *why*, not just *what* — the "decisions" criterion is
   about reasoning, not just describing the diff.
4. Review the theory questions under the task in `EXERCISE_1.md` before presenting — those are
   exactly the class of follow-up you'll be asked.

## Per-task checklist

Use `EXERCISE_1.md`'s own task/question checkboxes as the single source of truth for what's
presentable — don't duplicate that list here. Only tick a box there once you can genuinely do all
four things above (demonstrate, explain, understand concepts, handle follow-ups) on the spot.
