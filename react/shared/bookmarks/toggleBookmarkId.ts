// Returns a NEW array with `evidenceId` added or removed; never touches
// `bookmarkedIds`. React decides whether to re-render by comparing the old and
// new state with Object.is, so a changed value needs a changed reference.
export function toggleBookmarkId(bookmarkedIds: readonly string[], evidenceId: string): string[] {
  return bookmarkedIds.includes(evidenceId)
    ? bookmarkedIds.filter((id) => id !== evidenceId)
    : [...bookmarkedIds, evidenceId];
}
