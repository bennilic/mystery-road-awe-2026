import { useState } from "react";

// Throwaway teaching demo (Exercise 5, Demo 2). Same <input>, wired two ways.
export function ControlledInputDemo() {
  const [text, setText] = useState("");

  return (
    <div className="form-row">
      <label htmlFor="frozenInput">
        value without onChange (React warns and the field is read-only)
      </label>
      <input id="frozenInput" type="text" value="try typing here" />
      <label htmlFor="wiredInput">value + onChange</label>
      <input
        id="wiredInput"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <output id="wiredEcho">{text}</output>
    </div>
  );
}
