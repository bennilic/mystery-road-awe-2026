// Turns a rejected localStorage write into a message that says what was not
// saved, why, and what to do (the browser's own text is the "why").
export function describeStorageFailure(whatWasLost: string, error: unknown): string {
  const reason = error instanceof Error ? error.message : String(error);
  return `${whatWasLost} could not be saved to this browser (${reason}). It stays visible until you reload. Free up browser storage or leave private browsing, then try again.`;
}
