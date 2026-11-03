import type { ReactNode } from "react";

// Each variant maps 1:1 to a `.badge-<variant>` rule in styles.css.
export type BadgeVariant =
  "critical" | "unreviewed" | "reviewed" | "flagged" | "relevant" | "relevance-unclear";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

// What varies per use (colour variant, label) is a prop; what is fixed (the
// pill markup and the `badge` base class) lives here once.
export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
