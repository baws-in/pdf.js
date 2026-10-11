/*
 * New BAWS reader UI, behind a feature flag (see the script at the top of
 * viewer.html: "ui=2" in the URL or localStorage.readerUI = "2").
 *
 * Builds the top bar, page slider, bottom dock, "More" sheet and toasts.
 * Every button comes from one action registry, so a new tool is one
 * registerAction() call; where it shows up (dock, top bar, More sheet) is a
 * property of the action. The work itself is done by the existing functions
 * in viewer-flexi.js (openNextPage, addBookMark, shareButtonClick, ...).
 *
 * Gestures: text selection always wins. A tap only toggles the controls when
 * it is short, still, not part of a double tap and leaves no selection;
 * swipes (touch only) turn pages when nothing is selected and the page is not
 * scrolled sideways.
 */
(function () {
  "use strict";

  if (window.BAWS_READER_UI !== 2) {
    return;
  }

  const TAP_MAX_MS = 250;
  const TAP_MAX_MOVE = 10;
  const DOUBLE_TAP_WAIT = 320;
  const SWIPE_MIN_X = 60;
  const SWIPE_MAX_MS = 600;
  const LONG_PRESS_MS = 600;
  const SCROLL_HIDE_DELTA = 8;

  // Lucide-style 24px stroke icons.
  const ICONS = {
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
    contents: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    listen:
      '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    highlight:
      '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    share:
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    more: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    prev: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    page: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h3"/>',
    phone:
      '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    fullscreen:
      '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    zoomIn:
      '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    zoomOut:
      '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3M8 11h6"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    define:
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    speak:
      '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause:
      '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    prevSentence:
      '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
    nextSentence:
      '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    prevPage: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
    nextPage: '<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
    expand: '<path d="m18 15-6-6-6 6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    caretDown: '<path d="m6 9 6 6 6-6"/>',
    note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    notebook:
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    trash:
      '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  };

  function icon(name) {
    return (
      '<svg class="rui-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      (ICONS[name] || "") +
      "</svg>"
    );
  }

  function el(tag, className, attrs) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    for (const [key, value] of Object.entries(attrs || {})) {
      node.setAttribute(key, value);
    }
    return node;
  }

  function hasSelection() {
    const selection = window.getSelection();
    return (
      !!selection &&
      !selection.isCollapsed &&
      selection.toString().trim().length > 0
    );
  }

  function app() {
    return window.PDFViewerApplication;
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  // ---------------------------------------------------------------------
  // Action registry
  // ---------------------------------------------------------------------

  /**
   * @typedef {Object} ReaderAction
   * @property {string} id
   * @property {string|function} label
   * @property {string} icon - key of ICONS
   * @property {Array<string>} placements - "top-start", "top-end", "dock",
   *   "more"
   * @property {string} [group] - More sheet group title
   * @property {number} [priority] - higher comes first
   * @property {string} [elementId] - DOM id for the button (kept stable for
   *   the app's tutorial, e.g. "bookMark", "shareButton")
   * @property {function} [run]
   * @property {function} [longPress]
   * @property {function} [pressed] - returns true for a toggled-on state
   * @property {function} [visible] - returns false to hide
   */
  const actions = new Map();

  function registerAction(action) {
    actions.set(action.id, { priority: 0, ...action });
    if (chromeBuilt) {
      renderBars();
    }
  }

  function actionsFor(placement) {
    return [...actions.values()]
      .filter(a => a.placements.includes(placement))
      .filter(a => !a.visible || a.visible())
      .sort((a, b) => b.priority - a.priority);
  }

  function labelOf(action) {
    return typeof action.label === "function" ? action.label() : action.label;
  }

  function wireButton(button, action) {
    let pressTimer = null;
    let longPressed = false;
    if (action.longPress) {
      const start = () => {
        longPressed = false;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
          longPressed = true;
          action.longPress(button);
        }, LONG_PRESS_MS);
      };
      const cancel = () => clearTimeout(pressTimer);
      button.addEventListener("pointerdown", start);
      button.addEventListener("pointerup", cancel);
      button.addEventListener("pointerleave", cancel);
      button.addEventListener("pointercancel", cancel);
      button.addEventListener("contextmenu", e => e.preventDefault());
    }
    button.addEventListener("click", event => {
      if (longPressed) {
        longPressed = false;
        return;
      }
      action.run?.(event, button);
    });
  }

  function makeIconButton(action) {
    const button = el("button", "rui-icon-btn", {
      type: "button",
      "aria-label": labelOf(action),
      title: labelOf(action),
    });
    if (action.elementId) {
      button.id = action.elementId;
    }
    if (action.iconText) {
      // A text glyph instead of an icon (e.g. "Aa" for display settings).
      button.classList.add("rui-aa");
      button.textContent = action.iconText;
      wireButton(button, action);
      return button;
    }
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    button.innerHTML = icon(action.icon);
    wireButton(button, action);
    return button;
  }

  function makeDockButton(action) {
    const button = el("button", "rui-dock-btn", { type: "button" });
    if (action.elementId) {
      button.id = action.elementId;
    }
    if (action.pressed) {
      button.setAttribute("aria-pressed", String(!!action.pressed()));
    }
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    button.innerHTML = icon(action.icon) + "<span></span>";
    button.querySelector("span").textContent = labelOf(action);
    wireButton(button, action);
    return button;
  }

  function makeTile(action) {
    const button = el("button", "rui-tile", { type: "button" });
    if (action.pressed) {
      button.setAttribute("aria-pressed", String(!!action.pressed()));
    }
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    button.innerHTML = icon(action.icon) + "<span></span>";
    button.querySelector("span").textContent = labelOf(action);
    wireButton(button, action);
    return button;
  }

  // ---------------------------------------------------------------------
  // Chrome (top bar, bottom bar, toasts)
  // ---------------------------------------------------------------------

  let chromeBuilt = false;
  const ui = {};

  function buildChrome() {
    // The old bottom bar shares ids (bookMark, shareButton, voiceButton...)
    // with the new controls, so it has to go before they are created.
    document.getElementById("bawsBottomBar")?.remove();

    const host = document.getElementById("outerContainer") || document.body;

    ui.top = el("header", "rui-top");
    ui.topStart = el("div", "", { style: "display:flex" });
    // The title opens "Go to start" (start of this chapter, part or book).
    // Long titles are cut short with "…" in the bar; the sheet shows them
    // in full.
    ui.title = el("button", "rui-title", {
      type: "button",
      "aria-haspopup": "dialog",
    });
    ui.titleSub = el("span", "rui-title-sub");
    const mainRow = el("span", "rui-title-row");
    ui.titleMain = el("span", "rui-title-main");
    const caret = el("span", "rui-title-caret", { "aria-hidden": "true" });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    caret.innerHTML = icon("caretDown");
    mainRow.append(ui.titleMain, caret);
    ui.title.append(ui.titleSub, mainRow);
    wireButton(ui.title, { run: openJumpSheet, longPress: openJumpSheet });
    ui.topEnd = el("div", "", { style: "display:flex" });
    ui.top.append(ui.topStart, ui.title, ui.topEnd);

    ui.bottom = el("div", "rui-bottom");
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    ui.bottom.innerHTML =
      '<div class="rui-scrub">' +
      '<button type="button" class="rui-icon-btn" data-rui="prev" aria-label="Previous page" title="Previous page">' +
      icon("prev") +
      "</button>" +
      '<div class="rui-scrub-mid">' +
      '<div class="rui-scrub-track">' +
      '<div class="rui-scrub-ticks"></div>' +
      '<div class="rui-scrub-marks" aria-hidden="true"></div>' +
      '<input type="range" class="rui-scrub-range" min="1" max="1" value="1" step="1" aria-label="Page">' +
      '<div class="rui-scrub-bubble" hidden></div>' +
      "</div>" +
      '<div class="rui-scrub-labels"><span data-rui="page"></span><span data-rui="hint"></span></div>' +
      "</div>" +
      '<button type="button" class="rui-icon-btn" data-rui="next" aria-label="Next page" title="Next page">' +
      icon("next") +
      "</button>" +
      "</div>" +
      '<nav class="rui-dock" aria-label="Reader tools"></nav>';
    ui.range = ui.bottom.querySelector(".rui-scrub-range");
    ui.ticks = ui.bottom.querySelector(".rui-scrub-ticks");
    ui.marks = ui.bottom.querySelector(".rui-scrub-marks");
    ui.bubble = ui.bottom.querySelector(".rui-scrub-bubble");
    ui.pageLabel = ui.bottom.querySelector('[data-rui="page"]');
    ui.pageHint = ui.bottom.querySelector('[data-rui="hint"]');
    ui.dock = ui.bottom.querySelector(".rui-dock");

    ui.toasts = el("div", "rui-toasts", {
      role: "status",
      "aria-live": "polite",
    });

    host.append(ui.top, ui.bottom, ui.toasts);

    ui.bottom
      .querySelector('[data-rui="prev"]')
      .addEventListener("click", () => navigate("prev"));
    ui.bottom
      .querySelector('[data-rui="next"]')
      .addEventListener("click", () => navigate("next"));
    wireRange();

    chromeBuilt = true;
    renderBars();
  }

  function renderBars() {
    ui.topStart.replaceChildren(...actionsFor("top-start").map(makeIconButton));
    ui.topEnd.replaceChildren(...actionsFor("top-end").map(makeIconButton));
    const dockActions = actionsFor("dock").slice(0, 5);
    ui.dock.style.setProperty("--rui-dock-count", dockActions.length);
    ui.dock.replaceChildren(...dockActions.map(makeDockButton));
  }

  function refreshPressedStates() {
    for (const action of actions.values()) {
      if (!action.pressed || !action.elementId) {
        continue;
      }
      document
        .getElementById(action.elementId)
        ?.setAttribute("aria-pressed", String(!!action.pressed()));
    }
  }

  // ---------------------------------------------------------------------
  // Show / hide the controls
  // ---------------------------------------------------------------------

  let chromeHidden = false;
  let suppressScrollUntil = 0;

  function setChromeHidden(hidden) {
    if (hidden && (sheetOpen || hasSelection())) {
      return;
    }
    chromeHidden = hidden;
    document.documentElement.classList.toggle("rui-chrome-hidden", hidden);
    ui.top.inert = hidden;
    ui.bottom.inert = hidden;
  }

  function toggleChrome() {
    setChromeHidden(!chromeHidden);
  }

  /** Navigation we start ourselves shouldn't count as "reading forward". */
  function navigate(direction) {
    suppressScrollUntil = performance.now() + 800;
    if (direction === "next") {
      window.openNextPage?.();
    } else {
      window.openPrevPage?.();
    }
  }

  function wireScrollHiding(container) {
    let lastTop = container.scrollTop;
    let ticking = false;
    container.addEventListener(
      "scroll",
      () => {
        if (ticking) {
          return;
        }
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const top = container.scrollTop;
          const delta = top - lastTop;
          if (Math.abs(delta) < SCROLL_HIDE_DELTA) {
            return;
          }
          lastTop = top;
          if (performance.now() < suppressScrollUntil) {
            return;
          }
          if (delta > 0 && top > 80) {
            setChromeHidden(true);
          } else if (delta < 0) {
            setChromeHidden(false);
          }
        });
      },
      { passive: true }
    );
  }

  const INTERACTIVE =
    "a, button, input, select, textarea, label, [contenteditable], " +
    ".highlight-group, .delete-highlight-btn, .annotationLayer section, " +
    "[data-rui-no-tap]";

  function wireGestures(container) {
    let touch = null;
    let pendingTap = null;
    let lastTouchEnd = 0;

    const cancelPendingTap = () => {
      if (pendingTap) {
        clearTimeout(pendingTap);
        pendingTap = null;
        return true;
      }
      return false;
    };

    const scheduleTap = () => {
      pendingTap = setTimeout(() => {
        pendingTap = null;
        if (!hasSelection()) {
          toggleChrome();
        }
      }, DOUBLE_TAP_WAIT);
    };

    // --- Touch: taps and swipes ---
    container.addEventListener(
      "touchstart",
      event => {
        if (event.touches.length !== 1) {
          touch = null; // pinch or multi-finger: not ours
          return;
        }
        const t = event.touches[0];
        touch = {
          x: t.clientX,
          y: t.clientY,
          time: performance.now(),
          hadSelection: hasSelection(),
          secondTap: cancelPendingTap(),
          interactive: !!event.target.closest?.(INTERACTIVE),
        };
      },
      { passive: true }
    );

    container.addEventListener("touchcancel", () => (touch = null), {
      passive: true,
    });

    // Once a touch is clearly a sideways page-turn swipe, stop the browser
    // from also treating it as "swipe to go back" (which jumps through
    // pdf.js's page history). Slow starts (long press, selection handles)
    // and vertical moves are left alone.
    container.addEventListener(
      "touchmove",
      event => {
        if (
          !touch ||
          event.touches.length !== 1 ||
          touch.hadSelection ||
          sheetOpen ||
          storageGet("readerSwipe") === "0"
        ) {
          return;
        }
        const t = event.touches[0];
        const dx = t.clientX - touch.x;
        const dy = t.clientY - touch.y;
        if (touch.axis === undefined && Math.hypot(dx, dy) > 8) {
          touch.axis = Math.abs(dx) > 1.5 * Math.abs(dy) ? "x" : "y";
          touch.axisAt = performance.now() - touch.time;
        }
        if (touch.axis !== "x" || touch.axisAt > 300 || hasSelection()) {
          return;
        }
        const atRight =
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 2;
        const atLeft = container.scrollLeft <= 2;
        if (((dx < 0 && atRight) || (dx > 0 && atLeft)) && event.cancelable) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    container.addEventListener(
      "touchend",
      event => {
        lastTouchEnd = performance.now();
        const start = touch;
        touch = null;
        if (!start || event.touches.length > 0) {
          return;
        }
        const t = event.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const dt = performance.now() - start.time;

        if (
          Math.abs(dx) >= SWIPE_MIN_X &&
          Math.abs(dx) > 2 * Math.abs(dy) &&
          dt <= SWIPE_MAX_MS &&
          !start.hadSelection &&
          !hasSelection() &&
          !sheetOpen &&
          storageGet("readerSwipe") !== "0"
        ) {
          // When zoomed in, a sideways swipe scrolls first; only turn the
          // page once the view is already at that edge.
          const atRight =
            container.scrollLeft + container.clientWidth >=
            container.scrollWidth - 2;
          const atLeft = container.scrollLeft <= 2;
          // Swiping through pages is reading: get the controls out of the way.
          if (dx < 0 && atRight) {
            navigate("next");
            setChromeHidden(true);
          } else if (dx > 0 && atLeft) {
            navigate("prev");
            setChromeHidden(true);
          }
          return;
        }

        if (
          dt <= TAP_MAX_MS &&
          Math.hypot(dx, dy) <= TAP_MAX_MOVE &&
          !start.hadSelection &&
          !start.secondTap &&
          !start.interactive
        ) {
          if (!defineWordAt(t.clientX, t.clientY)) {
            scheduleTap();
          }
        }
      },
      { passive: true }
    );

    // --- Mouse: single clicks only; drags select text ---
    let mouseDown = null;
    container.addEventListener("mousedown", event => {
      mouseDown = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        hadSelection: hasSelection(),
      };
    });
    container.addEventListener("click", event => {
      // Touch also produces a click; that case is handled above.
      if (performance.now() - lastTouchEnd < 800 || !mouseDown) {
        return;
      }
      const start = mouseDown;
      mouseDown = null;
      if (event.detail > 1) {
        cancelPendingTap(); // double click selects a word
        return;
      }
      const moved = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y
      );
      if (
        moved <= TAP_MAX_MOVE &&
        performance.now() - start.time <= 400 &&
        !start.hadSelection &&
        !event.target.closest?.(INTERACTIVE)
      ) {
        if (!defineWordAt(event.clientX, event.clientY)) {
          scheduleTap();
        }
      }
    });
  }

  // ---------------------------------------------------------------------
  // Page slider, titles
  // ---------------------------------------------------------------------

  let scrubbing = false;

  function pagesCount() {
    return app()?.pagesCount || 0;
  }

  function currentPage() {
    return app()?.page || 1;
  }

  function outline() {
    const tree = app()?.outline;
    return tree && Array.isArray(tree.items) ? tree : null;
  }

  /** Outline nodes containing `page`, outermost first (without the root). */
  function outlinePath(page) {
    const tree = outline();
    const path = [];
    if (!tree) {
      return path;
    }
    let nodes = tree.items;
    while (nodes) {
      const node = nodes.find(n => page >= n.dest && page <= n.end);
      if (!node) {
        break;
      }
      path.push(node);
      nodes = node.items;
    }
    return path;
  }

  function bookLabel() {
    try {
      if (window.parent !== window && window.parent.document.title) {
        return window.parent.document.title;
      }
    } catch {
      // Cross-origin parent; fall back to the PDF's own title.
    }
    return document.title || "";
  }

  function wireRange() {
    const range = ui.range;
    const showBubble = () => {
      const page = Number(range.value);
      const section = outlinePath(page).at(-1)?.title;
      ui.bubble.textContent = section ? `${page} · ${section}` : `Page ${page}`;
      ui.bubble.hidden = false;
      const max = Number(range.max) || 1;
      const ratio = max > 1 ? (page - 1) / (max - 1) : 0;
      ui.bubble.style.left = `${ratio * 100}%`;
      setRangeProgress(page);
    };
    range.addEventListener("input", () => {
      scrubbing = true;
      showBubble();
    });
    range.addEventListener("change", () => {
      scrubbing = false;
      ui.bubble.hidden = true;
      suppressScrollUntil = performance.now() + 800;
      if (app()) {
        app().page = Number(range.value);
      }
    });
    range.addEventListener("blur", () => {
      scrubbing = false;
      ui.bubble.hidden = true;
    });
  }

  function setRangeProgress(page) {
    const max = Number(ui.range.max) || 1;
    const ratio = max > 1 ? (page - 1) / (max - 1) : 0;
    ui.range.style.setProperty("--rui-progress", `${ratio * 100}%`);
  }

  function renderTicks() {
    const tree = outline();
    const total = pagesCount();
    ui.ticks.replaceChildren();
    if (!tree || total < 2) {
      return;
    }
    // Chapters: the second level when the volume holds several books.
    let chapters = tree.items;
    if (chapters.length <= 3 && chapters.some(n => n.items?.length)) {
      chapters = chapters.flatMap(n => (n.items?.length ? n.items : [n]));
    }
    for (const node of chapters) {
      if (!(node.dest >= 1 && node.dest <= total)) {
        continue;
      }
      const tick = el("span", "rui-scrub-tick");
      tick.style.left = `${((node.dest - 1) / (total - 1)) * 100}%`;
      ui.ticks.append(tick);
    }
  }

  function updatePageUI() {
    const total = pagesCount();
    const page = currentPage();
    if (!total) {
      return;
    }
    ui.range.max = String(total);
    if (!scrubbing) {
      ui.range.value = String(page);
      setRangeProgress(page);
    }
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    ui.pageLabel.replaceChildren();
    ui.pageLabel.append("Page ");
    const strong = document.createElement("strong");
    strong.textContent = String(page);
    ui.pageLabel.append(strong, ` of ${total}`);

    const path = outlinePath(page);
    const section = path.at(-1);
    if (section && section.end >= page) {
      const left = section.end - page;
      ui.pageHint.textContent =
        left === 0
          ? "Last page of chapter"
          : `${left} page${left === 1 ? "" : "s"} left in chapter`;
    } else {
      ui.pageHint.textContent = "";
    }

    const book = bookLabel();
    if (section) {
      ui.titleSub.textContent = book;
      ui.titleMain.textContent = cleanTitle(section.title);
    } else {
      ui.titleSub.textContent = `Page ${page}`;
      ui.titleMain.textContent = book;
    }
    // Full titles on hover (desktop) and for screen readers.
    const full = `${ui.titleMain.textContent} — ${ui.titleSub.textContent}`;
    ui.title.title = full;
    ui.title.setAttribute(
      "aria-label",
      `${full}. Go to the start of the chapter or book`
    );
  }

  function cleanTitle(title) {
    return String(title || "")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  /** "Go to start": the current chapter and each level above it. */
  function openJumpSheet() {
    const page = currentPage();
    const path = outlinePath(page).reverse(); // deepest (chapter) first
    openSheet("Go to start", body => {
      const list = el("div", "rui-jump");
      const addRow = (label, title, dest) => {
        const row = el("button", "rui-jump-row", { type: "button" });
        const text = el("span", "rui-jump-text");
        const kind = el("span", "rui-jump-kind");
        kind.textContent = label;
        const name = el("span", "rui-jump-title");
        name.textContent = title;
        text.append(kind, name);
        const where = el("span", "rui-jump-page");
        where.textContent = dest === page ? "You're here" : `Page ${dest}`;
        row.append(text, where);
        row.addEventListener("click", () => {
          goToPage(dest);
          closeSheet();
        });
        list.append(row);
      };
      path.forEach((node, i) => {
        let label = "Start of this part";
        if (i === path.length - 1) {
          label = "Start of this book"; // outermost level
        } else if (i === 0) {
          label = "Start of this chapter"; // innermost level
        }
        addRow(label, cleanTitle(node.title), node.dest);
      });
      if (path.length === 0 || path.at(-1).dest !== 1) {
        addRow("Start of the volume", bookLabel() || "Page 1", 1);
      }
      if (outline()) {
        const contents = el("button", "rui-chip rui-jump-contents", {
          type: "button",
        });
        contents.textContent = "All contents";
        contents.addEventListener("click", () => openNotebook("contents"));
        list.append(contents);
      }
      body.append(list);
    });
  }

  // ---------------------------------------------------------------------
  // Sheets
  // ---------------------------------------------------------------------

  let sheetOpen = null;

  /**
   * Opens a bottom sheet (a centered panel on wide screens).
   * @param {string} title
   * @param {function(HTMLElement): void} build - fills the sheet body
   */
  function openSheet(title, build) {
    closeSheet(true);
    hideSelectionBar();
    player.sheet = null;
    const returnFocus = document.activeElement;
    const scrim = el("div", "rui-scrim");
    const sheet = el("div", "rui-sheet", {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title,
    });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    sheet.innerHTML =
      '<div class="rui-sheet-handle" aria-hidden="true"></div>' +
      '<div class="rui-sheet-head"><span class="rui-sheet-title"></span>' +
      '<button type="button" class="rui-icon-btn" aria-label="Close">' +
      icon("close") +
      "</button></div>" +
      '<div class="rui-sheet-body"></div>';
    sheet.querySelector(".rui-sheet-title").textContent = title;
    build(sheet.querySelector(".rui-sheet-body"));

    const host = document.getElementById("outerContainer") || document.body;
    host.append(scrim, sheet);
    scrim.addEventListener("click", () => closeSheet());
    sheet
      .querySelector(".rui-sheet-head button")
      .addEventListener("click", () => closeSheet());
    const onKey = event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSheet();
      }
    };
    sheet.addEventListener("keydown", onKey);

    sheetOpen = { scrim, sheet, returnFocus };
    updatePlayer();
    requestAnimationFrame(() => {
      scrim.classList.add("rui-open");
      sheet.classList.add("rui-open");
      (
        sheet.querySelector(".rui-sheet-body input, .rui-sheet-body button") ||
        sheet.querySelector("button")
      )?.focus();
    });
  }

  function closeSheet(immediate = false) {
    if (!sheetOpen) {
      return;
    }
    const { scrim, sheet, returnFocus } = sheetOpen;
    sheetOpen = null;
    player.sheet = null; // the player's controls live in this sheet, if any
    updatePlayer();
    if (immediate) {
      scrim.remove();
      sheet.remove();
    } else {
      scrim.classList.remove("rui-open");
      sheet.classList.remove("rui-open");
      setTimeout(() => {
        scrim.remove();
        sheet.remove();
      }, 260);
    }
    returnFocus?.focus?.();
  }

  function openMoreSheet() {
    openSheet("More", body => {
      const groups = new Map();
      for (const action of actionsFor("more")) {
        const group = action.group || "Tools";
        if (!groups.has(group)) {
          groups.set(group, []);
        }
        groups.get(group).push(action);
      }
      for (const [title, list] of groups) {
        const section = el("div", "rui-group");
        const heading = el("span", "rui-group-title");
        heading.textContent = title;
        const tiles = el("div", "rui-tiles");
        for (const action of list) {
          const tile = makeTile(action);
          tile.addEventListener("click", () => {
            // Close More after the action, unless the action has already
            // opened a sheet of its own (Notebook, Go to page...).
            if (
              !action.keepSheetOpen &&
              sheetOpen?.sheet === body.parentElement
            ) {
              closeSheet();
            }
          });
          tiles.append(tile);
        }
        section.append(heading, tiles);
        body.append(section);
      }
    });
  }

  function openGoToPage() {
    openSheet("Go to page", body => {
      const form = el("form", "rui-form");
      const label = el("label", "rui-visually-hidden", { for: "ruiGoToInput" });
      label.textContent = `Page number, 1 to ${pagesCount()}`;
      const input = el("input", "rui-input", {
        id: "ruiGoToInput",
        type: "number",
        inputmode: "numeric",
        min: "1",
        max: String(pagesCount()),
        placeholder: `1 – ${pagesCount()}`,
      });
      input.value = String(currentPage());
      const go = el("button", "rui-primary", { type: "submit" });
      go.textContent = "Go";
      form.append(label, input, go);
      form.addEventListener("submit", event => {
        event.preventDefault();
        const page = parseInt(input.value, 10);
        if (page >= 1 && page <= pagesCount()) {
          suppressScrollUntil = performance.now() + 800;
          app().page = page;
          closeSheet();
        } else {
          input.select();
        }
      });
      body.append(form);
    });
  }

  // ---------------------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------------------

  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.actionLabel]
   * @param {function} [options.onAction]
   * @param {number} [options.timeout] - ms; 0 keeps it until dismissed
   */
  function toast(message, { actionLabel, onAction, timeout = 4000 } = {}) {
    const node = el("div", "rui-toast");
    const text = el("span");
    text.textContent = message;
    node.append(text);
    const dismiss = () => {
      node.classList.add("rui-leaving");
      setTimeout(() => node.remove(), 220);
    };
    if (actionLabel) {
      const button = el("button", "", { type: "button" });
      button.textContent = actionLabel;
      button.addEventListener("click", () => {
        onAction?.();
        dismiss();
      });
      node.append(button);
    }
    ui.toasts.append(node);
    if (timeout) {
      setTimeout(dismiss, timeout);
    }
    return dismiss;
  }

  // ---------------------------------------------------------------------
  // Selection bar
  // ---------------------------------------------------------------------

  const HIGHLIGHT_COLORS = [
    { name: "yellow", label: "Yellow" },
    { name: "blue", label: "Blue" },
    { name: "green", label: "Green" },
    { name: "pink", label: "Pink" },
  ];

  // The last selection made in the book. Tapping a button can collapse the
  // selection on some devices before the button's click runs, so actions
  // restore this range first.
  let lastRange = null;
  let lastRangeCollapsedAt = 0;

  function selectionRangeInBook() {
    if (!hasSelection()) {
      return null;
    }
    const range = window.getSelection().getRangeAt(0);
    const node = range.commonAncestorContainer;
    const element =
      node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return element?.closest("#viewer") ? range : null;
  }

  /** Puts back the last book selection if a tap has just cleared it. */
  function restoreSelection() {
    if (hasSelection()) {
      return true;
    }
    if (lastRange && performance.now() - lastRangeCollapsedAt < 1500) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(lastRange);
      return hasSelection();
    }
    return false;
  }

  function selectedText() {
    return window.getSelection().toString().replaceAll(/\s+/g, " ").trim();
  }

  function lastHighlightColor() {
    const stored = storageGet("ruiHighlightColor");
    return HIGHLIGHT_COLORS.some(c => c.name === stored) ? stored : "yellow";
  }

  function highlightSelection(color) {
    if (!restoreSelection()) {
      toast("Select some text first, then tap Highlight.");
      return;
    }
    storageSet("ruiHighlightColor", color);
    window.addBookMark?.(color);
    hideSelectionBar();
  }

  function buildSelectionBar() {
    ui.selbar = el("div", "rui-selbar", {
      role: "toolbar",
      "aria-label": "Selected text",
      hidden: "",
    });
    // Keep the selection when pressing the bar's buttons (mouse).
    ui.selbar.addEventListener("mousedown", event => event.preventDefault());
    const host = document.getElementById("outerContainer") || document.body;
    host.append(ui.selbar);
  }

  function renderSelectionBar() {
    const swatches = el("div", "rui-swatches");
    const current = lastHighlightColor();
    for (const color of HIGHLIGHT_COLORS) {
      const swatch = el("button", `rui-swatch rui-swatch-${color.name}`, {
        type: "button",
        "aria-label": `Highlight ${color.label.toLowerCase()}`,
        title: `Highlight ${color.label.toLowerCase()}`,
      });
      if (color.name === current) {
        swatch.setAttribute("aria-current", "true");
      }
      swatch.addEventListener("click", () => highlightSelection(color.name));
      swatches.append(swatch);
    }
    const separator = el("span", "rui-selbar-sep", { "aria-hidden": "true" });
    const buttons = actionsFor("selection").map(action => {
      const button = el("button", "rui-selbar-btn", { type: "button" });
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      button.innerHTML = icon(action.icon) + "<span></span>";
      button.querySelector("span").textContent = labelOf(action);
      button.addEventListener("click", event => {
        restoreSelection();
        action.run?.(event, button);
      });
      return button;
    });
    ui.selbar.replaceChildren(swatches, separator, ...buttons);
  }

  function positionSelectionBar(range) {
    const bar = ui.selbar;
    const rects = [...range.getClientRects()].filter(r => r.width > 0);
    if (!rects.length) {
      return;
    }
    const first = rects[0];
    const last = rects.at(-1);
    const box = range.getBoundingClientRect();
    const width = bar.offsetWidth;
    const height = bar.offsetHeight;
    const gap = 12;
    const margin = 8;
    // Phones show their own copy/share menu above a selection, so put ours
    // below it on touch screens and above it with a mouse.
    const touchFirst = matchMedia("(pointer: coarse)").matches;
    const below = last.bottom + gap;
    const above = first.top - height - gap;
    const fitsBelow = below + height <= window.innerHeight - margin;
    const fitsAbove = above >= margin;
    const order = touchFirst
      ? [fitsBelow && below, fitsAbove && above]
      : [fitsAbove && above, fitsBelow && below];
    const top = order.find(value => value !== false) ?? margin;
    const left = Math.min(
      Math.max(box.left + box.width / 2 - width / 2, margin),
      window.innerWidth - width - margin
    );
    bar.style.top = `${Math.round(top)}px`;
    bar.style.left = `${Math.round(left)}px`;
  }

  function showSelectionBar(range) {
    if (ui.selbar.hidden) {
      renderSelectionBar();
      ui.selbar.hidden = false;
    }
    positionSelectionBar(range);
  }

  function hideSelectionBar() {
    if (ui.selbar && !ui.selbar.hidden) {
      ui.selbar.hidden = true;
    }
  }

  function wireSelectionBar(container) {
    buildSelectionBar();
    let timer = null;
    document.addEventListener("selectionchange", () => {
      const range = selectionRangeInBook();
      if (range) {
        lastRange = range.cloneRange();
      } else if (lastRange && !hasSelection()) {
        lastRangeCollapsedAt = performance.now();
      }
      clearTimeout(timer);
      // Wait for the selection to settle (handles being dragged).
      timer = setTimeout(() => {
        const settled = selectionRangeInBook();
        if (settled && !sheetOpen) {
          showSelectionBar(settled);
        } else {
          hideSelectionBar();
        }
      }, 200);
    });
    container.addEventListener(
      "scroll",
      () => {
        const range = !ui.selbar.hidden && selectionRangeInBook();
        if (range) {
          positionSelectionBar(range);
        }
      },
      { passive: true }
    );
  }

  // ---------------------------------------------------------------------
  // Definition card
  // ---------------------------------------------------------------------

  function cleanWord(text) {
    return text.replaceAll(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  }

  function lookUp(word) {
    try {
      return window.parent.dictionary?.(word);
    } catch {
      return undefined; // dictionary not available (e.g. cross-origin)
    }
  }

  function pronounce(word) {
    if (window.audioMeta?.isSpeaking) {
      return; // don't interrupt the audio reader
    }
    if (window.parent !== window && window.parent.isNativeApp) {
      window.parent.postMessage(
        JSON.stringify({
          action: "speakTextNative",
          data: { text: word, rate: 0.9, lang: window.msg?.lang || "en-US" },
        }),
        "*"
      );
    } else if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(word);
      if (window.msg?.voice) {
        utterance.voice = window.msg.voice;
      }
      utterance.lang = window.msg?.lang || "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  function findInBook(word) {
    const findBar = app()?.findBar;
    if (!findBar) {
      return;
    }
    findBar.open();
    findBar.findField.value = word;
    findBar.dispatchEvent("");
  }

  function closeDefinition() {
    ui.defcard?.remove();
    ui.defcard = null;
  }

  /**
   * Shows the definition card for a word. `definition` is plain text from
   * the app's dictionary, or empty when the word isn't in it.
   */
  function showDefinition(word, definition) {
    closeDefinition();
    const card = el("section", "rui-defcard", { "aria-label": "Definition" });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    card.innerHTML =
      '<div class="rui-defcard-head">' +
      '<span class="rui-defword"></span>' +
      '<button type="button" class="rui-icon-btn" data-rui="speak" aria-label="Pronounce" title="Pronounce">' +
      icon("speak") +
      "</button>" +
      '<button type="button" class="rui-icon-btn" data-rui="close" aria-label="Close" title="Close">' +
      icon("close") +
      "</button>" +
      "</div>" +
      '<p class="rui-defbody"></p>' +
      '<div class="rui-defactions">' +
      '<button type="button" class="rui-chip" data-rui="save"></button>' +
      '<button type="button" class="rui-chip" data-rui="find">Find in book</button>' +
      '<a class="rui-chip" data-rui="web" target="_blank" rel="noopener">Search web</a>' +
      "</div>";
    card.querySelector(".rui-defword").textContent = word;
    const body = card.querySelector(".rui-defbody");
    if (definition) {
      body.textContent = String(definition);
    } else {
      body.textContent = "This word isn't in our dictionary yet.";
      body.classList.add("rui-muted");
    }
    card.querySelector('[data-rui="web"]').href =
      "https://www.google.com/search?q=" + encodeURIComponent(`define ${word}`);
    card
      .querySelector('[data-rui="speak"]')
      .addEventListener("click", () => pronounce(word));
    const save = card.querySelector('[data-rui="save"]');
    const showSaved = saved => {
      save.textContent = saved ? "Saved ✓" : "Save word";
      save.setAttribute("aria-pressed", String(saved));
    };
    showSaved(isWordSaved(word));
    save.addEventListener("click", () =>
      showSaved(toggleSavedWord(word, definition))
    );
    card
      .querySelector('[data-rui="close"]')
      .addEventListener("click", closeDefinition);
    card.querySelector('[data-rui="find"]').addEventListener("click", () => {
      closeDefinition();
      findInBook(word);
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeDefinition();
      }
    });
    const host = document.getElementById("outerContainer") || document.body;
    host.append(card);
    ui.defcard = card;
  }

  function defineSelection() {
    const word = cleanWord(selectedText());
    if (!word || /\s/.test(word)) {
      toast("Select a single word to see its meaning.");
      return;
    }
    hideSelectionBar();
    showDefinition(word, dottedWordMeaning(word) ?? lookUp(word));
  }

  /** The word helper's meaning for a word it dots in this book, if any. */
  function dottedWordMeaning(word) {
    const data = wordHelper.data;
    if (!data) {
      return undefined;
    }
    const wanted = word.toLowerCase();
    const pages = [String(currentPage()), ...Object.keys(data.pages)];
    for (const page of pages) {
      const entry = data.pages[page]?.find(e => e[1].toLowerCase() === wanted);
      if (entry) {
        return data.defs?.[entry[0]];
      }
    }
    return undefined;
  }

  async function copySelection() {
    const text = selectedText();
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.");
    } catch {
      toast("Couldn't copy the text.");
    }
    hideSelectionBar();
  }

  // ---------------------------------------------------------------------
  // Listen player
  // ---------------------------------------------------------------------
  //
  // A front end for the read-aloud engine in viewer-flexi.js
  // (selectRangeForReading, prev/nextParagraph, speedIncrease/Decrease,
  // openPageForReading). It follows the engine through the
  // "baws:speakingchange" and "baws:readingprogress" events.

  const SLEEP_OPTIONS = [
    { value: "off", label: "Off" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "chapter", label: "End of chapter" },
  ];

  const player = {
    session: false, // the reader has used the player since opening the book
    progress: { page: 0, index: 0, total: 0 },
    sheet: null, // element refs while the player sheet is open
    mini: null,
    sleepMode: "off",
    sleepTimer: null,
    sleepChapterEnd: 0,
  };

  function isSpeaking() {
    return !!window.audioMeta?.isSpeaking;
  }

  function stopListening() {
    if (isSpeaking()) {
      window.selectRangeForReading?.(); // toggles reading off
    }
  }

  function togglePlay() {
    player.session = true;
    // Starts reading the current page, resumes the current sentence if
    // reading was paused on this page, or pauses.
    window.selectRangeForReading?.();
  }

  function playerPage(direction) {
    if (isSpeaking()) {
      // Turns the page and carries on reading there.
      window.openPageForReading?.(direction === "next" ? "NEXT" : "PREV");
    } else {
      navigate(direction);
    }
  }

  function playerSentence(direction) {
    player.session = true;
    if (direction === "next") {
      window.nextParagraph?.();
    } else {
      window.prevParagraph?.();
    }
  }

  function changeSpeed(direction) {
    if (direction > 0) {
      window.speedIncrease?.();
    } else {
      window.speedDecrease?.();
    }
    updatePlayer();
  }

  function formatRate() {
    const rate = window.audioMeta?.rate || 1;
    return `${Number(rate.toFixed(2))}×`;
  }

  function setSleep(mode) {
    clearTimeout(player.sleepTimer);
    player.sleepTimer = null;
    player.sleepMode = mode;
    player.sleepChapterEnd = 0;
    if (mode === "chapter") {
      player.sleepChapterEnd = outlinePath(currentPage()).at(-1)?.end || 0;
    } else if (mode !== "off") {
      player.sleepTimer = setTimeout(
        () => {
          player.sleepMode = "off";
          if (isSpeaking()) {
            stopListening();
            toast("Sleep timer: stopped reading.");
          }
          updatePlayer();
        },
        Number(mode) * 60 * 1000
      );
    }
    updatePlayer();
  }

  function playerStatus() {
    const { page, index, total } = player.progress;
    const speaking = isSpeaking();
    // When paused, Play resumes the sentence only on the same page; on
    // another page it starts that page from the top.
    if (total > 0 && page && (speaking || page === currentPage())) {
      const where = `Sentence ${Math.min(index + 1, total)} of ${total}`;
      return speaking
        ? {
            title: `Reading page ${page}`,
            detail: `${where} · turns pages automatically`,
          }
        : { title: `Paused on page ${page}`, detail: where };
    }
    return {
      title: `Listen to page ${currentPage()}`,
      detail: "Reads aloud from the top of the page.",
    };
  }

  function voiceSource() {
    return document.getElementById("selectVoices");
  }

  function openPlayerSheet() {
    openSheet("Listen", body => {
      body.classList.add("rui-player");
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      body.innerHTML =
        '<div class="rui-player-status"><span class="rui-player-title"></span>' +
        '<span class="rui-player-detail"></span></div>' +
        '<div class="rui-player-progress" aria-hidden="true"></div>' +
        '<div class="rui-player-transport">' +
        `<button type="button" class="rui-icon-btn" data-rui="prevPage" aria-label="Previous page" title="Previous page">${icon(
          "prevPage"
        )}</button>` +
        `<button type="button" class="rui-icon-btn rui-big" data-rui="prevSentence" aria-label="Previous sentence" title="Previous sentence">${icon(
          "prevSentence"
        )}</button>` +
        '<button type="button" class="rui-play" data-rui="play"></button>' +
        `<button type="button" class="rui-icon-btn rui-big" data-rui="nextSentence" aria-label="Next sentence" title="Next sentence">${icon(
          "nextSentence"
        )}</button>` +
        `<button type="button" class="rui-icon-btn" data-rui="nextPage" aria-label="Next page" title="Next page">${icon(
          "nextPage"
        )}</button>` +
        "</div>" +
        '<div class="rui-player-options">' +
        '<div class="rui-option"><span class="rui-option-label" id="ruiSpeedLabel">Speed</span>' +
        '<div class="rui-stepper" role="group" aria-labelledby="ruiSpeedLabel">' +
        '<button type="button" data-rui="slower" aria-label="Slower">−</button>' +
        '<span data-rui="rate" aria-live="polite"></span>' +
        '<button type="button" data-rui="faster" aria-label="Faster">+</button>' +
        "</div></div>" +
        '<label class="rui-option"><span class="rui-option-label">Voice</span>' +
        '<select class="rui-select" data-rui="voice"></select></label>' +
        '<label class="rui-option"><span class="rui-option-label">Sleep timer</span>' +
        '<select class="rui-select" data-rui="sleep"></select></label>' +
        "</div>";
      const q = name => body.querySelector(`[data-rui="${name}"]`);
      q("prevPage").addEventListener("click", () => playerPage("prev"));
      q("nextPage").addEventListener("click", () => playerPage("next"));
      q("prevSentence").addEventListener("click", () => playerSentence("prev"));
      q("nextSentence").addEventListener("click", () => playerSentence("next"));
      q("play").addEventListener("click", togglePlay);
      q("slower").addEventListener("click", () => changeSpeed(-1));
      q("faster").addEventListener("click", () => changeSpeed(1));

      const sleep = q("sleep");
      for (const option of SLEEP_OPTIONS) {
        const node = el("option", "", { value: option.value });
        node.textContent = option.label;
        sleep.append(node);
      }
      sleep.addEventListener("change", () => setSleep(sleep.value));

      const voice = q("voice");
      voice.addEventListener("change", () => {
        // The engine's own (hidden) voice list stores the choice.
        const source = voiceSource();
        if (!source) {
          return;
        }
        source.value = voice.value;
        source.dispatchEvent(new Event("change"));
        if (isSpeaking()) {
          window.restartCurrentSentence?.();
        }
      });

      player.sheet = {
        root: body,
        title: body.querySelector(".rui-player-title"),
        detail: body.querySelector(".rui-player-detail"),
        progress: body.querySelector(".rui-player-progress"),
        play: q("play"),
        rate: q("rate"),
        voice,
        sleep,
      };
      renderVoiceOptions();
      updatePlayer();
    });
  }

  function renderVoiceOptions() {
    const select = player.sheet?.voice;
    if (!select) {
      return;
    }
    const source = voiceSource();
    select.replaceChildren();
    if (!source || !source.options.length) {
      const none = el("option", "", { value: "" });
      none.textContent = "Default voice";
      select.append(none);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    for (const option of source.options) {
      const copy = el("option", "", { value: option.value });
      copy.textContent = option.textContent;
      select.append(copy);
    }
    select.value = source.value;
  }

  function renderProgress(container) {
    const { index, total } = player.progress;
    container.replaceChildren();
    if (!total) {
      return;
    }
    if (total <= 30) {
      container.style.setProperty("--rui-segments", total);
      for (let i = 0; i < total; i++) {
        const segment = el("span", "rui-segment");
        if (i < index) {
          segment.classList.add("rui-done");
        } else if (i === index) {
          segment.classList.add("rui-current");
        }
        container.append(segment);
      }
    } else {
      container.style.setProperty("--rui-segments", 1);
      const bar = el("span", "rui-segment rui-bar");
      bar.style.setProperty("--rui-fill", `${((index + 1) / total) * 100}%`);
      container.append(bar);
    }
  }

  function setPlayButton(button) {
    const speaking = isSpeaking();
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    button.innerHTML = icon(speaking ? "pause" : "play");
    button.setAttribute("aria-label", speaking ? "Pause" : "Play");
    button.title = speaking ? "Pause" : "Play";
  }

  function updatePlayer() {
    const status = playerStatus();
    const sheet = player.sheet;
    if (sheet) {
      sheet.title.textContent = status.title;
      sheet.detail.textContent = status.detail;
      renderProgress(sheet.progress);
      setPlayButton(sheet.play);
      sheet.rate.textContent = formatRate();
      sheet.sleep.value = player.sleepMode;
    }
    updateMiniPlayer(status);
  }

  function buildMiniPlayer() {
    const mini = el("div", "rui-mini", {
      role: "region",
      "aria-label": "Audio reader",
      hidden: "",
    });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    mini.innerHTML =
      '<button type="button" class="rui-play rui-play-small" data-rui="play"></button>' +
      '<button type="button" class="rui-mini-text" data-rui="open" aria-label="Open the audio player">' +
      '<span class="rui-mini-title"></span><span class="rui-mini-detail"></span></button>' +
      `<button type="button" class="rui-icon-btn" data-rui="open2" aria-label="Open the audio player" title="Open">${icon(
        "expand"
      )}</button>` +
      `<button type="button" class="rui-icon-btn" data-rui="close" aria-label="Stop and close" title="Stop">${icon(
        "close"
      )}</button>`;
    mini
      .querySelector('[data-rui="play"]')
      .addEventListener("click", togglePlay);
    mini
      .querySelector('[data-rui="open"]')
      .addEventListener("click", openPlayerSheet);
    mini
      .querySelector('[data-rui="open2"]')
      .addEventListener("click", openPlayerSheet);
    mini.querySelector('[data-rui="close"]').addEventListener("click", () => {
      stopListening();
      player.session = false;
      setSleep("off");
      updatePlayer();
    });
    const host = document.getElementById("outerContainer") || document.body;
    host.append(mini);
    player.mini = mini;
  }

  function updateMiniPlayer(status) {
    const mini = player.mini;
    if (!mini) {
      return;
    }
    const show =
      player.session &&
      !sheetOpen &&
      (isSpeaking() || player.progress.total > 0);
    mini.hidden = !show;
    if (!show) {
      return;
    }
    mini.querySelector(".rui-mini-title").textContent = status.title;
    mini.querySelector(".rui-mini-detail").textContent =
      status.detail.split(" · ")[0];
    setPlayButton(mini.querySelector('[data-rui="play"]'));
  }

  function wirePlayer() {
    buildMiniPlayer();
    document.addEventListener("baws:speakingchange", () => {
      if (isSpeaking()) {
        player.session = true;
      }
      updatePlayer();
    });
    document.addEventListener("baws:readingprogress", event => {
      const { page, index, total } = event.detail;
      player.progress = { page, index, total };
      // Sleep timer "End of chapter": stop once reading reaches a page
      // past the chapter it was set in.
      if (
        player.sleepMode === "chapter" &&
        player.sleepChapterEnd &&
        page > player.sleepChapterEnd
      ) {
        player.sleepMode = "off";
        stopListening();
        toast("Sleep timer: stopped at the end of the chapter.");
      }
      updatePlayer();
    });
    document.addEventListener("baws:voiceschange", renderVoiceOptions);
  }

  // ---------------------------------------------------------------------
  // Display settings
  // ---------------------------------------------------------------------

  // `doq` names a tone in addon/colors.json; the page images are recoloured
  // by addon/doq.js (DOQReader.setTheme).
  const THEMES = [
    { id: "light", label: "Light", doq: null },
    { id: "sepia", label: "Sepia", doq: ["Safari", "Sepia"] },
    { id: "night", label: "Night", doq: ["Firefox", "Dark"] },
    { id: "system", label: "System" },
  ];
  const TEXT_SCALE = { min: 0.8, max: 1.8, step: 0.1 };
  const darkScheme = matchMedia("(prefers-color-scheme: dark)");
  let appliedPageTheme = null;
  let keepAwakeLock = null;

  function storedTheme() {
    const theme = storageGet("readerTheme");
    return THEMES.some(t => t.id === theme) ? theme : "system";
  }

  function resolvedTheme() {
    const theme = storedTheme();
    if (theme !== "system") {
      return theme;
    }
    return darkScheme.matches ? "night" : "light";
  }

  function applyTheme() {
    const theme = resolvedTheme();
    document.documentElement.setAttribute("data-rui-theme", theme);
    applyPageTheme(theme);
  }

  function applyPageTheme(theme) {
    const doq = window.DOQReader;
    if (!doq?.setTheme || appliedPageTheme === theme) {
      return; // doq not loaded yet: "doq:ready" applies it
    }
    appliedPageTheme = theme;
    const [scheme, tone] = THEMES.find(t => t.id === theme)?.doq || [
      "Firefox",
      null,
    ];
    try {
      doq.setTheme(scheme, tone);
    } catch (ex) {
      console.warn("Reader UI: could not recolour the pages:", ex);
    }
  }

  function setTheme(id) {
    storageSet("readerTheme", id);
    applyTheme();
  }

  function textScale() {
    const value = parseFloat(storageGet("readerTextScale"));
    return value >= TEXT_SCALE.min && value <= TEXT_SCALE.max ? value : 1;
  }

  function setTextScale(value) {
    const clamped = Math.min(TEXT_SCALE.max, Math.max(TEXT_SCALE.min, value));
    const rounded = Math.round(clamped * 10) / 10;
    storageSet("readerTextScale", String(rounded));
    document.documentElement.style.setProperty("--rui-text-scale", rounded);
    return rounded;
  }

  async function acquireKeepAwake() {
    if (
      keepAwakeLock ||
      !navigator.wakeLock ||
      document.visibilityState !== "visible"
    ) {
      return;
    }
    try {
      keepAwakeLock = await navigator.wakeLock.request("screen");
      keepAwakeLock.addEventListener("release", () => {
        keepAwakeLock = null;
      });
    } catch {
      keepAwakeLock = null; // e.g. not allowed in this frame
    }
  }

  function setKeepAwake(on) {
    storageSet("readerKeepAwake", on ? "1" : "0");
    if (on) {
      acquireKeepAwake();
    } else {
      keepAwakeLock?.release();
      keepAwakeLock = null;
    }
  }

  function wireDisplaySettings() {
    applyTheme();
    setTextScale(textScale());
    document.addEventListener("doq:ready", () => {
      appliedPageTheme = null;
      applyPageTheme(resolvedTheme());
    });
    darkScheme.addEventListener("change", () => {
      if (storedTheme() === "system") {
        applyTheme();
      }
    });
    // The screen lock is dropped whenever the page is hidden; take it back.
    document.addEventListener("visibilitychange", () => {
      if (storageGet("readerKeepAwake") === "1") {
        acquireKeepAwake();
      }
    });
    if (storageGet("readerKeepAwake") === "1") {
      acquireKeepAwake();
    }
  }

  function makeSwitch(label, checked, onChange) {
    const row = el("div", "rui-toggle-row");
    const text = el("span");
    text.textContent = label;
    const button = el("button", "rui-switch", {
      type: "button",
      role: "switch",
      "aria-checked": String(checked),
      "aria-label": label,
    });
    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", String(next));
      onChange(next);
    });
    row.append(text, button);
    return row;
  }

  function sectionTitle(text) {
    const title = el("span", "rui-group-title");
    title.textContent = text;
    return title;
  }

  function openDisplaySheet() {
    openSheet("Display", body => {
      body.classList.add("rui-display");

      // Theme
      const themeGroup = el("div", "rui-group");
      const themes = el("fieldset", "rui-themes", { role: "radiogroup" });
      const legend = el("legend", "rui-visually-hidden");
      legend.textContent = "Theme";
      themes.append(legend);
      const current = storedTheme();
      for (const theme of THEMES) {
        const option = el("label", "rui-theme");
        const input = el("input", "", {
          type: "radio",
          name: "ruiTheme",
          value: theme.id,
        });
        input.checked = theme.id === current;
        input.addEventListener("change", () => setTheme(theme.id));
        const swatch = el("span", `rui-theme-swatch rui-theme-${theme.id}`, {
          "aria-hidden": "true",
        });
        if (theme.id === "system") {
          const auto = el("span");
          auto.textContent = "Auto";
          swatch.append(auto);
        } else {
          swatch.textContent = "Aa";
        }
        const name = el("span", "rui-theme-name");
        name.textContent = theme.label;
        option.append(input, swatch, name);
        themes.append(option);
      }
      themeGroup.append(sectionTitle("Theme"), themes);

      // Layout
      const layoutGroup = el("div", "rui-group");
      const layout = el("div", "rui-segmented", {
        role: "group",
        "aria-label": "Page layout",
      });
      const modes = [
        { mode: "pdf", label: "Original page", icon: "page" },
        { mode: "text", label: "Fit to phone", icon: "phone" },
      ];
      const sizeGroup = el("div", "rui-group");
      const modeButtons = modes.map(({ mode, label, icon: iconName }) => {
        const button = el("button", "", { type: "button" });
        // Static markup (icons and fixed labels only).
        // eslint-disable-next-line no-unsanitized/property
        button.innerHTML = icon(iconName) + "<span></span>";
        button.querySelector("span").textContent = label;
        button.addEventListener("click", () => {
          if (window.VIEW_MODE !== mode) {
            window.switchMode?.(mode);
          }
          syncModes();
        });
        layout.append(button);
        return { mode, button };
      });
      const syncModes = () => {
        for (const { mode, button } of modeButtons) {
          button.setAttribute(
            "aria-pressed",
            String(window.VIEW_MODE === mode)
          );
        }
        sizeGroup.hidden = window.VIEW_MODE !== "text";
      };
      layoutGroup.append(sectionTitle("Layout"), layout);

      // Text size (the "Fit to phone" text; the original page uses zoom)
      const head = el("div", "rui-row-head");
      const value = el("span", "rui-row-value");
      head.append(sectionTitle("Text size"), value);
      const size = el("div", "rui-size");
      const smaller = el("button", "rui-size-btn", {
        type: "button",
        "aria-label": "Smaller text",
        style: "font-size:14px",
      });
      smaller.textContent = "A";
      const larger = el("button", "rui-size-btn", {
        type: "button",
        "aria-label": "Larger text",
        style: "font-size:22px",
      });
      larger.textContent = "A";
      const range = el("input", "rui-size-range", {
        type: "range",
        min: String(TEXT_SCALE.min),
        max: String(TEXT_SCALE.max),
        step: String(TEXT_SCALE.step),
        "aria-label": "Text size",
      });
      const showSize = scale => {
        range.value = String(scale);
        value.textContent = `${Math.round(scale * 100)}%`;
        const ratio =
          (scale - TEXT_SCALE.min) / (TEXT_SCALE.max - TEXT_SCALE.min);
        range.style.setProperty("--rui-progress", `${ratio * 100}%`);
      };
      range.addEventListener("input", () =>
        showSize(setTextScale(parseFloat(range.value)))
      );
      smaller.addEventListener("click", () =>
        showSize(setTextScale(textScale() - TEXT_SCALE.step))
      );
      larger.addEventListener("click", () =>
        showSize(setTextScale(textScale() + TEXT_SCALE.step))
      );
      size.append(smaller, range, larger);
      sizeGroup.append(head, size);
      showSize(textScale());

      // Switches
      const toggles = el("div", "rui-toggles");
      toggles.append(
        makeSwitch(
          "Turn pages by swiping",
          storageGet("readerSwipe") !== "0",
          on => storageSet("readerSwipe", on ? "1" : "0")
        )
      );
      if (navigator.wakeLock) {
        toggles.append(
          makeSwitch(
            "Keep screen awake",
            storageGet("readerKeepAwake") === "1",
            setKeepAwake
          )
        );
      }
      if (wordHelper.url) {
        toggles.append(
          makeSwitch("Underline harder words", wordHelperOn(), setWordHelper)
        );
      }

      body.append(themeGroup, layoutGroup, sizeGroup, toggles);
      syncModes();
    });
  }

  // ---------------------------------------------------------------------
  // Word helper: dotted underline under harder words, tap for the meaning
  // ---------------------------------------------------------------------

  // The app passes "words=<url>" (same origin) for books that have word
  // data: {v: 1, pages: {"<page>": [[key, word, x, y, w, h, ...]]},
  // defs: {key: meaning}}. Boxes are in 1/10000 of the page from its top
  // left; a word broken over two lines has two boxes. The data is made
  // ahead of time (baws-search scripts/book-words.mjs), so nothing is
  // looked up while reading. Whether it's on is a per-device setting.
  const wordHelper = {
    url: wordsUrl(),
    data: null,
    loading: null,
  };

  function wordsUrl() {
    try {
      const value = new URLSearchParams(location.search).get("words");
      const url = value && new URL(value, location.href);
      return url?.origin === location.origin ? url.href : null;
    } catch {
      return null;
    }
  }

  function wordHelperOn() {
    return !!wordHelper.url && storageGet("readerWordHelper") === "1";
  }

  function loadWords() {
    wordHelper.loading ||= fetch(wordHelper.url)
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        wordHelper.data = data?.v === 1 && data.pages ? data : null;
        return wordHelper.data;
      })
      .catch(() => null);
    return wordHelper.loading;
  }

  function wordsOnPage(pageNumber) {
    return wordHelper.data?.pages[pageNumber] || [];
  }

  /** Dots under the words of one page (original page or "Fit to phone"). */
  function decorateWordPage(pageNumber) {
    const div = app()?.pdfViewer?.getPageView(pageNumber - 1)?.div;
    if (!div || !wordHelperOn() || !wordHelper.data) {
      return;
    }
    if (window.VIEW_MODE === "text") {
      decorateTextView(div, wordsOnPage(pageNumber));
      return;
    }
    div.querySelector(":scope > .rui-words")?.remove();
    const entries = wordsOnPage(pageNumber);
    if (!entries.length) {
      return;
    }
    const layer = el("div", "rui-words", { "aria-hidden": "true" });
    for (const [key, word, ...boxes] of entries) {
      for (let i = 0; i + 3 < boxes.length; i += 4) {
        const dot = el("span", "rui-word-dot");
        dot.dataset.k = key;
        dot.dataset.w = word;
        dot.style.left = `${boxes[i] / 100}%`;
        dot.style.top = `${boxes[i + 1] / 100}%`;
        dot.style.width = `${boxes[i + 2] / 100}%`;
        dot.style.height = `${boxes[i + 3] / 100}%`;
        layer.append(dot);
      }
    }
    // Under the text layer, so selecting text works as before.
    const canvas = div.querySelector(":scope > .canvasWrapper");
    if (canvas) {
      canvas.after(layer);
    } else {
      div.prepend(layer);
    }
  }

  /** "Fit to phone": wrap the page's words in the reflowed text. */
  function decorateTextView(div, entries) {
    const view = div.querySelector(".textView:not(.textViewUnavailable)");
    if (!view || view.querySelector(".rui-word") || !entries.length) {
      return;
    }
    const keyOf = new Map(entries.map(([key, word]) => [word, key]));
    const escape = word => word.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?<![A-Za-z])(?:${[...keyOf.keys()]
        .sort((a, b) => b.length - a.length)
        .map(escape)
        .join("|")})(?![A-Za-z])`,
      "g"
    );
    const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement.closest("a, code, .rui-word")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    // One underline per word per page, like the original page.
    const done = new Set();
    for (const node of textNodes) {
      const text = node.data;
      const parts = [];
      let last = 0;
      for (const match of text.matchAll(pattern)) {
        const key = keyOf.get(match[0]);
        if (done.has(key)) {
          continue;
        }
        done.add(key);
        parts.push(text.slice(last, match.index));
        const word = el("span", "rui-word");
        word.dataset.k = key;
        word.dataset.w = match[0];
        word.textContent = match[0];
        parts.push(word);
        last = match.index + match[0].length;
      }
      if (parts.length) {
        parts.push(text.slice(last));
        node.replaceWith(...parts.filter(part => part !== ""));
      }
    }
  }

  function decorateAllWordPages() {
    const viewer = app()?.pdfViewer;
    for (let i = 0; i < (viewer?.pagesCount || 0); i++) {
      if (
        viewer.getPageView(i)?.div?.querySelector(".canvasWrapper, .textView")
      ) {
        decorateWordPage(i + 1);
      }
    }
  }

  function removeWordDecorations() {
    for (const layer of document.querySelectorAll(".rui-words")) {
      layer.remove();
    }
    for (const word of document.querySelectorAll(".rui-word")) {
      const parent = word.parentNode;
      word.replaceWith(word.textContent);
      parent.normalize();
    }
  }

  async function setWordHelper(on) {
    storageSet("readerWordHelper", on ? "1" : "0");
    if (!on) {
      removeWordDecorations();
      return;
    }
    if (!(await loadWords())) {
      toast("Word help isn't available for this book yet.");
      return;
    }
    decorateAllWordPages();
    toast("Tap an underlined word to see its meaning.");
  }

  /** The dotted word at a screen point, if any: {word, key}. */
  function wordAt(x, y) {
    if (!wordHelperOn() || !wordHelper.data) {
      return null;
    }
    const target = document.elementFromPoint(x, y)?.closest?.(".rui-word");
    if (target) {
      return { word: target.dataset.w, key: target.dataset.k };
    }
    // Original page: the dots sit under the text layer, so test their boxes
    // (a little taller than the text, for fingers).
    for (const dot of document.querySelectorAll(".rui-word-dot")) {
      const box = dot.getBoundingClientRect();
      const slack = Math.max(4, box.height * 0.3);
      if (
        x >= box.left - 2 &&
        x <= box.right + 2 &&
        y >= box.top - slack &&
        y <= box.bottom + slack
      ) {
        return { word: dot.dataset.w, key: dot.dataset.k };
      }
    }
    return null;
  }

  /** Shows the meaning of a dotted word at (x, y); false if there's none. */
  function defineWordAt(x, y) {
    const hit = wordAt(x, y);
    if (!hit) {
      return false;
    }
    const word = /^[A-Z]+$/.test(hit.word) ? hit.word.toLowerCase() : hit.word;
    showDefinition(word, wordHelper.data.defs?.[hit.key]);
    return true;
  }

  function wireWordHelper() {
    if (!wordHelper.url) {
      return;
    }
    const bus = app().eventBus;
    bus._on("pagerendered", e => {
      if (wordHelperOn()) {
        decorateWordPage(e.pageNumber);
      }
    });
    if (wordHelperOn()) {
      loadWords().then(decorateAllWordPages);
    }
  }

  // ---------------------------------------------------------------------
  // Notebook: Contents, Highlights, Notes (BAWS.in Team), Words
  // ---------------------------------------------------------------------

  const NOTE_KINDS = {
    note: "Note",
    context: "Context",
    correction: "Correction",
    disputed: "Disputed",
  };
  const HIGHLIGHT_LABELS = {
    yellow: "Yellow",
    blue: "Blue",
    green: "Green",
    pink: "Pink",
  };

  const notebook = {
    tab: "contents",
    notes: [], // BAWS.in Team notes for this book (loadAnnotations)
    noteScope: "page",
    highlightColor: "all",
    contentsFilter: "",
    toastedPages: new Set(),
  };

  /** "/books/<parent>/<language>/<book>/pdf/" for the open book, or null. */
  function bookPath() {
    const data = window.getBookUrlData?.();
    return data
      ? `/books/${data.bookParent}/${data.language}/${data.bookName}/pdf/`
      : null;
  }

  function inThisBook(item) {
    const path = bookPath();
    return !!path && typeof item?.url === "string" && item.url.includes(path);
  }

  function bookHighlights() {
    // `storedHighlights` is a top-level `let` in viewer-flexi.js.
    // eslint-disable-next-line no-undef
    const all = typeof storedHighlights !== "undefined" ? storedHighlights : [];
    return all
      .filter(inThisBook)
      .sort(
        (a, b) =>
          a.pageNo - b.pageNo ||
          (a.rects?.[0]?.topPercent ?? 0) - (b.rects?.[0]?.topPercent ?? 0)
      );
  }

  function highlightColor(highlight) {
    return HIGHLIGHT_COLORS.some(c => c.name === highlight.color)
      ? highlight.color
      : "yellow";
  }

  function notesOnPage(page) {
    return notebook.notes.filter(note => note.pageNo === page);
  }

  /** Plain text with paragraphs; http(s) links become links, nothing else. */
  function renderPlainText(container, text) {
    const paragraphs = String(text || "").split(/\n{2,}/);
    for (const paragraph of paragraphs) {
      const p = el("p");
      const parts = paragraph.split(/(https?:\/\/[^\s<>"']+)/g);
      parts.forEach((part, i) => {
        if (i % 2 === 1) {
          const link = el("a", "", {
            href: part,
            target: "_blank",
            rel: "noopener noreferrer",
          });
          link.textContent = part.replace(/^https?:\/\//, "");
          p.append(link);
        } else if (part) {
          // Keep single line breaks inside a paragraph.
          part.split("\n").forEach((line, j) => {
            if (j) {
              p.append(el("br"));
            }
            p.append(line);
          });
        }
      });
      container.append(p);
    }
  }

  function goToPage(page) {
    if (page >= 1 && page <= pagesCount()) {
      suppressScrollUntil = performance.now() + 800;
      app().page = page;
    }
  }

  // --- Saved words (on this device) ---

  function savedWords() {
    try {
      return JSON.parse(storageGet("ruiSavedWords")) || {};
    } catch {
      return {};
    }
  }

  function isWordSaved(word) {
    return !!savedWords()[word.toLowerCase()];
  }

  function toggleSavedWord(word, definition) {
    const words = savedWords();
    const key = word.toLowerCase();
    if (words[key]) {
      delete words[key];
    } else {
      const data = window.getBookUrlData?.();
      words[key] = {
        word,
        definition: definition || "",
        savedAt: Date.now(),
        book: data?.bookName || "",
        page: currentPage(),
      };
    }
    storageSet("ruiSavedWords", JSON.stringify(words));
    return !!words[key];
  }

  // --- The sheet ---

  const NOTEBOOK_TABS = [
    { id: "contents", label: "Contents" },
    { id: "highlights", label: "Highlights" },
    { id: "notes", label: "Notes" },
    { id: "words", label: "Words" },
  ];

  function openNotebook(tab = notebook.tab) {
    notebook.tab = tab;
    openSheet("Notebook", body => {
      body.classList.add("rui-notebook");
      const tabs = el("div", "rui-tabs", {
        role: "tablist",
        "aria-label": "Notebook",
      });
      const panel = el("div", "rui-tabpanel", { role: "tabpanel" });
      const buttons = NOTEBOOK_TABS.map(({ id, label }) => {
        const button = el("button", "rui-tab", { type: "button", role: "tab" });
        button.textContent = label;
        const count = tabCount(id);
        if (count) {
          const badge = el("span", "rui-tab-count");
          badge.textContent = String(count);
          button.append(badge);
        }
        button.addEventListener("click", () => {
          notebook.tab = id;
          select();
        });
        tabs.append(button);
        return { id, button };
      });
      const select = () => {
        for (const { id, button } of buttons) {
          button.setAttribute("aria-selected", String(id === notebook.tab));
        }
        panel.replaceChildren();
        RENDER_TAB[notebook.tab](panel);
      };
      body.append(tabs, panel);
      select();
    });
  }

  function tabCount(id) {
    if (id === "highlights") {
      return bookHighlights().length;
    }
    if (id === "notes") {
      return notebook.notes.length;
    }
    if (id === "words") {
      return Object.keys(savedWords()).length;
    }
    return 0;
  }

  function emptyState(panel, text) {
    const p = el("p", "rui-empty");
    p.textContent = text;
    panel.append(p);
  }

  function chipRow(options, current, onPick) {
    const row = el("div", "rui-chips", { role: "group" });
    for (const option of options) {
      const chip = el("button", "rui-chip-toggle", {
        type: "button",
        "aria-pressed": String(option.id === current),
      });
      if (option.swatch) {
        chip.append(
          el("span", `rui-dot rui-swatch-${option.swatch}`, {
            "aria-hidden": "true",
          })
        );
      }
      chip.append(option.label);
      chip.addEventListener("click", () => onPick(option.id));
      row.append(chip);
    }
    return row;
  }

  // --- Contents ---

  function renderContents(panel) {
    const tree = outline();
    if (!tree) {
      emptyState(panel, "This book has no table of contents.");
      return;
    }
    const label = el("label", "rui-visually-hidden", { for: "ruiTocFilter" });
    label.textContent = "Filter chapters";
    const filter = el("input", "rui-input rui-filter", {
      id: "ruiTocFilter",
      type: "search",
      placeholder: "Filter chapters",
      autocomplete: "off",
    });
    filter.value = notebook.contentsFilter;
    const list = el("div", "rui-toc");
    const current = new Set(outlinePath(currentPage()));
    const draw = () => {
      list.replaceChildren();
      const query = notebook.contentsFilter.trim().toLowerCase();
      if (query) {
        const matches = [];
        const walk = nodes => {
          for (const node of nodes || []) {
            if (node.title?.toLowerCase().includes(query)) {
              matches.push(node);
            }
            walk(node.items);
          }
        };
        walk(tree.items);
        if (!matches.length) {
          emptyState(list, "No chapter matches.");
        }
        for (const node of matches) {
          list.append(tocRow(node, 0, current, false));
        }
        return;
      }
      const add = (nodes, depth, parent) => {
        for (const node of nodes || []) {
          const hasChildren = !!node.items?.length;
          const row = tocRow(node, depth, current, hasChildren);
          parent.append(row);
          if (hasChildren) {
            const children = el("div", "rui-toc-children");
            children.hidden = !current.has(node);
            add(node.items, depth + 1, children);
            parent.append(children);
            const toggle = row.querySelector(".rui-toc-toggle");
            toggle.setAttribute("aria-expanded", String(!children.hidden));
            toggle.addEventListener("click", () => {
              children.hidden = !children.hidden;
              toggle.setAttribute("aria-expanded", String(!children.hidden));
            });
          }
        }
      };
      add(tree.items, 0, list);
    };
    filter.addEventListener("input", () => {
      notebook.contentsFilter = filter.value;
      draw();
    });
    panel.append(label, filter, list);
    draw();
    requestAnimationFrame(() =>
      list
        .querySelector('[aria-current="true"]')
        ?.scrollIntoView({ block: "center" })
    );
  }

  function tocRow(node, depth, current, hasChildren) {
    const row = el("div", "rui-toc-row");
    row.style.setProperty("--rui-depth", depth);
    if (hasChildren) {
      const toggle = el("button", "rui-toc-toggle", {
        type: "button",
        "aria-label": `Show sections of ${node.title}`,
      });
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      toggle.innerHTML = icon("chevronRight");
      row.append(toggle);
    } else {
      row.append(el("span", "rui-toc-spacer", { "aria-hidden": "true" }));
    }
    const link = el("button", "rui-toc-link", { type: "button" });
    const title = el("span", "rui-toc-title");
    title.textContent = String(node.title || "")
      .replaceAll(/\s+/g, " ")
      .trim();
    const page = el("span", "rui-toc-page");
    page.textContent = node.dest >= 1 ? String(node.dest) : "";
    link.append(title, page);
    // The deepest section containing the current page is "current".
    const path = [...current];
    if (path.at(-1) === node) {
      link.setAttribute("aria-current", "true");
    }
    link.addEventListener("click", () => {
      goToPage(node.dest);
      closeSheet();
    });
    row.append(link);
    return row;
  }

  // --- Highlights ---

  function renderHighlights(panel) {
    const all = bookHighlights();
    if (!all.length) {
      emptyState(
        panel,
        "No highlights in this book yet. Select text and pick a colour to highlight it."
      );
      return;
    }
    const options = [{ id: "all", label: `All ${all.length}` }].concat(
      HIGHLIGHT_COLORS.filter(c =>
        all.some(h => highlightColor(h) === c.name)
      ).map(c => ({
        id: c.name,
        label: HIGHLIGHT_LABELS[c.name],
        swatch: c.name,
      }))
    );
    if (!options.some(o => o.id === notebook.highlightColor)) {
      notebook.highlightColor = "all";
    }
    const list = el("div", "rui-cards");
    const draw = () => {
      list.replaceChildren();
      const shown = all.filter(
        h =>
          notebook.highlightColor === "all" ||
          highlightColor(h) === notebook.highlightColor
      );
      for (const highlight of shown) {
        list.append(highlightCard(highlight, panel));
      }
    };
    panel.append(
      chipRow(options, notebook.highlightColor, id => {
        notebook.highlightColor = id;
        panel.replaceChildren();
        renderHighlights(panel);
      }),
      list
    );
    draw();
  }

  function highlightCard(highlight, panel) {
    const card = el(
      "article",
      `rui-card rui-card-${highlightColor(highlight)}`
    );
    const open = el("button", "rui-card-main", { type: "button" });
    const meta = el("span", "rui-card-meta");
    meta.textContent = `Page ${highlight.pageNo}`;
    const quote = el("span", "rui-card-quote");
    quote.textContent = highlight.text || "(highlight)";
    open.append(meta, quote);
    open.addEventListener("click", () => {
      goToPage(highlight.pageNo);
      closeSheet();
    });
    const remove = el("button", "rui-icon-btn rui-card-action", {
      type: "button",
      "aria-label": "Delete highlight",
      title: "Delete highlight",
    });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    remove.innerHTML = icon("trash");
    remove.addEventListener("click", () => {
      const copy = { ...highlight };
      window.removeHighlight?.(highlight.id);
      panel.replaceChildren();
      renderHighlights(panel);
      toast("Highlight deleted.", {
        actionLabel: "Undo",
        timeout: 6000,
        onAction: () => {
          // Saving the same highlight (same id) restores it in the app.
          window.parent.postMessage(
            { type: "saveHighlight", payload: copy },
            "*"
          );
          window.addHighlights?.([copy]);
          if (panel.isConnected) {
            panel.replaceChildren();
            renderHighlights(panel);
          }
        },
      });
    });
    card.append(open, remove);
    return card;
  }

  // --- Notes ---

  function renderNotes(panel) {
    const page = currentPage();
    const scopes = [
      { id: "page", label: `This page ${notesOnPage(page).length}` },
      { id: "book", label: `Whole book ${notebook.notes.length}` },
    ];
    panel.append(
      chipRow(scopes, notebook.noteScope, id => {
        notebook.noteScope = id;
        panel.replaceChildren();
        renderNotes(panel);
      })
    );
    const notes =
      notebook.noteScope === "page"
        ? notesOnPage(page)
        : [...notebook.notes].sort((a, b) => a.pageNo - b.pageNo);
    if (!notes.length) {
      emptyState(
        panel,
        notebook.noteScope === "page"
          ? "No notes from the BAWS.in Team on this page."
          : "No notes from the BAWS.in Team in this book yet."
      );
      return;
    }
    const list = el("div", "rui-cards");
    for (const note of notes) {
      list.append(noteCard(note));
    }
    panel.append(list);
  }

  function noteCard(note) {
    const card = el(
      "article",
      `rui-card rui-note rui-note-${
        note.kind in NOTE_KINDS ? note.kind : "note"
      }`
    );
    card.dataset.noteId = note.id;
    const head = el("div", "rui-note-head");
    const kind = el("span", "rui-note-kind");
    kind.textContent = NOTE_KINDS[note.kind] || "Note";
    const meta = el("span", "rui-card-meta");
    const date = note.updatedAt ? new Date(note.updatedAt) : null;
    meta.textContent = [
      note.author || "BAWS.in Team",
      `Page ${note.pageNo}`,
      date && !isNaN(date) ? date.toLocaleDateString() : null,
    ]
      .filter(Boolean)
      .join(" · ");
    head.append(kind, meta);
    card.append(head);
    if (note.title) {
      const title = el("h3", "rui-note-title");
      title.textContent = note.title;
      card.append(title);
    }
    if (note.anchor?.exact) {
      const quote = el("blockquote", "rui-note-quote");
      quote.textContent = note.anchor.exact;
      card.append(quote);
    }
    const body = el("div", "rui-note-body");
    renderPlainText(body, note.body);
    card.append(body);
    if (note.pageNo !== currentPage()) {
      const go = el("button", "rui-chip", { type: "button" });
      go.textContent = "Go to passage";
      go.addEventListener("click", () => {
        goToPage(note.pageNo);
        closeSheet();
        setTimeout(() => flashNoteMarker(note.id), 900);
      });
      card.append(go);
    }
    return card;
  }

  /** Opens this page's notes in the Notebook (from a mark or a toast). */
  function openNotesFor() {
    notebook.noteScope = "page";
    openNotebook("notes");
  }

  const RENDER_TAB = {
    contents: renderContents,
    highlights: renderHighlights,
    notes: renderNotes,
    words: renderWords,
  };

  // --- Words ---

  function renderWords(panel) {
    const words = Object.values(savedWords()).sort(
      (a, b) => b.savedAt - a.savedAt
    );
    if (!words.length) {
      emptyState(
        panel,
        "Save words from their meaning card to build your own list. Select a word and tap Define."
      );
      return;
    }
    const list = el("div", "rui-cards");
    for (const entry of words) {
      const card = el("article", "rui-card rui-word");
      const open = el("button", "rui-card-main", { type: "button" });
      const word = el("span", "rui-word-term");
      word.textContent = entry.word;
      const meaning = el("span", "rui-card-quote");
      meaning.textContent = entry.definition || "No meaning saved.";
      open.append(word, meaning);
      open.addEventListener("click", () => {
        closeSheet();
        showDefinition(entry.word, entry.definition);
      });
      const remove = el("button", "rui-icon-btn rui-card-action", {
        type: "button",
        "aria-label": `Remove ${entry.word}`,
        title: "Remove",
      });
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      remove.innerHTML = icon("trash");
      remove.addEventListener("click", () => {
        toggleSavedWord(entry.word);
        panel.replaceChildren();
        renderWords(panel);
      });
      card.append(open, remove);
      list.append(card);
    }
    panel.append(list);
  }

  // --- Notes on the page: margin marks ---

  /**
   * Finds `anchor.exact` in a page's text and returns its top offset (px)
   * within the page element, or null. Whitespace differences are ignored;
   * if that fails, words glued together in the PDF text are tolerated by
   * matching without any whitespace. prefix/suffix pick between repeats.
   */
  function locateAnchor(pageDiv, anchor) {
    const root =
      pageDiv.querySelector(".textLayer") || pageDiv.querySelector(".textView");
    if (!root || !anchor?.exact) {
      return null;
    }
    for (const keepSpaces of [true, false]) {
      const map = [];
      let text = "";
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const value = node.nodeValue;
        for (let i = 0; i < value.length; i++) {
          const isSpace = /\s/.test(value[i]);
          if (isSpace && (!keepSpaces || text.endsWith(" ") || !text)) {
            continue;
          }
          text += isSpace ? " " : value[i].toLowerCase();
          map.push([node, i]);
        }
        if (keepSpaces && !text.endsWith(" ") && text) {
          text += " "; // spans are separate words more often than not
          map.push([node, value.length]);
        }
      }
      const norm = s => {
        const lower = String(s || "").toLowerCase();
        return keepSpaces
          ? lower.replaceAll(/\s+/g, " ").trim()
          : lower.replaceAll(/\s+/g, "");
      };
      const needle = norm(anchor.exact);
      if (!needle) {
        return null;
      }
      const prefix = norm(anchor.prefix).slice(-20);
      const suffix = norm(anchor.suffix).slice(0, 20);
      let best = -1;
      let bestScore = -1;
      for (
        let at = text.indexOf(needle);
        at !== -1;
        at = text.indexOf(needle, at + 1)
      ) {
        let score = 0;
        if (
          prefix &&
          text.slice(Math.max(0, at - prefix.length - 1), at).includes(prefix)
        ) {
          score++;
        }
        if (
          suffix &&
          text
            .slice(at + needle.length, at + needle.length + suffix.length + 1)
            .includes(suffix)
        ) {
          score++;
        }
        if (score > bestScore) {
          best = at;
          bestScore = score;
        }
      }
      if (best === -1) {
        continue;
      }
      const [node, offset] = map[best];
      const range = document.createRange();
      range.setStart(node, Math.min(offset, node.nodeValue.length));
      range.setEnd(node, Math.min(offset + 1, node.nodeValue.length));
      const rect = range.getClientRects()[0] || range.getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) {
        continue;
      }
      return rect.top - pageDiv.getBoundingClientRect().top;
    }
    return null;
  }

  function renderNoteMarkers(pageNumber) {
    const pageDiv = document.querySelector(
      `.page[data-page-number='${pageNumber}']`
    );
    if (!pageDiv) {
      return;
    }
    pageDiv.querySelectorAll(".rui-note-marker").forEach(m => m.remove());
    const notes = notesOnPage(pageNumber);
    if (!notes.length) {
      return;
    }
    const pageRect = pageDiv.getBoundingClientRect();
    const height = pageRect.height;
    // On phones the page is wider than the screen (its margins are cropped
    // on purpose), so keep the marks inside the visible part of the page.
    const containerRect = document
      .getElementById("viewerContainer")
      .getBoundingClientRect();
    const hiddenRight = Math.max(0, pageRect.right - containerRect.right);
    const byTop = new Map();
    for (const note of notes) {
      let top = locateAnchor(pageDiv, note.anchor);
      if (
        top === null &&
        note.anchor?.rects?.[0] &&
        window.VIEW_MODE !== "text"
      ) {
        top = (note.anchor.rects[0].topPercent / 100) * height;
      }
      const key = top === null ? "page" : Math.round(top / 24); // group close marks
      if (!byTop.has(key)) {
        byTop.set(key, { top, notes: [] });
      }
      byTop.get(key).notes.push(note);
    }
    for (const { top, notes: group } of byTop.values()) {
      const marker = el("button", "rui-note-marker", {
        type: "button",
        "aria-label": `${group.length} note${
          group.length > 1 ? "s" : ""
        } from the BAWS.in Team`,
        title: group
          .map(n => n.title || NOTE_KINDS[n.kind] || "Note")
          .join(" · "),
      });
      marker.dataset.noteIds = group.map(n => n.id).join(" ");
      if (group.some(n => n.kind === "disputed")) {
        marker.classList.add("rui-note-marker-disputed");
      }
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      marker.innerHTML = icon("note") + "<span></span>";
      marker.querySelector("span").textContent = String(group.length);
      marker.style.right = `${hiddenRight + 6}px`;
      if (top === null) {
        marker.classList.add("rui-note-marker-page");
      } else {
        marker.style.top = `${Math.max(0, top - 2)}px`;
      }
      marker.addEventListener("click", () => openNotesFor(pageNumber));
      pageDiv.append(marker);
    }
  }

  function renderAllNoteMarkers() {
    document.querySelectorAll(".page[data-loaded]").forEach(page => {
      renderNoteMarkers(Number(page.dataset.pageNumber));
    });
  }

  function flashNoteMarker(noteId) {
    const marker = [...document.querySelectorAll(".rui-note-marker")].find(m =>
      m.dataset.noteIds.split(" ").includes(String(noteId))
    );
    if (marker) {
      marker.classList.remove("rui-flash");
      void marker.offsetWidth; // restart the animation
      marker.classList.add("rui-flash");
    }
  }

  function maybeToastNotes() {
    const page = currentPage();
    const count = notesOnPage(page).length;
    if (!count || notebook.toastedPages.has(page)) {
      return;
    }
    notebook.toastedPages.add(page);
    toast(
      `${count} note${count > 1 ? "s" : ""} from the BAWS.in Team on this page`,
      {
        actionLabel: "View",
        onAction: () => openNotesFor(page),
        timeout: 6000,
      }
    );
  }

  // --- Marks on the page slider ---

  function renderSliderMarks() {
    const total = pagesCount();
    if (!ui.marks || total < 2) {
      return;
    }
    ui.marks.replaceChildren();
    const place = (page, className) => {
      const mark = el("span", className);
      mark.style.left = `${((page - 1) / (total - 1)) * 100}%`;
      ui.marks.append(mark);
    };
    const highlightPages = new Map();
    for (const h of bookHighlights()) {
      if (!highlightPages.has(h.pageNo)) {
        highlightPages.set(h.pageNo, highlightColor(h));
      }
    }
    for (const [page, color] of highlightPages) {
      place(page, `rui-mark rui-mark-highlight rui-swatch-${color}`);
    }
    for (const page of new Set(notebook.notes.map(n => n.pageNo))) {
      place(page, "rui-mark rui-mark-note");
    }
  }

  function setNotes(list) {
    notebook.notes = (Array.isArray(list) ? list : [])
      .filter(
        note =>
          note &&
          note.id !== undefined &&
          note.id !== null &&
          Number.isInteger(note.pageNo)
      )
      .filter(note => !note.url || inThisBook(note));
    renderAllNoteMarkers();
    renderSliderMarks();
    maybeToastNotes();
  }

  function wireNotebook() {
    // BAWS.in Team notes for the whole book, from the app:
    // {type: "loadAnnotations", payload: [{id, pageNo, url, anchor: {exact,
    //  prefix, suffix, rects?}, kind, title, body, author, updatedAt}]}
    window.addEventListener("message", event => {
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if ((data?.type || data?.action) === "loadAnnotations") {
        setNotes(data.payload || data.data);
      }
    });
    document.addEventListener("baws:highlightschange", renderSliderMarks);
    const bus = app().eventBus;
    bus._on("textlayerrendered", e => renderNoteMarkers(e.pageNumber));
    bus._on("pagerendered", e => {
      if (window.VIEW_MODE === "text") {
        renderNoteMarkers(e.pageNumber);
      }
    });
    let toastTimer = null;
    bus._on("pagechanging", () => {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(maybeToastNotes, 700);
    });
    bus._on("pagesloaded", renderSliderMarks);
    // Zoom and window size change what part of the page is visible.
    let placeTimer = null;
    const replaceMarks = () => {
      clearTimeout(placeTimer);
      placeTimer = setTimeout(renderAllNoteMarkers, 250);
    };
    bus._on("scalechanging", replaceMarks);
    window.addEventListener("resize", replaceMarks);
    renderSliderMarks();
  }

  // ---------------------------------------------------------------------
  // Built-in actions
  // ---------------------------------------------------------------------

  function shortPageUrl() {
    const data = window.getBookUrlData?.();
    if (!data) {
      return location.href;
    }
    const host =
      location.hostname === "localhost" ? "baws.in" : location.hostname;
    return (
      `https://${host}/books/${data.bookParent}/${data.language}/` +
      `${data.bookName}/pdf/${data.pageNo}`
    );
  }

  function registerBuiltInActions() {
    registerAction({
      id: "back",
      label: "Back to library",
      icon: "back",
      placements: ["top-start"],
      elementId: "leaveButton",
      run: () => window.loadSearchPage?.(),
    });
    registerAction({
      id: "search",
      label: "Search in book",
      icon: "search",
      placements: ["top-end"],
      priority: 10,
      run: () => app()?.findBar?.toggle(),
    });

    registerAction({
      id: "contents",
      label: "Contents",
      icon: "contents",
      placements: ["dock"],
      priority: 50,
      elementId: "ruiContents",
      run: () => openNotebook("contents"),
    });
    registerAction({
      id: "listen",
      label: "Listen",
      icon: "listen",
      placements: ["dock"],
      priority: 40,
      elementId: "voiceButton",
      pressed: () => !!window.audioMeta?.isSpeaking,
      run: openPlayerSheet,
    });
    registerAction({
      id: "highlight",
      label: "Highlight",
      icon: "highlight",
      placements: ["dock"],
      priority: 30,
      elementId: "bookMark",
      run: () => highlightSelection(lastHighlightColor()),
    });
    registerAction({
      id: "share",
      label: "Share",
      icon: "share",
      placements: ["dock"],
      priority: 20,
      elementId: "shareButton",
      run: () => window.shareButtonClick?.(false),
      longPress: () => window.shareButtonClick?.(true),
    });
    // Selection bar (after the colour swatches)
    registerAction({
      id: "define",
      label: "Define",
      icon: "define",
      placements: ["selection"],
      priority: 30,
      run: defineSelection,
    });
    registerAction({
      id: "shareSelection",
      label: "Share",
      icon: "share",
      placements: ["selection"],
      priority: 20,
      run: () => {
        hideSelectionBar();
        window.shareButtonClick?.(false);
      },
    });
    registerAction({
      id: "copy",
      label: "Copy",
      icon: "copy",
      placements: ["selection"],
      priority: 10,
      run: copySelection,
    });

    registerAction({
      id: "more",
      label: "More",
      icon: "more",
      placements: ["dock"],
      priority: -100,
      elementId: "ruiMore",
      run: openMoreSheet,
    });

    // More sheet: Reading
    registerAction({
      id: "notebook",
      label: "Notebook",
      icon: "notebook",
      placements: ["more"],
      group: "Reading",
      priority: 110,
      run: () =>
        openNotebook(notebook.tab === "contents" ? "highlights" : notebook.tab),
    });
    registerAction({
      id: "askPradnya",
      label: "Ask Pradnya",
      icon: "note",
      placements: ["more"],
      group: "Ask",
      priority: 5,
      // Only inside the BAWS.in app, which hosts the Pradnya chat.
      visible: () => window.parent !== window,
      run: () =>
        window.parent.postMessage(
          JSON.stringify({ action: "openPradnya" }),
          "*"
        ),
    });
    registerAction({
      id: "goToPage",
      label: "Go to page",
      icon: "page",
      placements: ["more"],
      group: "Reading",
      priority: 100,
      keepSheetOpen: true,
      run: openGoToPage,
    });
    registerAction({
      id: "display",
      label: "Display settings",
      iconText: "Aa",
      placements: ["top-end"],
      priority: 15,
      elementId: "ruiDisplay",
      run: openDisplaySheet,
    });
    registerAction({
      id: "fullscreen",
      label() {
        return window.flexi_isFullscreen ? "Exit fullscreen" : "Fullscreen";
      },
      icon: "fullscreen",
      placements: ["more"],
      group: "Reading",
      priority: 80,
      visible: () =>
        !!document.getElementById("outerContainer")?.requestFullscreen,
      run: () => window.fullScreen?.(),
    });
    registerAction({
      id: "zoomOut",
      label: "Zoom out",
      icon: "zoomOut",
      placements: ["top-end"],
      priority: 30,
      run: () => app()?.zoomOut(),
    });
    registerAction({
      id: "zoomIn",
      label: "Zoom in",
      icon: "zoomIn",
      placements: ["top-end"],
      priority: 20,
      run: () => app()?.zoomIn(),
    });

    // More sheet: Share
    registerAction({
      id: "sharePage",
      label: "Page image",
      icon: "image",
      placements: ["more"],
      group: "Share",
      priority: 50,
      run: () => window.shareButtonClick?.(false),
    });
    registerAction({
      id: "shareQr",
      label: "QR code",
      icon: "qr",
      placements: ["more"],
      group: "Share",
      priority: 40,
      run: () => window.shareButtonClick?.(true),
    });
    registerAction({
      id: "copyLink",
      label: "Copy link",
      icon: "link",
      placements: ["more"],
      group: "Share",
      priority: 30,
      run: async () => {
        try {
          await navigator.clipboard.writeText(shortPageUrl());
          toast("Link to this page copied.");
        } catch {
          toast("Couldn't copy the link.");
        }
      },
    });
  }

  // ---------------------------------------------------------------------
  // Start-up
  // ---------------------------------------------------------------------

  function whenViewerReady(callback) {
    const check = () => {
      const a = app();
      if (a?.eventBus && a.pdfDocument && a.pagesCount) {
        callback(a);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  }

  function waitForOutline(tries = 0) {
    if (outline()) {
      renderTicks();
      updatePageUI();
    } else if (tries < 60) {
      setTimeout(() => waitForOutline(tries + 1), 1000);
    }
  }

  function startReaderUi() {
    registerBuiltInActions();
    buildChrome();
    wireDisplaySettings();

    whenViewerReady(a => {
      a.eventBus._on("pagechanging", () => {
        updatePageUI();
        // The app updates its title after it hears about the page change.
        setTimeout(updatePageUI, 400);
      });
      a.eventBus._on("pagesloaded", updatePageUI);

      // A page without a text version (.md) in "Fit to phone" mode: offer
      // the original page, once per switch into that mode.
      let textNoticeShown = false;
      a.eventBus._on("textviewunavailable", () => {
        if (textNoticeShown || window.VIEW_MODE !== "text") {
          return;
        }
        textNoticeShown = true;
        toast("This page has no text version yet.", {
          actionLabel: "Show original",
          onAction: () => window.switchMode?.("pdf"),
          timeout: 8000,
        });
      });
      a.eventBus._on("pagerendered", e => {
        if (window.VIEW_MODE !== "text") {
          textNoticeShown = false;
          return;
        }
        // The text pages start with the printed page number ("**12**"):
        // show it as a small label, not as a paragraph of the text.
        const first = a.pdfViewer
          .getPageView(e.pageNumber - 1)
          ?.div.querySelector(".textView > p:first-child");
        if (first && /^\s*\d{1,4}\s*$/.test(first.textContent)) {
          first.classList.add("rui-page-label");
        }
      });
      updatePageUI();
      waitForOutline();

      const container = document.getElementById("viewerContainer");
      wireScrollHiding(container);
      wireGestures(container);
      wireSelectionBar(container);
      wirePlayer();
      wireNotebook();
      wireWordHelper();
      a.eventBus._on("pagechanging", () => {
        hideSelectionBar();
        closeDefinition();
        updatePlayer();
      });

      if (!storageGet("ruiHintShown")) {
        storageSet("ruiHintShown", "1");
        const touchDevice = matchMedia("(pointer: coarse)").matches;
        toast(
          touchDevice
            ? "Tap the page to show or hide controls. Swipe to turn pages."
            : "Click the page to show or hide controls. Use ← → to turn pages.",
          { timeout: 6000 }
        );
      }
    });

    document.addEventListener("baws:speakingchange", refreshPressedStates);
  }

  window.BawsReaderUI = {
    registerAction,
    toast,
    showDefinition,
    openNotebook,
    openSheet,
    closeSheet,
    showControls: () => setChromeHidden(false),
    hideControls: () => setChromeHidden(true),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startReaderUi);
  } else {
    startReaderUi();
  }
})();
