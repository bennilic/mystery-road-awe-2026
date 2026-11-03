import { useEffect, useState } from "react";

// Throwaway teaching demo (Exercise 6, Demo 3): the same effect with and
// without its cleanup function. `liveSubscriptions` counts timers that were
// started and never stopped; each one keeps ticking after its component is gone.
let liveSubscriptions = 0;

interface TickerProps {
  intervalMs: number;
  hasCleanup: boolean;
  onLog: (line: string) => void;
}

function Ticker({ intervalMs, hasCleanup, onLog }: TickerProps) {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    liveSubscriptions += 1;
    onLog(`SETUP   interval ${intervalMs}ms (live timers: ${liveSubscriptions})`);
    const timerId = window.setInterval(() => setTicks((n) => n + 1), intervalMs);
    if (!hasCleanup) return;
    return () => {
      window.clearInterval(timerId);
      liveSubscriptions -= 1;
      onLog(`CLEANUP interval ${intervalMs}ms (live timers: ${liveSubscriptions})`);
    };
    // onLog is stable (setState wrapper below); hasCleanup is part of the demo setup
  }, [intervalMs, hasCleanup, onLog]);

  return (
    <p>
      Ticker: <output id="tickerTicks">{ticks}</output> ticks
    </p>
  );
}

export function CleanupDemo() {
  const [isMounted, setIsMounted] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1000);
  const [hasCleanup, setHasCleanup] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [, refresh] = useState(0);

  // Stable identity so it can sit in the effect's dependency array.
  const [appendLog] = useState(() => (line: string) => {
    console.log(line);
    setLog((previous) => [...previous, line]);
  });

  return (
    <section>
      <h3>Demo 3: cleanup</h3>
      <div className="toolbar-row">
        <label>
          <input
            type="checkbox"
            id="hasCleanup"
            checked={hasCleanup}
            onChange={(event) => setHasCleanup(event.target.checked)}
          />{" "}
          effect returns a cleanup
        </label>
        <button type="button" id="toggleMount" onClick={() => setIsMounted((value) => !value)}>
          {isMounted ? "unmount Ticker" : "mount Ticker"}
        </button>
        <button type="button" id="changeInterval" onClick={() => setIntervalMs((ms) => ms + 500)}>
          change interval (now {intervalMs}ms)
        </button>
        <button type="button" id="refreshLive" onClick={() => refresh((n) => n + 1)}>
          read live timers
        </button>
      </div>
      {isMounted && <Ticker intervalMs={intervalMs} hasCleanup={hasCleanup} onLog={appendLog} />}
      <p>
        timers still running: <output id="liveTimers">{liveSubscriptions}</output>
      </p>
      <pre id="cleanupLog">{log.join("\n")}</pre>
    </section>
  );
}
