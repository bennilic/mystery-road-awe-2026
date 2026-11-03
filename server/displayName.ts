const NAME_PREFIX = "Investigator";
const FIRST_RANDOM_NUMBER = 10;
const RANDOM_NUMBER_COUNT = 90; // 10..99

// Picks "Investigator-42"-style names. A name that is already taken is never
// handed out twice, otherwise the presence list could not tell two tabs apart.
export function createDisplayName(
  takenNames: ReadonlySet<string>,
  random: () => number = Math.random,
): string {
  const startNumber = FIRST_RANDOM_NUMBER + Math.floor(random() * RANDOM_NUMBER_COUNT);
  // Count upwards from the random start: it always ends, because only finitely many names are taken.
  for (let number = startNumber; ; number++) {
    const name = `${NAME_PREFIX}-${number}`;
    if (!takenNames.has(name)) return name;
  }
}
