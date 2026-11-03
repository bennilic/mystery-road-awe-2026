import { memo, useState } from "react";
import { toggleBookmarkId } from "../shared/bookmarks/toggleBookmarkId.ts";

// A component that only re-renders when its `items` prop is a different
// object, like any React.memo child or any effect/memo dependency.
const ItemCount = memo(function ItemCount({ items }: { items: string[] }) {
  return <output id="countFromMemo">memo child sees {items.length} items</output>;
});

// Runs the real toggle on a frozen array: a version that mutated its input
// would throw a TypeError here (modules are strict mode).
function checkToggleIsImmutable(): string[] {
  const original = Object.freeze(["E01", "E02"]);
  const added = toggleBookmarkId(original, "E03");
  const removed = toggleBookmarkId(original, "E01");
  return [
    `add returns a new array: ${added !== original}`,
    `remove returns a new array: ${removed !== original}`,
    `input unchanged: ${original.join(",") === "E01,E02"}`,
    `add result: ${added.join(",")}`,
    `remove result: ${removed.join(",")}`,
  ];
}

// Throwaway teaching demo (Exercise 5, Demo 3).
export function MutationDemo() {
  const [items, setItems] = useState<string[]>(["E02", "E01"]);
  const [, setUnrelatedTick] = useState(0);

  function pushMutating() {
    items.push("E03"); // mutates the array React is holding
    setItems(items); // same reference: React sees "no change" and bails out
  }
  function appendImmutably() {
    setItems([...items, "E03"]);
  }
  // The vanilla bug, reproduced: `visible` and `items` are the SAME array.
  function sortMutating() {
    const visible = items;
    visible.sort();
    setItems(visible);
  }
  function sortOnCopy() {
    setItems([...items].sort());
  }

  return (
    <div className="form-row">
      <p>
        State array: <output id="listText">{items.join(", ")}</output>
      </p>
      <ItemCount items={items} />
      <div className="toolbar-row">
        <button type="button" id="pushMutating" className="btn" onClick={pushMutating}>
          push (mutating)
        </button>
        <button type="button" id="appendImmutably" className="btn" onClick={appendImmutably}>
          append with spread
        </button>
        <button type="button" id="sortMutating" className="btn" onClick={sortMutating}>
          sort shared array
        </button>
        <button type="button" id="sortOnCopy" className="btn" onClick={sortOnCopy}>
          sort a copy
        </button>
        <button
          type="button"
          id="unrelatedRender"
          className="btn"
          onClick={() => setUnrelatedTick((tick) => tick + 1)}
        >
          unrelated re-render
        </button>
      </div>
      <h3>toggleBookmarkId on a frozen array</h3>
      <ul id="toggleCheck">
        {checkToggleIsImmutable().map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
