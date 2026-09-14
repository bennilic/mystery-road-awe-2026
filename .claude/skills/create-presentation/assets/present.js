// Presenter engine — reads ./steps.json and drives ../index.html (loaded in #appFrame)
// screen-by-screen, with a CSS-selector spotlight and a before/after code panel.
//
// Deliberately dependency-free and DOM/hash-only: it never reaches into the app's internal
// JS state, only its rendered DOM and its 5 hash routes (dashboard/evidence/people/timeline/
// workspace). That keeps it working across Exercise 1's module refactor, since the DOM and
// routing are the one thing that's required to stay behaviorally identical throughout.

const INITIAL_LOAD_DELAY_MS = 700; // let the app's own async data load settle on first paint
const STEP_SETTLE_DELAY_MS = 220; // let handleHashChange's render finish before spotlighting
const WAIT_FOR_TIMEOUT_MS = 600; // max time to poll for a step's `waitFor` selector — local, so fast

const state = {
  steps: [],
  index: 0,
  codeTab: "after", // which tab is active in the current code panel
  renderToken: 0, // bumped on every render() so stale async work from a previous step can detect
                  // it's obsolete and bail out instead of touching the DOM (see showAppStep)
  localRoot: null, // absolute path to this repo on disk, for building vscode:// links — see steps.json
};

const el = {
  frame: document.getElementById("appFrame"),
  spotlight: document.getElementById("spotlight"),
  codePanel: document.getElementById("codePanel"),
  codeContent: document.getElementById("codeContent"),
  codeFileLabel: document.getElementById("codeFileLabel"),
  openInEditorLink: document.getElementById("openInEditorLink"),
  tabBefore: document.getElementById("tabBefore"),
  tabAfter: document.getElementById("tabAfter"),
  stepCounter: document.getElementById("stepCounter"),
  stepTitle: document.getElementById("stepTitle"),
  stepBody: document.getElementById("stepBody"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  hideChromeBtn: document.getElementById("hideChromeBtn"),
  showChromeBtn: document.getElementById("showChromeBtn"),
};

async function init() {
  const res = await fetch("steps.json");
  if (!res.ok) {
    el.stepTitle.textContent = "Couldn't load steps.json";
    el.stepBody.textContent = `HTTP ${res.status}. Check presentation/steps.json exists and is valid JSON.`;
    return;
  }
  const data = await res.json();
  state.steps = sortStepsByExerciseDemo(Array.isArray(data.steps) ? data.steps : []);
  state.localRoot = typeof data.localRoot === "string" ? data.localRoot.replace(/\/+$/, "") : null;
  if (data.title) document.title = data.title;

  if (state.steps.length === 0) {
    el.stepTitle.textContent = "No steps yet";
    el.stepBody.textContent = "presentation/steps.json has no steps. Run the create-presentation skill to add some.";
    el.prevBtn.disabled = true;
    el.nextBtn.disabled = true;
    return;
  }

  const saved = parseInt(sessionStorage.getItem("presentIndex") || "0", 10);
  state.index = Number.isFinite(saved) ? Math.min(Math.max(saved, 0), state.steps.length - 1) : 0;

  let firstRenderDone = false;
  const runFirst = () => {
    if (firstRenderDone) return;
    firstRenderDone = true;
    setTimeout(render, INITIAL_LOAD_DELAY_MS);
  };
  if (el.frame.contentDocument && el.frame.contentDocument.readyState === "complete") {
    runFirst();
  } else {
    el.frame.addEventListener("load", runFirst, { once: true });
  }
}

// Steps are authored in whatever order they were *completed* in class (SKILL.md's own
// procedure says "append new steps for newly-completed demos"), not necessarily Demo order —
// e.g. a Demo 4 fix that lands before Demo 2 gets appended first. This sorts the deck into
// (exercise, demo) order so presentation order always matches the course's numeric order,
// independent of steps.json's raw array order. Missing exercise/demo fields default to 0,
// which intentionally matches the convention for general app-tour steps not tied to a specific
// demo (see SKILL.md "Steps schema") — both untagged legacy steps and intro-tour steps sort
// first within their exercise, ahead of any demo-tagged step. Array.prototype.sort has been
// spec-guaranteed stable since ES2019, so steps with equal (exercise, demo) keep their original
// relative array order as the tiebreak — no manual index bookkeeping needed.
function sortStepsByExerciseDemo(steps) {
  return [...steps].sort((a, b) => {
    const exerciseA = Number.isInteger(a.exercise) ? a.exercise : 0;
    const exerciseB = Number.isInteger(b.exercise) ? b.exercise : 0;
    if (exerciseA !== exerciseB) return exerciseA - exerciseB;
    const demoA = Number.isInteger(a.demo) ? a.demo : 0;
    const demoB = Number.isInteger(b.demo) ? b.demo : 0;
    return demoA - demoB;
  });
}

function currentStep() {
  return state.steps[state.index];
}

function render() {
  const step = currentStep();
  if (!step) return;

  // Any in-flight async work from the previous step's showAppStep (a settle timeout, a
  // waitFor poll) checks this token before touching the DOM. Bumping it here retires that
  // work instantly, even though the setTimeout/poll itself keeps running harmlessly in the
  // background until it naturally expires.
  const token = ++state.renderToken;

  el.stepCounter.textContent = `Step ${state.index + 1} / ${state.steps.length}`;
  el.stepTitle.textContent = step.title || step.id || "(untitled step)";
  el.stepBody.textContent = step.narration || "";
  el.prevBtn.disabled = state.index === 0;
  el.nextBtn.disabled = state.index === state.steps.length - 1;
  sessionStorage.setItem("presentIndex", String(state.index));

  state.codeTab = step.after ? "after" : "before";

  if (step.type === "code") {
    showCodeStep(step);
  } else {
    showAppStep(step, token);
  }
}

function showAppStep(step, token) {
  el.codePanel.classList.add("hidden");
  el.frame.classList.remove("dimmed");

  const isStale = () => token !== state.renderToken;

  const apply = () => {
    let doc;
    try {
      doc = el.frame.contentDocument;
    } catch (e) {
      hideSpotlight();
      return;
    }
    if (!doc) {
      hideSpotlight();
      return;
    }

    const win = doc.defaultView;
    const desiredHash = step.view ? `#${step.view}` : null;
    const needsNav = desiredHash && win.location.hash !== desiredHash;
    if (needsNav) {
      win.location.hash = step.view;
    }

    const finish = () => {
      if (isStale()) return; // user has since moved to a different step — don't touch its DOM
      if (step.action && step.action.type === "click" && step.action.selector) {
        const target = doc.querySelector(step.action.selector);
        if (target) target.click();
      }
      if (step.highlight) {
        positionSpotlight(step.highlight);
      } else {
        hideSpotlight();
      }
    };

    // Give handleHashChange's render function a moment to build the new view's DOM
    // before we look for the highlight target or fire the reproduction click.
    setTimeout(() => {
      if (isStale()) return;
      if (step.waitFor) {
        waitForSelector(doc, step.waitFor, WAIT_FOR_TIMEOUT_MS, isStale).then(finish);
      } else {
        finish();
      }
    }, needsNav ? STEP_SETTLE_DELAY_MS : 30);
  };

  apply();
}

// Polls for `selector` to appear in `doc`, up to `timeoutMs`. Resolves either way — a step
// whose content never shows up (e.g. a view that's stuck loading) still gets presented rather
// than hanging the whole deck; the spotlight/highlight step just does its best with what's there.
// `isStale`, if given, stops the poll early once the user has moved to a different step, so an
// abandoned poll doesn't keep ticking in the background for the full timeout for no reason.
function waitForSelector(doc, selector, timeoutMs, isStale) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      if (isStale && isStale()) {
        resolve(null);
        return;
      }
      let found;
      try {
        found = doc.querySelector(selector);
      } catch (e) {
        found = null;
      }
      if (found || Date.now() - start >= timeoutMs) {
        resolve(found || null);
      } else {
        setTimeout(poll, 100);
      }
    };
    poll();
  });
}

function positionSpotlight(selector) {
  let target;
  try {
    const doc = el.frame.contentDocument;
    target = doc.querySelector(selector);
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "center", inline: "nearest" });
    }
  } catch (e) {
    target = null;
  }

  if (!target) {
    hideSpotlight();
    return;
  }

  requestAnimationFrame(() => {
    const frameRect = el.frame.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const pad = 6;
    el.spotlight.style.left = `${frameRect.left + rect.left - pad}px`;
    el.spotlight.style.top = `${frameRect.top + rect.top - pad}px`;
    el.spotlight.style.width = `${rect.width + pad * 2}px`;
    el.spotlight.style.height = `${rect.height + pad * 2}px`;
    el.spotlight.classList.remove("hidden");
  });
}

function hideSpotlight() {
  el.spotlight.classList.add("hidden");
}

function showCodeStep(step) {
  hideSpotlight();
  el.frame.classList.add("dimmed");
  el.codePanel.classList.remove("hidden");

  const hasBoth = Boolean(step.before && step.after);
  el.tabBefore.classList.toggle("hidden", !hasBoth);
  el.tabAfter.classList.toggle("hidden", !hasBoth);
  el.codeFileLabel.textContent = step.file || "";

  updateOpenInEditorLink(step);
  renderCodeTab(step);
}

// Builds a vscode://file/<absolute-path>:<line> link so a code slide can jump straight to the
// real file at the first changed line, instead of just showing a static snippet. Requires
// `localRoot` (this repo's absolute path on disk) to be set in steps.json — see SKILL.md. It's
// inherently machine-specific (an absolute path), which is fine: this presenter is a single-user,
// single-laptop tool, not something shared across machines.
function updateOpenInEditorLink(step) {
  if (!step.file || !state.localRoot) {
    el.openInEditorLink.classList.add("hidden");
    return;
  }
  const line = Number.isInteger(step.line) && step.line > 0 ? step.line : 1;
  // localRoot is always an absolute path (starts with "/"), so no extra slash goes between
  // "file" and it — vscode://file/Users/... is correct; vscode://file//Users/... is not.
  el.openInEditorLink.href = `vscode://file${state.localRoot}/${step.file}:${line}`;
  el.openInEditorLink.textContent = `Open ${step.file}:${line} in VS Code →`;
  el.openInEditorLink.classList.remove("hidden");
}

function renderCodeTab(step) {
  const showingBefore = state.codeTab === "before" && step.before;
  el.tabBefore.classList.toggle("active", showingBefore);
  el.tabAfter.classList.toggle("active", !showingBefore);
  const snippet = showingBefore ? step.before : (step.after || step.before);
  el.codeContent.textContent = snippet || "(no snippet provided for this step)";
}

el.tabBefore.addEventListener("click", () => {
  state.codeTab = "before";
  const step = currentStep();
  if (step) renderCodeTab(step);
});

el.tabAfter.addEventListener("click", () => {
  state.codeTab = "after";
  const step = currentStep();
  if (step) renderCodeTab(step);
});

function go(delta) {
  const next = state.index + delta;
  if (next < 0 || next >= state.steps.length) return;
  state.index = next;
  render();
}

el.prevBtn.addEventListener("click", () => go(-1));
el.nextBtn.addEventListener("click", () => go(1));

function toggleChrome() {
  const hidden = document.body.classList.toggle("chrome-hidden");
  el.showChromeBtn.classList.toggle("hidden", !hidden);
}

el.hideChromeBtn.addEventListener("click", toggleChrome);
el.showChromeBtn.addEventListener("click", toggleChrome);

window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    go(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    go(-1);
  } else if (e.key === "h" || e.key === "Escape") {
    toggleChrome();
  }
});

window.addEventListener("resize", () => {
  const step = currentStep();
  if (step && step.type !== "code" && step.highlight) {
    positionSpotlight(step.highlight);
  }
});

init();
