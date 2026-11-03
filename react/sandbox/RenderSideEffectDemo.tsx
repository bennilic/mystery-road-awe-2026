import { useEffect, useRef, useState } from "react";

// Throwaway teaching demo (Exercise 6, Demo 1).
// Module-level variable that the "bad" component mutates while rendering.
let badRenderCounter = 0;

// BAD: three side effects performed directly in the render body.
//  1. mutates a variable outside the component,
//  2. console.log on every render,
//  3. reads localStorage inline.
// It "seems to work" with one render, but React may render twice (Strict Mode).
function BadRenderComponent() {
  badRenderCounter += 1; // (1) outside world changes during render
  console.log(`[bad] render body ran, counter=${badRenderCounter}`); // (2)
  const savedName = localStorage.getItem("sandbox_name") ?? "nobody"; // (3)
  return (
    <p>
      BAD: module counter = <output id="badCounter">{badRenderCounter}</output>, saved name ={" "}
      <output id="badName">{savedName}</output>
    </p>
  );
}

// GOOD: render only computes JSX from props/state. Anything that touches the
// outside world runs in an effect (after React has committed the render) or
// in an event handler.
function GoodRenderComponent() {
  const [savedName, setSavedName] = useState("nobody");
  const committedRenders = useRef(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    committedRenders.current += 1;
    console.log(`[good] effect ran after commit, count=${committedRenders.current}`);
  });
  useEffect(() => {
    setSavedName(localStorage.getItem("sandbox_name") ?? "nobody");
  }, []);

  return (
    <p>
      GOOD: saved name = <output id="goodName">{savedName}</output>{" "}
      <button type="button" id="rerender" onClick={() => forceRender((count) => count + 1)}>
        re-render
      </button>
    </p>
  );
}

export function RenderSideEffectDemo() {
  const [, forceRender] = useState(0);
  return (
    <section>
      <h3>Demo 1: render vs. effect</h3>
      <BadRenderComponent />
      <GoodRenderComponent />
      <button type="button" id="rerenderParent" onClick={() => forceRender((count) => count + 1)}>
        re-render parent
      </button>
    </section>
  );
}
