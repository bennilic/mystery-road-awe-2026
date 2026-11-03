import type { ReactNode } from "react";

export type CardVariant = "person" | "location";

interface CardProps {
  variant: CardVariant;
  children: ReactNode;
}

// Composition via `children`: the card shell owns only the outer box (and the
// variant class that styles it); what goes inside is decided by the caller.
// A data prop would force this component to know about people AND locations.
export function Card({ variant, children }: CardProps) {
  return <div className={`${variant}-card`}>{children}</div>;
}
