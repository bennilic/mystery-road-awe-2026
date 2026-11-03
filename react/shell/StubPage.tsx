interface StubPageProps {
  title: string;
  migratedInExercise: number;
  // Which view of the vanilla app to link to (its own hash, e.g. "evidence").
  vanillaView: string;
}

// Placeholder for the four views that are still vanilla TypeScript. Keeps
// the routing skeleton honest (five real routes) without pretending the
// content exists yet.
export function StubPage({ title, migratedInExercise, vanillaView }: StubPageProps) {
  return (
    <section className="view active">
      <h2>{title}</h2>
      <div className="intro-card">
        <p>
          This view has not been migrated to React yet (planned for Exercise {migratedInExercise}).
          The full version is still available in the{" "}
          <a href={`index.html#${vanillaView}`}>vanilla app</a>.
        </p>
      </div>
    </section>
  );
}
