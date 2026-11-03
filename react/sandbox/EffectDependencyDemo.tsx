import { useEffect, useState } from "react";

// Throwaway teaching demo (Exercise 6, Demo 2): how often does each effect run?
const effectRuns = { emptyArray: 0, populatedArray: 0, noArray: 0 };

export function EffectDependencyDemo() {
  const [watchedCount, setWatchedCount] = useState(0);
  const [unrelatedCount, setUnrelatedCount] = useState(0);
  const [, showRuns] = useState(0);

  useEffect(() => {
    effectRuns.emptyArray += 1;
    console.log("[effect []] ran");
  }, []);

  useEffect(() => {
    effectRuns.populatedArray += 1;
    console.log(`[effect [watchedCount]] ran, watchedCount=${watchedCount}`);
  }, [watchedCount]);

  useEffect(() => {
    effectRuns.noArray += 1;
    console.log("[effect (no array)] ran");
  });

  return (
    <section>
      <h3>Demo 2: dependency arrays</h3>
      <p>
        watchedCount = <output id="watchedCount">{watchedCount}</output>, unrelatedCount ={" "}
        <output id="unrelatedCount">{unrelatedCount}</output>
      </p>
      <div className="toolbar-row">
        <button type="button" id="bumpWatched" onClick={() => setWatchedCount((n) => n + 1)}>
          change watchedCount
        </button>
        <button type="button" id="bumpUnrelated" onClick={() => setUnrelatedCount((n) => n + 1)}>
          change unrelatedCount
        </button>
        <button type="button" id="showRuns" onClick={() => showRuns((n) => n + 1)}>
          show effect run counts
        </button>
      </div>
      <p>
        runs: <output id="runCounts">{JSON.stringify(effectRuns)}</output>
      </p>
    </section>
  );
}
