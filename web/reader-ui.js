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

  // iPhone/iPad browsers (all WebKit) scroll diagonally and bounce at the
  // edges, so a sideways swipe also scrolls the page a little; see
  // wireGestures() and wireScrollHiding().
  const IS_IOS =
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Phones and tablets (iOS, Android, the app): at the normal size the page
  // stays put with its text in the middle; see wireTextCentering().
  const CENTRES_TEXT = IS_IOS || matchMedia("(pointer: coarse)").matches;

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
    print:
      '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    textView: '<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',
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
    quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
    swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
    help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    trash:
      '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    // Material "translate" (A + 文), filled.
    translate:
      '<path fill="currentColor" stroke="none" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>',
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
   * @property {function} [badge] - returns true to show a small dot on the
   *   button (top bar)
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
    button.dataset.action = action.id;
    if (action.elementId) {
      button.id = action.elementId;
    }
    if (action.pressed) {
      button.setAttribute("aria-pressed", String(!!action.pressed()));
    }
    if (action.badge?.()) {
      button.classList.add("rui-badge");
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
    ui.topEnd.replaceChildren(
      ...groupZoomButtons(actionsFor("top-end").map(makeIconButton))
    );
    const dockActions = actionsFor("dock").slice(0, 5);
    ui.dock.style.setProperty("--rui-dock-count", dockActions.length);
    ui.dock.replaceChildren(...dockActions.map(makeDockButton));
  }

  /**
   * Puts the zoom buttons in one group. On phones the CSS stacks them in one
   * narrow column (+ above -) with a small "zoom" label, which frees one
   * button's width in the top bar; on wider screens they stay side by side.
   */
  function groupZoomButtons(buttons) {
    const zoomOut = buttons.find(b => b.dataset.action === "zoomOut");
    const zoomIn = buttons.find(b => b.dataset.action === "zoomIn");
    if (!zoomOut || !zoomIn) {
      return buttons;
    }
    const group = el("div", "rui-zoom", {
      role: "group",
      "aria-label": "Zoom",
    });
    for (const [button, glyph] of [
      [zoomOut, "minus"],
      [zoomIn, "plus"],
    ]) {
      // Plain + and - for the small stacked buttons.
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/method
      button.insertAdjacentHTML("beforeend", icon(glyph));
      button.lastElementChild.classList.add("rui-zoom-glyph");
    }
    const label = el("span", "rui-zoom-label", { "aria-hidden": "true" });
    label.textContent = "zoom";
    group.append(zoomOut, zoomIn, label);
    const at = Math.min(buttons.indexOf(zoomOut), buttons.indexOf(zoomIn));
    const rest = buttons.filter(b => b !== zoomOut && b !== zoomIn);
    rest.splice(at, 0, group);
    return rest;
  }

  /** Pressed states, and labels that follow them ("Save" / "Saved"). */
  function refreshPressedStates() {
    for (const action of actions.values()) {
      if (!action.pressed || !action.elementId) {
        continue;
      }
      const button = document.getElementById(action.elementId);
      if (!button) {
        continue;
      }
      button.setAttribute("aria-pressed", String(!!action.pressed()));
      if (typeof action.label !== "function") {
        continue;
      }
      const label = labelOf(action);
      const text = button.querySelector(".rui-dock-btn > span");
      if (text) {
        text.textContent = label;
      } else {
        button.setAttribute("aria-label", label);
        button.title = label;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Show / hide the controls
  // ---------------------------------------------------------------------

  let chromeHidden = false;
  let suppressScrollUntil = 0;
  // Until when scrolling comes from a sideways swipe (iOS), not reading.
  let sidewaysSwipeUntil = 0;

  // A bar hides only when it covers at least this share of the page on
  // screen: hiding a bar that covers nothing just shows empty background
  // where it was (e.g. the top bar above a page that fits the screen).
  const HIDE_MIN_COVER = 0.02;

  /**
   * Shares (0-1) of the page area on screen covered by the top bar and by the
   * bottom panel. Measured from their heights, so it's the same whether they
   * are shown or hidden.
   */
  function controlsCoverPage() {
    const view = app()?.pdfViewer?.getPageView(currentPage() - 1);
    const page = view?.div.querySelector(".canvasWrapper") || view?.div;
    if (!page) {
      return { top: 1, bottom: 1 };
    }
    const rect = page.getBoundingClientRect();
    const top = Math.max(rect.top, 0);
    const bottom = Math.min(rect.bottom, window.innerHeight);
    if (bottom <= top) {
      return { top: 1, bottom: 1 };
    }
    const height = bottom - top;
    const topBarEnd = ui.top.offsetHeight;
    const bottomBarStart = window.innerHeight - ui.bottom.offsetHeight;
    return {
      top: Math.max(0, Math.min(topBarEnd, bottom) - top) / height,
      bottom: Math.max(0, bottom - Math.max(bottomBarStart, top)) / height,
    };
  }

  /**
   * @param {boolean} hidden
   * @param {Object} [options]
   * @param {boolean} [options.auto] - hidden by the reader (swiping,
   *   scrolling), not by a tap: nothing hides when neither bar covers the
   *   page. A tap then still hides both, so it never seems to do nothing.
   */
  function setChromeHidden(hidden, { auto = false } = {}) {
    if (hidden && (sheetOpen || hasSelection())) {
      return;
    }
    let keepTop = false;
    let keepBottom = false;
    if (hidden) {
      const cover = controlsCoverPage();
      keepTop = cover.top < HIDE_MIN_COVER;
      keepBottom = cover.bottom < HIDE_MIN_COVER;
      if (keepTop && keepBottom) {
        if (auto) {
          return;
        }
        keepTop = keepBottom = false;
      }
    }
    chromeHidden = hidden;
    const root = document.documentElement;
    root.classList.toggle("rui-chrome-hidden", hidden);
    root.classList.toggle("rui-keep-top", keepTop);
    root.classList.toggle("rui-keep-bottom", keepBottom);
    ui.top.inert = hidden && !keepTop;
    ui.bottom.inert = hidden && !keepBottom;
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
          let top = container.scrollTop;
          if (IS_IOS) {
            // Ignore the bounce past the top or bottom (it scrolls back the
            // other way) and the drift of a sideways swipe.
            const max = container.scrollHeight - container.clientHeight;
            top = Math.min(Math.max(top, 0), max);
            if (performance.now() < sidewaysSwipeUntil) {
              lastTop = top;
              return;
            }
          }
          const delta = top - lastTop;
          if (Math.abs(delta) < SCROLL_HIDE_DELTA) {
            return;
          }
          lastTop = top;
          if (performance.now() < suppressScrollUntil) {
            return;
          }
          if (delta > 0 && top > 80) {
            setChromeHidden(true, { auto: true });
          } else if (delta < 0) {
            setChromeHidden(false);
          }
        });
      },
      { passive: true }
    );
  }

  // A page wider than the screen by more than this share pans sideways
  // (zoomed in); up to it, only its white margins are cut off.
  const PAN_MIN_OVERFLOW = 0.2;

  /** Whether the view pans sideways (zoomed in); see canTurn(). */
  function pansSideways(container) {
    const overflow = container.scrollWidth - container.clientWidth;
    return overflow > container.clientWidth * PAN_MIN_OVERFLOW;
  }

  /** The middle of the printed text on a page, in window coordinates. */
  function textMiddle(pageView) {
    let left = Infinity;
    let right = -Infinity;
    for (const span of pageView?.div.querySelectorAll(".textLayer span") ||
      []) {
      if (!span.textContent.trim()) {
        continue;
      }
      const rect = span.getBoundingClientRect();
      if (!rect.width) {
        continue; // a wrapper or marker, not a line of text
      }
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
    }
    return left < right ? (left + right) / 2 : null;
  }

  /**
   * Touch screens: at the normal size the page is a little wider than the
   * screen (its white margins are cut off). Swipes there turn pages, so the
   * page doesn't pan sideways and its text is kept in the middle: book pages
   * have the wider margin on the outside (left or right, odd or even page),
   * so centring the paper would cut off text. Zoomed in, it pans as usual.
   * First on iOS; on Android (2026-11-15) the page a book opened at was
   * scrolled to its right edge by pdf.js, cutting off the start of each line.
   */
  function wireTextCentering(container, a) {
    if (!CENTRES_TEXT) {
      return;
    }
    const update = () => {
      const locked = !pansSideways(container);
      document.documentElement.classList.toggle("rui-no-pan", locked);
      if (!locked) {
        return;
      }
      const max = container.scrollWidth - container.clientWidth;
      const middle = textMiddle(a.pdfViewer.getPageView(a.page - 1));
      if (middle === null) {
        container.scrollLeft = max / 2; // no text (yet): centre the paper
        return;
      }
      const box = container.getBoundingClientRect();
      const shift = middle - (box.left + container.clientWidth / 2);
      container.scrollLeft = Math.min(
        Math.max(container.scrollLeft + shift, 0),
        max
      );
    };
    // After pdf.js has scrolled to the new page or size, and again once the
    // page's text is there.
    const later = () => requestAnimationFrame(update);
    for (const name of ["pagechanging", "scalechanging", "pagesloaded"]) {
      a.eventBus._on(name, later);
    }
    a.eventBus._on("textlayerrendered", e => {
      if (e.pageNumber === a.page) {
        later();
      }
    });
    window.addEventListener("resize", later);
    later();
  }

  /** With a mouse, reaching the top or bottom edge brings the controls back. */
  function wireMouseEdges() {
    if (!matchMedia("(pointer: fine)").matches) {
      return;
    }
    const EDGE = 6;
    document.addEventListener(
      "mousemove",
      event => {
        if (
          chromeHidden &&
          (event.clientY <= EDGE || event.clientY >= window.innerHeight - EDGE)
        ) {
          setChromeHidden(false);
        }
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

    // Whether a sideways swipe (dx < 0: to the left) turns the page now.
    // When zoomed in, a swipe scrolls first and turns the page only once the
    // view is at that edge. On touch screens, near the normal size, it always
    // turns the page: there the swipe would otherwise scroll the cropped
    // margins.
    const canTurn = dx => {
      if (CENTRES_TEXT && !pansSideways(container)) {
        return true;
      }
      const atRight =
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 2;
      const atLeft = container.scrollLeft <= 2;
      return dx < 0 ? atRight : atLeft;
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
        if (IS_IOS) {
          sidewaysSwipeUntil = performance.now() + 700;
        }
        // On iOS this also stops the page scrolling along with the swipe.
        if (canTurn(dx) && event.cancelable) {
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
        if (IS_IOS && start.axis === "x") {
          sidewaysSwipeUntil = performance.now() + 700; // momentum
        }

        if (
          Math.abs(dx) >= SWIPE_MIN_X &&
          // Thumb swipes on iPhones curve more.
          Math.abs(dx) > (IS_IOS ? 1.5 : 2) * Math.abs(dy) &&
          dt <= SWIPE_MAX_MS &&
          !start.hadSelection &&
          !hasSelection() &&
          !sheetOpen &&
          storageGet("readerSwipe") !== "0"
        ) {
          if (canTurn(dx)) {
            navigate(dx < 0 ? "next" : "prev");
            // Swiping through pages is reading: get the controls out of the
            // way.
            setChromeHidden(true, { auto: true });
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
    // pdf.js's `page` getter throws until its viewer exists.
    const a = app();
    return (a?.pdfViewer && a.page) || 1;
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
    // The highlight's area and its saved text both take the full words.
    wholeWordSelection();
    window.addBookMark?.(color);
    hideSelectionBar();
  }

  /**
   * Widens the selection in the book to whole words at both ends: a phone
   * selection often starts or ends inside one (owner, 2026-11-27). Used by
   * Highlight, Copy and Save (Share takes whole words its own way).
   */
  function wholeWordSelection() {
    const range = selectionRangeInBook();
    if (!range) {
      return;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(snapToWords(range));
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
    // Highlights are drawn on the page, so Text view has none: there, Save
    // keeps the page with the selected passage.
    if (window.VIEW_MODE === "text") {
      ui.selbar.replaceChildren(...buttons);
      return;
    }
    ui.selbar.replaceChildren(swatches, separator, ...buttons);
  }

  // Lazy: a bar that is already showing moves only when it would cover the
  // selected text or the selection has gone well away from it. Moving it
  // on every change made it jump under the finger while the selection was
  // being adjusted.
  const SELBAR_NEAR = 140;

  // Phones float their own menu (Copy, Select all...) just above a
  // selection (below it when there's no room above); about this tall.
  const SYSTEM_MENU_H = 60;

  /**
   * The part of the screen the bar may use, {top, bottom}: below the top bar
   * and above whatever sits at the foot (the bottom bar, the mini player,
   * the definition card), when they show.
   */
  function selectionBarArea() {
    const height = window.innerHeight;
    const showing = node => {
      if (!node || node.hidden) {
        return null;
      }
      const rect = node.getBoundingClientRect();
      const visible =
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < height &&
        Number(getComputedStyle(node).opacity) > 0.1;
      return visible ? rect : null;
    };
    let top = 0;
    let bottom = height;
    const header = showing(ui.top);
    if (header && header.top < height / 2) {
      top = Math.max(top, header.bottom);
    }
    const foot = [
      ui.bottom,
      document.querySelector(".rui-mini"),
      document.querySelector(".rui-defcard"),
      document.querySelector(".rui-quote-note"),
    ];
    for (const node of foot) {
      const rect = showing(node);
      if (rect && rect.top > height / 2) {
        bottom = Math.min(bottom, rect.top);
      }
    }
    return { top, bottom };
  }

  function selectionBarStillFits(rects) {
    const bar = ui.selbar.getBoundingClientRect();
    const margin = 4;
    const area = selectionBarArea();
    if (bar.top < area.top || bar.bottom > area.bottom) {
      return false;
    }
    const covers = rects.some(
      r =>
        r.left < bar.right + margin &&
        r.right > bar.left - margin &&
        r.top < bar.bottom + margin &&
        r.bottom > bar.top - margin
    );
    const top = Math.min(...rects.map(r => r.top));
    const bottom = Math.max(...rects.map(r => r.bottom));
    const near =
      bar.bottom >= top - SELBAR_NEAR && bar.top <= bottom + SELBAR_NEAR;
    return !covers && near;
  }

  /**
   * Puts the bar next to the selection, in the free part of the screen
   * (selectionBarArea: not under the bottom bar or the definition card),
   * clear of the phone's own menu. The page is never scrolled for it
   * (owner, 2026-11-26).
   */
  function positionSelectionBar(range, { lazy = false } = {}) {
    const bar = ui.selbar;
    const rects = [...range.getClientRects()].filter(r => r.width > 0);
    if (!rects.length) {
      return;
    }
    if (lazy && selectionBarStillFits(rects)) {
      return;
    }
    const first = rects[0];
    const last = rects.at(-1);
    const box = range.getBoundingClientRect();
    const width = bar.offsetWidth;
    const height = bar.offsetHeight;
    const gap = 12;
    const margin = 8;
    const area = selectionBarArea();
    // Phones show their own copy/share menu above a selection, so put ours
    // below it on touch screens and above it with a mouse; above, on touch
    // screens, means above the phone's menu too. A selection at the very top
    // of the screen leaves the phone no room above it, so its menu goes
    // below the selection: ours then goes below that menu. Ours never
    // covers it (owner, 2026-11-26).
    const touchFirst = matchMedia("(pointer: coarse)").matches;
    const menu = touchFirst ? SYSTEM_MENU_H : 0;
    const menuBelow = touchFirst && first.top < SYSTEM_MENU_H + margin;
    const below = last.bottom + gap + (menuBelow ? SYSTEM_MENU_H : 0);
    const above = first.top - height - gap - menu;
    const fitsBelow = below + height <= area.bottom - margin;
    const fitsAbove = above >= area.top + margin;
    const order = touchFirst
      ? [fitsBelow && below, fitsAbove && above]
      : [fitsAbove && above, fitsBelow && below];
    // Neither fits (a selection taller than the screen): touch screens at
    // the foot of the free area (the phone's menu is at the selection's
    // start), a mouse at the top.
    const fallback = touchFirst
      ? area.bottom - height - margin
      : area.top + margin;
    const top = Math.max(
      area.top + margin,
      order.find(value => value !== false) ?? fallback
    );
    const left = Math.min(
      Math.max(box.left + box.width / 2 - width / 2, margin),
      window.innerWidth - width - margin
    );
    bar.style.top = `${Math.round(top)}px`;
    bar.style.left = `${Math.round(left)}px`;
  }

  function showSelectionBar(range) {
    storageSet("ruiSelectedOnce", "1");
    ui.selbar.classList.remove("rui-selbar-busy");
    if (ui.selbar.hidden) {
      renderSelectionBar();
      ui.selbar.hidden = false;
      positionSelectionBar(range);
      return;
    }
    positionSelectionBar(range, { lazy: true });
  }

  function hideSelectionBar() {
    if (ui.selbar && !ui.selbar.hidden) {
      ui.selbar.hidden = true;
      ui.selbar.classList.remove("rui-selbar-busy");
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
      // A meaning shown for a selected word goes once the selection grows
      // or moves to other text (owner, 2026-11-26).
      if (ui.defcard && ui.defcardWord && range) {
        const now = cleanWord(selectedText()).toLowerCase();
        if (now && now !== ui.defcardWord) {
          closeDefinition();
        }
      }
      clearTimeout(timer);
      // While the selection is being adjusted the bar stays where it is,
      // faint and out of the way of the finger (see .rui-selbar-busy).
      if (!ui.selbar.hidden) {
        ui.selbar.classList.add("rui-selbar-busy");
      }
      // Wait for the selection to settle (handles being dragged); a bar
      // already showing waits a little longer before it moves.
      timer = setTimeout(
        () => {
          const settled = selectionRangeInBook();
          if (settled && !sheetOpen) {
            showSelectionBar(settled);
          } else {
            hideSelectionBar();
          }
        },
        ui.selbar.hidden ? 200 : 400
      );
    });
    // Scrolling moves the text under the (fixed) bar: follow it, once a
    // frame at most.
    let scrollFrame = 0;
    container.addEventListener(
      "scroll",
      () => {
        if (scrollFrame || ui.selbar.hidden) {
          return;
        }
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          const range = !ui.selbar.hidden && selectionRangeInBook();
          if (range) {
            positionSelectionBar(range);
          }
        });
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
    ui.defcardWord = null;
  }

  /** Where the selection is on screen ({top, bottom}), or null. */
  function selectionSpan() {
    const range = selectionRangeInBook();
    const box = range?.getBoundingClientRect();
    return box?.height ? { top: box.top, bottom: box.bottom } : null;
  }

  /**
   * Shows the definition card for a word. `definition` is plain text from
   * the app's dictionary, or empty when the word isn't in it.
   * `fromSelection`: shown because the word was selected; the card closes
   * if the selection then grows or changes. `near`: where the word is on
   * screen ({top, bottom}); the selection's place by default. The card sits
   * at the foot of the screen, or at the top when the word is in the lower
   * half, so it never covers the word (the page isn't scrolled for it).
   */
  function showDefinition(
    word,
    definition,
    { fromSelection = false, near = selectionSpan() } = {}
  ) {
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
    if (near && (near.top + near.bottom) / 2 > window.innerHeight / 2) {
      card.classList.add("rui-defcard-top");
    }
    const host = document.getElementById("outerContainer") || document.body;
    host.append(card);
    ui.defcard = card;
    ui.defcardWord = fromSelection ? word.toLowerCase() : null;
    // A card at the foot takes room the selection bar may have used.
    const range = !ui.selbar?.hidden && selectionRangeInBook();
    if (range) {
      requestAnimationFrame(() => positionSelectionBar(range));
    }
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
    wholeWordSelection();
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
        '<label class="rui-option"><span class="rui-option-label">Skip verse numbers</span>' +
        '<input type="checkbox" data-rui="skipNumbers"></label>' +
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

      // Verse numbers ("1.", "2." before each verse of The Buddha and His Dhamma) left
      // out of what is read: the engine's setting (viewer-flexi.js), kept per book.
      const skipNumbers = q("skipNumbers");
      skipNumbers.checked = !!window.skipVerseNumbers?.();
      skipNumbers.addEventListener("change", () => {
        window.setPdfMeta?.({ skipVerseNumbers: skipNumbers.checked });
        const source = document.getElementById("skipVerseNumbers");
        if (source) {
          source.checked = skipNumbers.checked;
        }
        if (isSpeaking()) {
          window.restartCurrentSentence?.();
        }
      });

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

  /**
   * The reader's chosen theme. Light until they choose another, even when
   * the phone is in dark mode; "System" (follow the phone) is a choice too.
   */
  function storedTheme() {
    const theme = storageGet("readerTheme");
    return THEMES.some(t => t.id === theme) ? theme : "light";
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
        { mode: "pdf", label: "Page view", icon: "page" },
        { mode: "text", label: "Text view", icon: "textView" },
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

      // Text size (the "Text view" text; the original page uses zoom)
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

  /** Dots under the words of one page (original page or "Text view"). */
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

  /** "Text view": wrap the page's words in the reflowed text. */
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
    showDefinition(word, wordHelper.data.defs?.[hit.key], {
      near: { top: y, bottom: y },
    });
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
  // Save for later
  // ---------------------------------------------------------------------

  // The dock's Save keeps this page (with the selected passage, if any) for
  // later; the app lists saved pages on its home page and with bookmarks.
  // Saving needs no account: the app keeps them on the device until the
  // reader signs in. See window.savePage in viewer-flexi.js.

  const SAVE_NUDGE_MS = 40000;

  function chapterTitle(page) {
    return cleanTitle(outlinePath(page).at(-1)?.title) || bookLabel();
  }

  function selectedPassage() {
    restoreSelection();
    if (!selectionRangeInBook()) {
      return "";
    }
    wholeWordSelection(); // Save keeps the passage with its words whole
    return selectedText();
  }

  /** Puts a saved entry back exactly as it was (for Undo). */
  function restoreSavedPage(entry) {
    window.parent.postMessage({ type: "saveHighlight", payload: entry }, "*");
    window.addHighlights?.([entry]);
  }

  function toggleSavedPage() {
    const page = currentPage();
    const before = window.findSavedPage?.(page);
    // "Saved": a tap takes the page out of Saved for later (owner,
    // 2026-11-21), even with a passage selected.
    if (before) {
      window.removeHighlight?.(before.id);
      toast("Removed from Saved for later.", {
        actionLabel: "Undo",
        timeout: 6000,
        onAction: () => restoreSavedPage(before),
      });
    } else {
      const saved = window.savePage?.(page, {
        chapter: chapterTitle(page),
        passage: selectedPassage(),
      });
      if (!saved) {
        toast("This page can't be saved.");
        return;
      }
      hideSelectionBar();
      window.getSelection()?.removeAllRanges();
      toast("Saved for later. You'll find it on the home page.", {
        actionLabel: "Undo",
        timeout: 6000,
        onAction: () => window.removeHighlight?.(saved.id),
      });
    }
    refreshPressedStates();
  }

  /**
   * Someone who opened the reader from a link (the first book opened in
   * this tab) and is still on that page after a while may be short on
   * time: suggest saving it, once.
   */
  function wireSaveNudge() {
    let firstOpen = false;
    try {
      firstOpen = !sessionStorage.getItem("ruiOpened");
      sessionStorage.setItem("ruiOpened", "1");
    } catch {
      return;
    }
    if (!firstOpen) {
      return;
    }
    const startPage = currentPage();
    setTimeout(() => {
      if (
        currentPage() !== startPage ||
        document.hidden ||
        sheetOpen ||
        window.findSavedPage?.(startPage)
      ) {
        return;
      }
      toast("Short on time? Save this page and come back to it later.", {
        actionLabel: "Save",
        timeout: 9000,
        onAction: toggleSavedPage,
      });
    }, SAVE_NUDGE_MS);
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

  function storedItems() {
    // `storedHighlights` is a top-level `let` in viewer-flexi.js; it also
    // holds the pages saved for later (type "later").
    // eslint-disable-next-line no-undef
    return typeof storedHighlights !== "undefined" ? storedHighlights : [];
  }

  function isSavedPage(item) {
    return item?.type === "later";
  }

  /** Pages of this book saved for later, in page order. */
  function bookSavedPages() {
    return storedItems()
      .filter(item => isSavedPage(item) && inThisBook(item))
      .sort((a, b) => a.pageNo - b.pageNo);
  }

  function bookHighlights() {
    return storedItems()
      .filter(item => !isSavedPage(item) && inThisBook(item))
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
    if (panelAllowed()) {
      openPanel(tab);
      return;
    }
    openSheet("Notebook", buildNotebook);
  }

  /** The Notebook's tabs and the selected tab's list (sheet or panel). */
  function buildNotebook(body) {
    body.classList.add("rui-notebook");
    const tabs = el("div", "rui-tabs", {
      role: "tablist",
      "aria-label": "Notebook",
    });
    const tabPanel = el("div", "rui-tabpanel", { role: "tabpanel" });
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
      tabPanel.replaceChildren();
      RENDER_TAB[notebook.tab](tabPanel);
    };
    body.append(tabs, tabPanel);
    select();
  }

  // --- The side panel (wide screens) ---
  //
  // On wide screens the Notebook sits in the left margin instead of a sheet
  // over the page. The page never moves: it stays centred. The panel opens
  // by itself when it fits in the margin without covering the page and then
  // stays while reading; ✕ or the Contents button closes it (remembered on
  // this device). When it would cover the page (narrow window, zoomed in) it
  // floats over the page's edge and hides with the top and bottom bars while
  // reading.

  const PANEL_WIDTH = 340;
  // Narrower windows get the bottom sheet, as on phones.
  const PANEL_MIN_WINDOW = 900;
  const sidePanel = {
    el: null,
    body: null,
    close: null,
    open: false,
    chapter: null,
  };

  function panelAllowed() {
    return window.innerWidth >= PANEL_MIN_WINDOW;
  }

  /** True when the panel fits beside the page without covering it. */
  function panelFits() {
    const view = app()?.pdfViewer?.getPageView(currentPage() - 1);
    if (!view) {
      return false;
    }
    return view.div.getBoundingClientRect().left >= PANEL_WIDTH + 8;
  }

  function buildPanel() {
    sidePanel.el = el("aside", "rui-panel", { "aria-label": "Notebook" });
    const close = el("button", "rui-icon-btn rui-panel-close", {
      type: "button",
      "aria-label": "Close the Notebook",
      title: "Close",
    });
    // Static markup (icon only).
    // eslint-disable-next-line no-unsanitized/property
    close.innerHTML = icon("close");
    close.addEventListener("click", () => closePanel());
    sidePanel.close = close;
    sidePanel.body = el("div", "rui-panel-body");
    sidePanel.el.append(sidePanel.body);
    sidePanel.el.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closePanel();
      }
    });
    (document.getElementById("outerContainer") || document.body).append(
      sidePanel.el
    );
  }

  function openPanel(tab = notebook.tab) {
    notebook.tab = tab;
    if (!sidePanel.el) {
      buildPanel();
    }
    storageSet("ruiPanel", "open");
    sidePanel.open = true;
    renderPanel();
    placePanel();
    refreshPressedStates();
  }

  /** Closes the panel; it stays closed (on this device) until reopened. */
  function closePanel() {
    storageSet("ruiPanel", "closed");
    sidePanel.open = false;
    placePanel();
    refreshPressedStates();
  }

  function renderPanel({ keepScroll = false } = {}) {
    if (!sidePanel.open) {
      return;
    }
    const scrollTop = sidePanel.body.scrollTop;
    sidePanel.body.replaceChildren();
    buildNotebook(sidePanel.body);
    // The tabs and the close button share a header row, so the button never
    // covers a tab (the tabs scroll sideways in what's left when they don't
    // fit).
    const tabs = sidePanel.body.querySelector(".rui-tabs");
    const head = el("div", "rui-panel-head");
    tabs.replaceWith(head);
    head.append(tabs, sidePanel.close);
    if (keepScroll) {
      sidePanel.body.scrollTop = scrollTop;
    }
    sidePanel.chapter = outlinePath(currentPage()).at(-1) || null;
  }

  /**
   * Shows the panel where it belongs: in the margin, over the page's edge
   * ("rui-panel-over") when the margin is too narrow, or not at all in a
   * narrow window. Opens it by itself when it fits and wasn't closed.
   */
  function placePanel() {
    const root = document.documentElement;
    if (
      !sidePanel.open &&
      panelAllowed() &&
      storageGet("ruiPanel") !== "closed" &&
      panelFits()
    ) {
      openPanel(notebook.tab);
      return;
    }
    const shown = sidePanel.open && panelAllowed();
    root.classList.toggle("rui-panel-open", shown);
    root.classList.toggle("rui-panel-over", shown && !panelFits());
  }

  /** Keeps the open panel current without fighting the reader's scrolling. */
  function refreshPanel(reason) {
    if (!sidePanel.open) {
      return;
    }
    // Don't redraw under someone typing in the chapter filter.
    if (sidePanel.el.contains(document.activeElement)) {
      if (document.activeElement.tagName === "INPUT") {
        return;
      }
    }
    if (reason === "page") {
      const chapter = outlinePath(currentPage()).at(-1) || null;
      const redraw =
        (notebook.tab === "contents" && chapter !== sidePanel.chapter) ||
        (notebook.tab === "notes" && notebook.noteScope === "page");
      if (!redraw) {
        return;
      }
    }
    renderPanel({ keepScroll: reason !== "page" });
  }

  function wirePanel(a) {
    let timer = null;
    const place = () => {
      clearTimeout(timer);
      timer = setTimeout(placePanel, 60);
    };
    a.eventBus._on("updateviewarea", place);
    a.eventBus._on("pagerendered", place);
    window.addEventListener("resize", place);
    a.eventBus._on("pagechanging", () => refreshPanel("page"));
    document.addEventListener("baws:highlightschange", () =>
      refreshPanel("data")
    );
    placePanel();
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

  function renderSavedPages(panel) {
    const saved = bookSavedPages();
    if (!saved.length) {
      return;
    }
    const list = el("div", "rui-cards rui-saved-pages");
    for (const entry of saved) {
      const card = el("article", "rui-card rui-card-saved");
      const open = el("button", "rui-card-main", { type: "button" });
      const meta = el("span", "rui-card-meta");
      meta.textContent = [entry.chapter, `Page ${entry.pageNo}`]
        .filter(Boolean)
        .join(" · ");
      const quote = el("span", "rui-card-quote");
      quote.textContent = (entry.text || "").startsWith("Saved for later · ")
        ? "Saved for later"
        : entry.text;
      open.append(meta, quote);
      open.addEventListener("click", () => {
        goToPage(entry.pageNo);
        closeSheet();
      });
      const remove = el("button", "rui-icon-btn rui-card-action", {
        type: "button",
        "aria-label": "Remove from Saved for later",
        title: "Remove from Saved for later",
      });
      // Static markup (icons and fixed labels only).
      // eslint-disable-next-line no-unsanitized/property
      remove.innerHTML = icon("trash");
      remove.addEventListener("click", () => {
        window.removeHighlight?.(entry.id);
        refreshPressedStates();
        panel.replaceChildren();
        renderHighlights(panel);
        toast("Removed from Saved for later.", {
          actionLabel: "Undo",
          timeout: 6000,
          onAction: () => {
            restoreSavedPage(entry);
            refreshPressedStates();
            if (panel.isConnected) {
              panel.replaceChildren();
              renderHighlights(panel);
            }
          },
        });
      });
      card.append(open, remove);
      list.append(card);
    }
    panel.append(sectionTitle("Saved for later"), list);
  }

  function renderHighlights(panel) {
    renderSavedPages(panel);
    if (bookSavedPages().length) {
      panel.append(sectionTitle("Highlights"));
    }
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
    refreshPanel("data");
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
  // Welcome, tour and tips
  // ---------------------------------------------------------------------
  //
  // The new reader explains itself, so this stays light: a welcome card on
  // the first book, an optional four-step tour of the things that aren't
  // obvious (highlighting, harder-word underlines, the More tools, Listen and
  // Save) where each step asks you to try it, and a few one-time tips at the
  // moment they help. More → Tour replays the tour.

  const TIP_AFTER_PAGES = 10;
  const tour = {
    spot: null,
    card: null,
    cleanup: null,
    steps: [],
    index: 0,
    view: null,
  };

  function touchScreen() {
    return matchMedia("(pointer: coarse)").matches;
  }

  /** The part of the current page that is on screen. */
  function visiblePageRect() {
    const view = app()?.pdfViewer?.getPageView(currentPage() - 1);
    const rect = view?.div.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    const top = Math.max(rect.top, ui.top.offsetHeight);
    const bottom = Math.min(
      rect.bottom,
      window.innerHeight - ui.bottom.offsetHeight
    );
    const left = Math.max(rect.left, 0);
    const right = Math.min(rect.right, window.innerWidth);
    return { left, top, width: right - left, height: bottom - top };
  }

  function rectOf(target) {
    if (!target) {
      return null;
    }
    if (Array.isArray(target)) {
      const rects = target
        .filter(Boolean)
        .map(item => item.getBoundingClientRect());
      if (!rects.length) {
        return null;
      }
      const left = Math.min(...rects.map(r => r.left));
      const top = Math.min(...rects.map(r => r.top));
      const right = Math.max(...rects.map(r => r.right));
      const bottom = Math.max(...rects.map(r => r.bottom));
      return { left, top, width: right - left, height: bottom - top };
    }
    return target instanceof Element ? target.getBoundingClientRect() : target;
  }

  /**
   * Shows one card of the welcome/tour, with a spotlight on its target (the
   * rest of the screen dimmed, but everything still usable).
   * @param {Object} view
   * @param {function} [view.target] - returns an element, elements or a rect
   * @param {string} view.title
   * @param {string|Array<string|{icon: string, name: string}>} view.text -
   *   text, or text with toolbar icons in it (drawn as on the toolbar)
   * @param {string} [view.step] - e.g. "1 of 4"
   * @param {string} [view.place] - "top" or "bottom"; else near the target
   * @param {Array<Object>} view.actions - {label, run, primary}
   */
  function showTourCard(view) {
    tour.view = view;
    if (!tour.card) {
      const host = document.getElementById("outerContainer") || document.body;
      tour.spot = el("div", "rui-tour-spot", { "aria-hidden": "true" });
      tour.card = el("div", "rui-tour-card", { role: "dialog" });
      tour.card.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          event.stopPropagation();
          endTour();
        }
      });
      host.append(tour.spot, tour.card);
      window.addEventListener("resize", placeTourCard);
    }
    const card = tour.card;
    card.setAttribute("aria-label", view.title);
    const title = el("h2", "rui-tour-title");
    title.textContent = view.title;
    const text = el("p", "rui-tour-text");
    for (const part of [view.text].flat()) {
      if (typeof part === "string") {
        text.append(part);
        continue;
      }
      // A toolbar icon, as on its button; its name for screen readers.
      const glyph = el("span", "rui-tour-icon");
      // Static markup (icons only).
      // eslint-disable-next-line no-unsanitized/property
      glyph.innerHTML = icon(part.icon);
      const name = el("span", "rui-visually-hidden");
      name.textContent = part.name;
      glyph.append(name);
      text.append(glyph);
    }
    const row = el("div", "rui-tour-actions");
    if (view.step) {
      const step = el("span", "rui-tour-step");
      step.textContent = view.step;
      row.append(step);
    }
    for (const action of view.actions) {
      const button = el(
        "button",
        action.primary ? "rui-primary rui-tour-btn" : "rui-tour-link",
        { type: "button" }
      );
      button.textContent = action.label;
      button.addEventListener("click", action.run);
      row.append(button);
    }
    card.classList.toggle("rui-tour-stacked", !!view.stacked);
    card.replaceChildren(title, text, row);
    placeTourCard();
    requestAnimationFrame(() =>
      card.querySelector(".rui-primary")?.focus({ preventScroll: true })
    );
  }

  function placeTourCard() {
    const view = tour.view;
    if (!view || !tour.card) {
      return;
    }
    const pad = 6;
    const margin = 12;
    const rect = rectOf(view.target?.());
    const spot = tour.spot.style;
    if (rect && rect.width > 0 && rect.height > 0) {
      spot.left = `${rect.left - pad}px`;
      spot.top = `${rect.top - pad}px`;
      spot.width = `${rect.width + 2 * pad}px`;
      spot.height = `${rect.height + 2 * pad}px`;
    } else {
      // No target: dim everything around a point in the middle.
      spot.left = `${window.innerWidth / 2}px`;
      spot.top = `${window.innerHeight / 2}px`;
      spot.width = spot.height = "0px";
    }
    const card = tour.card;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    let top;
    let left = (window.innerWidth - width) / 2;
    const besideRect =
      view.place === "top" &&
      rect &&
      window.innerWidth - (rect.left + rect.width) >= width + 2 * margin;
    if (besideRect) {
      // Wide screens: in the margin beside the page, covering no text.
      top = rect.top + margin;
      left = rect.left + rect.width + pad + margin;
    } else if (view.place === "top") {
      top = ui.top.offsetHeight + margin;
    } else if (view.place === "bottom") {
      top = window.innerHeight - ui.bottom.offsetHeight - height - margin;
    } else if (rect && rect.width > 0) {
      const below = rect.top + rect.height + pad + margin;
      const above = rect.top - pad - margin - height;
      top =
        below + height <= window.innerHeight - margin
          ? below
          : Math.max(above, margin);
      left = rect.left + rect.width / 2 - width / 2;
    } else {
      top = (window.innerHeight - height) / 2;
    }
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;
  }

  function endTour() {
    tour.cleanup?.();
    tour.cleanup = null;
    tour.view = null;
    tour.spot?.remove();
    tour.card?.remove();
    tour.spot = tour.card = null;
    window.removeEventListener("resize", placeTourCard);
  }

  function tourActive() {
    return !!tour.view;
  }

  // --- Welcome ---

  function maybeWelcome() {
    if (storageGet("ruiWelcomeSeen")) {
      return;
    }
    storageSet("ruiWelcomeSeen", "1");
    storageSet("ruiHintShown", "1"); // the welcome replaces the old hint
    showTourCard({
      title: "Welcome to the new reader",
      text: touchScreen()
        ? "Tap the page to show or hide the controls. Swipe to turn pages. " +
          "Select any text to highlight it, look up a word or share it."
        : "Click the page to show or hide the controls. Use ← → to turn " +
          "pages. Select any text to highlight it, look up a word or share " +
          "it.",
      stacked: true,
      actions: [
        {
          label: `Show me ${tourSteps().length} hidden things`,
          primary: true,
          run: startTour,
        },
        { label: "Start reading", run: endTour },
      ],
    });
  }

  // --- The tour ---

  function startTour() {
    endTour();
    closeSheet(true);
    closeDefinition();
    tour.steps = tourSteps();
    tour.index = 0;
    showTourStep();
  }

  /** The steps for this book: Translate only where the maps can be had. */
  function tourSteps() {
    return TOUR_STEPS.filter(
      step => step !== translateStepEntry || !!edition.base
    );
  }

  /** "2 of 5" */
  function tourStepLabel() {
    return `${tour.index + 1} of ${tour.steps.length}`;
  }

  function nextTourStep() {
    tour.cleanup?.();
    tour.cleanup = null;
    // Don't leave step 1's selection (and its bar) behind.
    window.getSelection()?.removeAllRanges();
    hideSelectionBar();
    tour.index++;
    showTourStep();
  }

  function showTourStep() {
    const step = tour.steps[tour.index];
    if (!step) {
      endTour();
      return;
    }
    setChromeHidden(false);
    step();
  }

  const TOUR_STEPS = [
    // 1. Highlighting: wait until something is selected, then show the bar.
    () => {
      showTourCard({
        step: tourStepLabel(),
        title: "Highlight a passage",
        text: touchScreen()
          ? "Try it: press and hold a word on the page, then drag to select " +
            "a sentence."
          : "Try it: drag across a sentence on the page to select it.",
        target: visiblePageRect,
        place: "top",
        actions: [
          { label: "Skip tour", run: endTour },
          { label: "Next", primary: true, run: nextTourStep },
        ],
      });
      const timer = setInterval(() => {
        if (ui.selbar && !ui.selbar.hidden) {
          clearInterval(timer);
          showSelectionStep();
        }
      }, 250);
      tour.cleanup = () => clearInterval(timer);
    },
    // 2. Harder words (books with word data), else the display settings.
    () => {
      const words = !!wordHelper.url;
      const buttons = [{ label: "Skip tour", run: endTour }];
      if (words && !wordHelperOn()) {
        buttons.push({
          label: "Turn on now",
          run: () => {
            setWordHelper(true);
            nextTourStep();
          },
        });
      }
      buttons.push({ label: "Next", primary: true, run: nextTourStep });
      showTourCard({
        step: tourStepLabel(),
        title: words ? "Harder words, underlined" : "Make it easier to read",
        text: words
          ? "Aa can underline the harder words on every page; tap one to " +
            "see its meaning. Aa also has night and sepia, text size and " +
            "Text view."
          : "Aa has night and sepia, text size, and Text view: the page as " +
            "text that fits your screen.",
        target: () => document.getElementById("ruiDisplay"),
        actions: buttons,
      });
    },
    // 3. The More tools.
    () => {
      showTourCard({
        step: tourStepLabel(),
        title: "More tools",
        text:
          "More has Fullscreen, Go to page, the Notebook, and sharing this " +
          "page as an image or a QR code." +
          (touchScreen()
            ? " Fullscreen also keeps the screen awake while listening."
            : ""),
        target: () => document.getElementById("ruiMore"),
        actions: [
          { label: "Skip tour", run: endTour },
          { label: "Next", primary: true, run: nextTourStep },
        ],
      });
    },
    // 4. Translate (books with an edition in the other language).
    () => translateTourStep(),
    // 5. Listen and Save.
    () => {
      showTourCard({
        step: tourStepLabel(),
        title: "Listen and Save",
        text:
          "Listen reads the book aloud, page after page. Save keeps this " +
          "page for later: you'll find it on the home page.",
        target: () => [
          document.getElementById("voiceButton"),
          document.getElementById("ruiSavePage"),
        ],
        actions: [{ label: "Done", primary: true, run: endTour }],
      });
    },
  ];
  // The Translate step's entry, so tourSteps() can leave it out.
  const translateStepEntry = TOUR_STEPS[3];

  /**
   * Translate: on a page with a counterpart, the spotlight is on the button;
   * elsewhere the button isn't there, so the text shows what it looks like.
   */
  function translateTourStep() {
    const lang = EDITION_LANGS[otherLanguage()];
    const button = document.getElementById("ruiTranslate");
    const how =
      "tap it to mark the passages on the page, then tap one to read it " +
      `in ${lang}.` +
      (newTabsPossible()
        ? " Long press a passage to open it in a new tab or window."
        : "");
    showTourCard({
      step: tourStepLabel(),
      title: `Read it in ${lang}`,
      text: button
        ? `Translate opens this passage in the ${lang} edition: ${how}`
        : [
            `On pages that are also in the ${lang} edition, `,
            { icon: "translate", name: "Translate" },
            ` appears at the top right: ${how}`,
          ],
      target: button ? () => document.getElementById("ruiTranslate") : null,
      actions: [
        { label: "Skip tour", run: endTour },
        { label: "Next", primary: true, run: nextTourStep },
      ],
    });
  }

  /** Step 1, second half: point at the colours once text is selected. */
  function showSelectionStep() {
    const textView = window.VIEW_MODE === "text";
    showTourCard({
      step: tourStepLabel(),
      title: textView ? "Define, Share or Copy" : "Tap a colour to highlight",
      text: textView
        ? "Save (below) keeps this page with the passage you selected. " +
          "Highlighting is in Page view."
        : "Define, Share and Copy are here too. Your highlights are kept in " +
          "the Notebook (Contents).",
      target: () => ui.selbar,
      // Away from the selection and its bar.
      place:
        ui.selbar.getBoundingClientRect().top > window.innerHeight / 2
          ? "top"
          : "bottom",
      actions: [
        { label: "Skip tour", run: endTour },
        { label: "Next", primary: true, run: nextTourStep },
      ],
    });
    // Follow the bar while the selection changes; move on after a highlight.
    const timer = setInterval(placeTourCard, 300);
    const onHighlight = () => setTimeout(nextTourStep, 600);
    document.addEventListener("baws:highlightschange", onHighlight, {
      once: true,
    });
    tour.cleanup = () => {
      clearInterval(timer);
      document.removeEventListener("baws:highlightschange", onHighlight);
    };
  }

  // --- One-time tips ---

  function tipOnce(key, message, options = {}) {
    if (storageGet(key) || tourActive() || sheetOpen) {
      return false;
    }
    storageSet(key, "1");
    toast(message, { timeout: 8000, ...options });
    return true;
  }

  function wireTips(a) {
    a.eventBus._on("pagechanging", () => {
      const turns = (parseInt(storageGet("ruiPageTurns"), 10) || 0) + 1;
      storageSet("ruiPageTurns", String(turns));
      if (turns < TIP_AFTER_PAGES || !storageGet("ruiWelcomeSeen")) {
        return;
      }
      // One tip at a time.
      if (!storageGet("ruiSelectedOnce")) {
        tipOnce(
          "ruiTipSelect",
          "Tip: select any sentence to highlight it or look up a word."
        );
        return;
      }
      if (wordHelper.url && !wordHelperOn()) {
        tipOnce(
          "ruiTipWords",
          "Underline the harder words? Tap one to see its meaning.",
          { actionLabel: "Turn on", onAction: () => setWordHelper(true) }
        );
      }
    });
    document.addEventListener("baws:speakingchange", () => {
      if (isSpeaking() && touchScreen() && !window.flexi_isFullscreen) {
        tipOnce(
          "ruiTipFullscreen",
          "Tip: fullscreen keeps the screen awake while listening.",
          { actionLabel: "Fullscreen", onAction: () => window.fullScreen?.() }
        );
      }
    });
  }

  // ---------------------------------------------------------------------
  // Citation
  // ---------------------------------------------------------------------
  //
  // "Citation" (More → Misc) shows the current page cited in a few styles
  // and copies the one chosen. The citations come from the app, which knows
  // the books (editions, editors, printed page numbers):
  //
  //   window.parent.getCitation({ language, bookName, pdfPage, titles, url })
  //     → [{ id, label, parts, note }]
  //
  // `titles` is the outline path of the page (work first, chapter last);
  // `parts` are strings and { text, em: true } pieces (italics); `note` says
  // what's left to fill in, if anything. Without it there's no Citation.

  function citationSource() {
    try {
      const get = window.parent !== window && window.parent.getCitation;
      return typeof get === "function" ? get : null;
    } catch {
      return null; // a parent on another origin
    }
  }

  function citationsForPage() {
    const get = citationSource();
    const data = window.getBookUrlData?.();
    if (!get || !data) {
      return [];
    }
    const pdfPage = currentPage();
    try {
      const styles = get({
        language: data.language,
        bookName: data.bookName,
        pdfPage,
        titles: outlinePath(pdfPage).map(node => cleanTitle(node.title)),
        url: shortPageUrl(),
      });
      return Array.isArray(styles)
        ? styles.filter(s => s?.id && Array.isArray(s.parts))
        : [];
    } catch (ex) {
      console.error("getCitation failed:", ex);
      return [];
    }
  }

  const citationText = parts =>
    parts.map(part => (typeof part === "string" ? part : part.text)).join("");

  function citationHtml(parts) {
    const escape = text =>
      String(text).replaceAll(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
    return parts
      .map(part => {
        if (typeof part === "string") {
          return escape(part);
        }
        return part.em ? `<i>${escape(part.text)}</i>` : escape(part.text);
      })
      .join("");
  }

  /** Copies as plain text and as HTML (so italics survive a paste). */
  async function copyCitation(parts) {
    const text = citationText(parts);
    try {
      if (window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "text/html": new Blob([citationHtml(parts)], {
              type: "text/html",
            }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch {
      return false;
    }
  }

  function openCitationSheet() {
    const styles = citationsForPage();
    if (!styles.length) {
      toast("Citations aren't available for this book.");
      return;
    }
    let style = storageGet("ruiCiteStyle");
    if (!styles.some(s => s.id === style)) {
      style = styles[0].id;
    }
    openSheet("Cite this page", body => {
      body.classList.add("rui-cite");
      const picker = el("div", "rui-segmented", {
        role: "group",
        "aria-label": "Citation style",
      });
      const preview = el("p", "rui-cite-text", { "aria-live": "polite" });
      const note = el("p", "rui-cite-note");
      const copy = el("button", "rui-primary rui-cite-copy", {
        type: "button",
      });
      copy.textContent = "Copy citation";
      const current = () => styles.find(s => s.id === style);
      const show = () => {
        for (const button of picker.children) {
          button.setAttribute("aria-pressed", String(button.value === style));
        }
        const { parts, note: todo } = current();
        preview.replaceChildren(
          ...parts.map(part => {
            if (typeof part === "string") {
              return document.createTextNode(part);
            }
            const node = el(part.em ? "i" : "span");
            node.textContent = part.text;
            return node;
          })
        );
        note.textContent = todo || "";
        note.hidden = !todo;
      };
      for (const { id, label } of styles) {
        const button = el("button", "", { type: "button", value: id });
        button.textContent = label || id;
        button.addEventListener("click", () => {
          style = id;
          storageSet("ruiCiteStyle", id);
          show();
        });
        picker.append(button);
      }
      copy.addEventListener("click", async () => {
        const ok = await copyCitation(current().parts);
        toast(ok ? "Citation copied." : "Couldn't copy the citation.");
        if (ok) {
          closeSheet();
        }
      });
      body.append(picker, preview, note, copy);
      show();
    });
  }

  // ---------------------------------------------------------------------
  // Print pages
  // ---------------------------------------------------------------------
  //
  // "Print" (More → Share) prints this page, the next five or the rest of
  // the chapter (all of it), each on its own sheet and drawn
  // afresh from the PDF at print resolution, so nothing on screen comes
  // along (no word underlines, no controls). Optionally each page gets its
  // QR code (as in the share image) and the reader's highlights. The pages
  // go into a hidden frame that is printed on its own; the print dialog
  // offers two-sided printing.

  const PRINT_SCALE = 3; // 216 dpi
  const PRINT_MAX_PAGES = 20; // "N pages from here"; a chapter has no limit
  const PRINT_NEXT = 5;
  // Highlight colours on paper (as on screen, a little stronger).
  const PRINT_HIGHLIGHTS = {
    yellow: "rgb(255 236 64 / 0.6)",
    blue: "rgb(96 150 235 / 0.4)",
    green: "rgb(100 190 105 / 0.4)",
    pink: "rgb(236 120 170 / 0.4)",
  };

  function inNativeApp() {
    try {
      return window.parent !== window && !!window.parent.isNativeApp;
    } catch {
      return false;
    }
  }

  /**
   * The pages to print: "this" page, `count` pages from here ("pages"), or
   * the whole rest of the chapter ("chapter"); `count` is at most
   * PRINT_MAX_PAGES.
   */
  function printRange(choice, count = PRINT_NEXT) {
    const first = currentPage();
    let last = first;
    if (choice === "pages") {
      last = first + Math.min(count, PRINT_MAX_PAGES) - 1;
    } else if (choice === "chapter") {
      const end = outlinePath(first).at(-1)?.end;
      last = end >= first ? end : first;
    }
    last = Math.min(last, pagesCount());
    return { first, last };
  }

  function openPrintSheet() {
    let choice = "this";
    let count = PRINT_NEXT;
    let withQr = storageGet("ruiPrintQr") !== "0";
    let withHighlights = storageGet("ruiPrintHighlights") !== "0";
    const page = currentPage();
    const chapterEnd = outlinePath(page).at(-1)?.end;
    const chapterLeft = chapterEnd > page ? chapterEnd - page + 1 : 0;
    openSheet("Print pages", body => {
      body.classList.add("rui-print");
      const options = el("div", "rui-print-options", {
        role: "radiogroup",
        "aria-label": "Pages to print",
      });
      const summary = el("p", "rui-print-summary");

      const radios = [];
      const addOption = (id, build, disabled = false) => {
        const label = el("label", "rui-print-option");
        const radio = el("input", "", {
          type: "radio",
          name: "ruiPrintPages",
          value: id,
        });
        radio.checked = id === choice;
        radio.disabled = disabled;
        radio.addEventListener("change", () => {
          choice = id;
          show();
        });
        label.append(radio, ...build());
        label.classList.toggle("rui-disabled", disabled);
        options.append(label);
        radios.push(radio);
        return radio;
      };

      addOption("this", () => ["This page"]);
      const number = el("input", "rui-input rui-print-count", {
        type: "number",
        inputmode: "numeric",
        min: "1",
        max: String(PRINT_MAX_PAGES),
        "aria-label": "Number of pages",
      });
      number.value = String(count);
      const pagesRadio = addOption("pages", () => [number, " pages from here"]);
      // Typing a number chooses this option.
      number.addEventListener("input", () => {
        const n = parseInt(number.value, 10);
        if (n >= 1) {
          count = Math.min(n, PRINT_MAX_PAGES);
        }
        choice = "pages";
        pagesRadio.checked = true;
        show();
      });
      number.addEventListener("focus", () => {
        choice = "pages";
        pagesRadio.checked = true;
        show();
      });
      addOption(
        "chapter",
        () => [
          chapterLeft
            ? `Rest of chapter (${chapterLeft} page${
                chapterLeft === 1 ? "" : "s"
              })`
            : "Rest of chapter (this is its last page)",
        ],
        !chapterLeft
      );

      const show = () => {
        const { first, last } = printRange(choice, count);
        const sheets = last - first + 1;
        let text = first === last ? `Page ${first}` : `Pages ${first}–${last}`;
        text += ` · ${sheets} sheet${sheets === 1 ? "" : "s"}`;
        if (choice === "pages" && first + count - 1 > pagesCount()) {
          text += " (to the end of the book)";
        }
        summary.textContent = text;
      };

      const toggles = el("div", "rui-toggles");
      toggles.append(
        makeSwitch("QR code on each page", withQr, on => {
          withQr = on;
          storageSet("ruiPrintQr", on ? "1" : "0");
        }),
        makeSwitch("Keep my highlights", withHighlights, on => {
          withHighlights = on;
          storageSet("ruiPrintHighlights", on ? "1" : "0");
        })
      );
      const tip = el("p", "rui-print-tip");
      tip.textContent =
        "To save paper, choose two-sided printing in the print dialog.";
      const go = el("button", "rui-primary rui-print-go", { type: "button" });
      go.textContent = "Print";
      go.addEventListener("click", async () => {
        const { first, last } = printRange(choice, count);
        go.disabled = true;
        const ok = await printPages(first, last, {
          withQr,
          withHighlights,
          onProgress: (done, total) => {
            go.textContent =
              total > 1 ? `Preparing ${done} of ${total}…` : "Preparing…";
          },
        });
        if (ok) {
          closeSheet();
        } else {
          go.disabled = false;
          go.textContent = "Print";
        }
      });
      body.append(options, summary, toggles, tip, go);
      show();
    });
  }

  /** One page as a print-ready image (a blob URL), or null. */
  // Share: `qrUrl` (the shared link in the QR code), `marks` (the shared
  // passage: {left, top, width, height} page fractions, highlighted as the
  // selection is) and a smaller `scale`.
  async function printPageImage(
    pageNumber,
    { withQr, withHighlights, qrUrl, marks = [], scale = PRINT_SCALE }
  ) {
    const pdf = app().pdfDocument;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // The QR code loads its logo over the network: start it first.
    const qrSize = Math.round(canvas.height * 0.07);
    const qrData =
      withQr && window.getQRCode
        ? Promise.race([
            window
              .getQRCode(qrUrl || shortPageUrl(pageNumber), qrSize)
              .getRawData("png"),
            new Promise(resolve => {
              setTimeout(resolve, 3000, null); // print without it
            }),
          ]).catch(() => null)
        : null;
    await page.render({ canvasContext: ctx, viewport, intent: "print" })
      .promise;

    if (marks.length) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgb(255, 240, 0)";
      for (const mark of marks) {
        ctx.fillRect(
          mark.left * canvas.width,
          mark.top * canvas.height,
          mark.width * canvas.width,
          mark.height * canvas.height
        );
      }
      ctx.globalCompositeOperation = "source-over";
    }

    if (withHighlights) {
      // "multiply" tints like a highlighter pen and keeps the text readable.
      ctx.globalCompositeOperation = "multiply";
      for (const highlight of bookHighlights()) {
        if (highlight.pageNo !== pageNumber) {
          continue;
        }
        ctx.fillStyle = PRINT_HIGHLIGHTS[highlightColor(highlight)];
        for (const r of highlight.rects || []) {
          ctx.fillRect(
            (r.leftPercent / 100) * canvas.width,
            (r.topPercent / 100) * canvas.height,
            (r.widthPercent / 100) * canvas.width,
            (r.heightPercent / 100) * canvas.height
          );
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    const qrBlob = await qrData;
    if (qrBlob) {
      const qr = await createImageBitmap(qrBlob);
      const margin = Math.round(canvas.height * 0.01);
      ctx.drawImage(
        qr,
        canvas.width - qrSize - margin,
        canvas.height - qrSize - margin,
        qrSize,
        qrSize
      );
    }
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    return blob ? URL.createObjectURL(blob) : null;
  }

  /** Prints pages first..last; false if they couldn't be prepared. */
  async function printPages(first, last, options) {
    const urls = [];
    const count = last - first + 1;
    try {
      for (let n = first; n <= last; n++) {
        options.onProgress?.(n - first + 1, count);
        const url = await printPageImage(n, options);
        if (url) {
          urls.push(url);
        }
      }
    } catch (ex) {
      console.error("Print: couldn't draw a page:", ex);
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      toast("Couldn't prepare the pages for printing.");
      return false;
    }

    document.getElementById("ruiPrintFrame")?.remove();
    const frame = el("iframe", "", {
      id: "ruiPrintFrame",
      title: "Print",
      "aria-hidden": "true",
      tabindex: "-1",
      style:
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;" +
        "visibility:hidden",
    });
    // Each page on its own sheet, as large as fits within the margins.
    frame.srcdoc =
      "<!doctype html><html><head><meta charset=utf-8><style>" +
      "@page{margin:10mm}html,body{margin:0}" +
      ".sheet{height:100vh;display:flex;align-items:center;" +
      "justify-content:center;break-after:page}" +
      ".sheet:last-child{break-after:auto}" +
      "img{max-width:100%;max-height:100%;object-fit:contain}" +
      "</style></head><body></body></html>";
    const cleanUp = () => {
      frame.remove();
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
    frame.addEventListener(
      "load",
      async () => {
        const doc = frame.contentDocument;
        doc.title =
          `${bookLabel()} – ` +
          (first === last ? `page ${first}` : `pages ${first}–${last}`);
        const loads = urls.map(url => {
          const sheet = doc.createElement("div");
          sheet.className = "sheet";
          const img = doc.createElement("img");
          img.alt = "";
          sheet.append(img);
          doc.body.append(sheet);
          const loaded = new Promise(resolve => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
          img.src = url;
          return loaded;
        });
        await Promise.all(loads);
        const win = frame.contentWindow;
        win.addEventListener("afterprint", () => setTimeout(cleanUp, 0), {
          once: true,
        });
        win.focus();
        win.print();
      },
      { once: true }
    );
    document.body.append(frame);
    return true;
  }

  // ---------------------------------------------------------------------
  // Built-in actions
  // ---------------------------------------------------------------------

  /** The baws.in link to a page (default: the current one). */
  function shortPageUrl(page) {
    const data = window.getBookUrlData?.();
    if (!data) {
      return location.href;
    }
    const host =
      location.hostname === "localhost" ? "baws.in" : location.hostname;
    return (
      `https://${host}/books/${data.bookParent}/${data.language}/` +
      `${data.bookName}/pdf/${page || data.pageNo}`
    );
  }

  // ---------------------------------------------------------------------
  // Share
  // ---------------------------------------------------------------------
  //
  // Share (dock, selection bar, More → Page image) opens one sheet (owner,
  // 2026-11-26). With nothing selected it first asks whether to select a
  // passage. Then: what to send (a quote card of the passage, the page
  // image, or only the message and link), "Credit me as the source" for a
  // signed-in reader (on by default; the link names them: ?ref=username),
  // and where to (WhatsApp, Telegram, X, Facebook, LinkedIn, Email, Copy,
  // More = the phone's or browser's own share window). A tip at the foot
  // shows one reader feature.
  //
  // The link opens the page at the passage, in either view: ?y=&y2= are
  // the top and bottom of the selection as fractions of the PDF page's
  // height (a selection in Text view is turned into heights with the PDF's
  // own lines, see pdfRows), plus utm_source (the platform), utm_medium=
  // share, utm_campaign=reader. The app (Book.jsx) gives the signed-in
  // reader (getShareIdentity), sends images and opens other apps in the
  // Android app (shareNative, openExternal).

  const SHARE_CARD = { width: 1080, height: 1350 };
  const SHARE_PAGE_SCALE = 2; // the page image: sharp, and quick on a phone
  const SHARE_QUOTE_MAX = 600; // characters on the quote card
  const SHARE_TEXT_MAX = 1500; // characters of the passage in a message
  const SHARE_SHORT_MAX = 200; // X: the passage in a post
  // Under the book's name: who the book is by. Not "— Dr. Ambedkar" under
  // the passage, which may quote someone else.
  const SHARE_AUTHOR = "By Dr. B. R. Ambedkar";
  const SHARE_TIPS = [
    "Select a passage before sharing: it becomes a quote card, and the link opens right at it.",
    "Highlight in four colours: select text, then tap a colour. Notebook keeps them all.",
    "Save keeps this page on your home page, to come back to later.",
    "Listen reads the book aloud, and keeps going with the screen off in the app.",
    "Translate shows the same passage in the other edition, Hindi or English.",
    "Aa has night and sepia, text size, and Text view for easier reading on a phone.",
    "Citation (More) gives a ready-made reference for this page.",
    "Define: select a single word to see what it means.",
  ];
  const SHARE_PLATFORMS = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      mark: "W",
      color: "#25d366",
      href: m => `https://wa.me/?text=${encodeURIComponent(m.text)}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      mark: "T",
      color: "#229ed9",
      href: m =>
        `https://t.me/share/url?url=${encodeURIComponent(m.link)}` +
        `&text=${encodeURIComponent(m.body)}`,
    },
    {
      id: "x",
      label: "X",
      mark: "X",
      color: "#111111",
      href: m =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(m.short)}` +
        `&url=${encodeURIComponent(m.link)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      mark: "f",
      color: "#1877f2",
      href: m =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          m.link
        )}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      mark: "in",
      color: "#0a66c2",
      href: m =>
        "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent(m.link),
    },
    {
      id: "email",
      label: "Email",
      mark: "@",
      color: "#6b665c",
      href: m =>
        `mailto:?subject=${encodeURIComponent(m.subject)}` +
        `&body=${encodeURIComponent(m.text)}`,
    },
    { id: "copy", label: "Copy", icon: "copy" },
    { id: "more", label: "More", icon: "share" },
  ];

  /** The signed-in reader, from the app: {username} or null. */
  function shareIdentity() {
    try {
      const who =
        window.parent !== window && window.parent.getShareIdentity?.();
      return who?.username ? who : null;
    } catch {
      return null;
    }
  }

  function shareCreditOn() {
    return storageGet("ruiShareCredit") !== "0";
  }

  const clamp01 = value => Math.min(1, Math.max(0, value));
  const round3 = value => String(Math.round(value * 1000) / 1000);

  /** A place (fraction of characters) in Text view's text of a page. */
  function textViewPlace(textView, node, offset) {
    const before = document.createRange();
    before.setStart(textView, 0);
    try {
      before.setEnd(node, offset);
    } catch {
      return null;
    }
    let total = 0;
    let at = null;
    const walker = document.createTreeWalker(textView, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (!text.data.trim()) {
        continue;
      }
      if (at === null) {
        if (text === node) {
          at = total + offset;
        } else if (!before.intersectsNode(text)) {
          at = total;
        }
      }
      total += text.data.length;
    }
    if (!total) {
      return null;
    }
    return clamp01((at ?? total) / total);
  }

  // Letters of a word (and the apostrophes and hyphens inside one).
  const WORD_CHAR = /[\p{L}\p{M}\p{N}'’-]/u;

  /**
   * The range widened to whole words: on a phone a selection often starts or
   * ends inside a word ("ople are" for "people are"). Only a boundary that
   * cuts a word moves (owner, 2026-11-26).
   */
  function snapToWords(selected) {
    const range = selected.cloneRange();
    const start = range.startContainer;
    if (start.nodeType === Node.TEXT_NODE) {
      let i = range.startOffset;
      if (WORD_CHAR.test(start.data[i] || "")) {
        while (i > 0 && WORD_CHAR.test(start.data[i - 1])) {
          i--;
        }
        range.setStart(start, i);
      }
    }
    const end = range.endContainer;
    if (end.nodeType === Node.TEXT_NODE) {
      let j = range.endOffset;
      if (j > 0 && WORD_CHAR.test(end.data[j - 1])) {
        while (j < end.data.length && WORD_CHAR.test(end.data[j])) {
          j++;
        }
        range.setEnd(end, j);
      }
    }
    return range;
  }

  /**
   * The selection to share: {page, text, y, y2} (heights on the PDF page,
   * whichever view it was made in; null if they can't be had), or null.
   * Words cut by the selection's ends are taken whole.
   */
  async function captureSelection() {
    if (!restoreSelection()) {
      return null;
    }
    const selected = selectionRangeInBook();
    const range = selected && snapToWords(selected);
    // The selection's own text (it has the line breaks between the text
    // layer's lines, which a range's text runs together), with the letters
    // the whole words added at either end.
    const added = (node, from, to) => {
      return node.nodeType === Node.TEXT_NODE ? node.data.slice(from, to) : "";
    };
    const text =
      range &&
      (
        added(range.startContainer, range.startOffset, selected.startOffset) +
        window.getSelection().toString() +
        added(range.endContainer, selected.endOffset, range.endOffset)
      )
        .replaceAll(/\s+/g, " ")
        .trim();
    if (!text) {
      return null;
    }
    const start =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement;
    const pageDiv = start?.closest(".page");
    const page = Number(pageDiv?.dataset.pageNumber);
    if (!page) {
      return null;
    }
    const result = {
      page,
      pages: [page],
      text,
      y: null,
      y2: null,
      marks: {}, // page -> the passage's rectangles (page fractions)
    };
    if (window.VIEW_MODE === "text") {
      const textView = pageDiv.querySelector(".textView");
      const from =
        textView &&
        textViewPlace(textView, range.startContainer, range.startOffset);
      if (from !== null && textView) {
        const to = textView.contains(range.endContainer)
          ? textViewPlace(textView, range.endContainer, range.endOffset)
          : 1;
        const rows = await pdfRows(page);
        const heights = passageHeights(rows, text);
        if (heights) {
          Object.assign(result, heights);
        } else if (rows?.length) {
          result.y = placeToHeight(rows, Math.max(0, from - PLACE_SLACK));
          result.y2 = placeToHeight(
            rows,
            Math.min(1, Math.max(from, to ?? from) + PLACE_SLACK),
            true
          );
        }
        // The page image's mark: the PDF's own text between those heights
        // (Text view's text isn't laid out like the page).
        if (result.y !== null && rows?.items) {
          result.marks[page] = rows.items
            .filter(item => {
              const middle = (item.top + item.bottom) / 2;
              return middle >= result.y && middle <= result.y2;
            })
            .map(item => ({
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.bottom - item.top,
            }));
        }
      }
    } else {
      const box = pageDiv.getBoundingClientRect();
      // The selected lines on this page (not the next page's, and not the
      // text layer's page-sized end-of-content block).
      const rects = [...range.getClientRects()].filter(
        r =>
          r.width > 0 &&
          r.height > 0 &&
          r.height < box.height * 0.1 &&
          r.bottom > box.top &&
          r.top < box.bottom
      );
      if (rects.length && box.height) {
        result.y = clamp01(
          (Math.min(...rects.map(r => r.top)) - box.top) / box.height
        );
        result.y2 = clamp01(
          (Math.max(...rects.map(r => r.bottom)) - box.top) / box.height
        );
        result.marks[page] = rects.map(r => ({
          left: (r.left - box.left) / box.width,
          top: (r.top - box.top) / box.height,
          width: r.width / box.width,
          height: r.height / box.height,
        }));
      }
    }
    return result;
  }

  /** The link to share: the page, the passage, the sharer, the platform. */
  function shareLink(page, passage, source, credit) {
    const url = new URL(shortPageUrl(page));
    if (passage?.y !== null && passage?.y !== undefined) {
      url.searchParams.set("y", round3(passage.y));
      if (passage.y2 !== null && passage.y2 > passage.y) {
        url.searchParams.set("y2", round3(passage.y2));
      }
    }
    const who = credit && shareIdentity()?.username;
    if (who) {
      url.searchParams.set("ref", who);
    }
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "reader");
    return url.href;
  }

  function cut(text, max) {
    if (text.length <= max) {
      return text;
    }
    const part = text.slice(0, max);
    const space = part.lastIndexOf(" ");
    return `${(space > max * 0.6 ? part.slice(0, space) : part).trim()}…`;
  }

  /**
   * A contents title as people write it: no leading number ("1 ", "IV. "),
   * and title case for one set in capitals ("CASTES IN INDIA").
   */
  function tidyTitle(title) {
    const text = String(title || "")
      .replace(/^\s*(?:\d+|[IVXLC]+)[.):]?\s+/, "")
      .trim();
    if (!/\p{Lu}/u.test(text) || text !== text.toUpperCase()) {
      return text;
    }
    const small = new Set(["a", "an", "and", "as", "at", "by", "for", "in"]);
    for (const word of ["of", "on", "or", "the", "to", "with"]) {
      small.add(word);
    }
    return text
      .toLowerCase()
      .split(" ")
      .map((word, i) => {
        if (i > 0 && small.has(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  /** Where a page is from: "chapter, book", or the book alone. */
  function shareSource(page) {
    const chapter = tidyTitle(chapterTitle(page));
    const book = bookLabel();
    const same = (a, b) => a.toLowerCase() === b.toLowerCase();
    return chapter && !same(chapter, book) ? `${chapter}, ${book}` : book;
  }

  /** The message for a platform: {link, body, text, short, subject}. */
  function shareMessage(state, source) {
    const page = state.passage?.page || currentPage();
    const link = shareLink(page, state.passage, source, state.credit);
    const where = shareSource(page);
    // The book, not the speaker: a passage may be someone else's words
    // (a letter, a debate) quoted in the book (owner, 2026-11-26).
    let body;
    let short;
    if (state.passage) {
      body =
        `“${cut(state.passage.text, SHARE_TEXT_MAX)}”\n` +
        `— ${where}\n${SHARE_AUTHOR}`;
      short =
        `“${cut(state.passage.text, SHARE_SHORT_MAX)}” ` +
        `— ${cut(where, 80)}`;
    } else {
      body = `${where}\n${SHARE_AUTHOR}`;
      short = `${cut(where, 80)}, ${SHARE_AUTHOR}`;
    }
    return {
      link,
      body,
      short,
      subject: where || "Dr. B.R. Ambedkar's Writings and Speeches",
      text: `${body}\n\nRead it on BAWS: ${link}`,
    };
  }

  // -- A passage over a page break --------------------------------------------
  //
  // A quote often starts or ends on another page, and selecting across the
  // page gap is hard on a phone. The sheet offers (owner, 2026-11-26):
  //  - "Start of the sentence" / "Finish the sentence": the rest of the
  //    sentence, from the page's own text (from the previous or next page
  //    when it runs over), in one tap;
  //  - "Continue on the next page": keeps the passage, moves to the next
  //    page, and the selection made there is added to it (any length).
  // Over two pages, the quote card and the message get all of it, the page
  // image is the page the reader picks, and the link opens where the
  // selection was.

  const SENTENCE_MAX = 600; // characters a sentence may add
  const SENTENCE_END = /[.?!।]+["”’)\]]*(?=\s|$)/gu;
  // Words a full stop follows without ending the sentence.
  const NOT_AN_END = new Set(
    (
      "dr mr mrs ms prof rev hon st sir no nos vol vols pp p ch chap ed eds " +
      "viz cf etc vs art sec cl fig jr sr govt ltd co i.e e.g ibid op cit"
    ).split(" ")
  );
  const pageTextCache = new Map(); // page number -> Promise<string>

  /**
   * A page's running text, from the PDF: without the running head (a first
   * line at the top, set apart by a wider gap) or footnotes (smaller type),
   * with words hyphenated at line ends joined; "" for none.
   */
  function runningText(pageNumber) {
    if (!(pageNumber >= 1 && pageNumber <= pagesCount())) {
      return Promise.resolve("");
    }
    if (!pageTextCache.has(pageNumber)) {
      pageTextCache.set(
        pageNumber,
        (async () => {
          const page = await app().pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const { items } = await page.getTextContent();
          const list = items.map(item => {
            const [, base] = viewport.convertToViewportPoint(
              item.transform[4],
              item.transform[5]
            );
            const height =
              Math.abs(item.height || item.transform[3]) / viewport.height;
            return {
              str: item.str,
              eol: item.hasEOL,
              top: base / viewport.height - height,
              height,
            };
          });
          const words = list.filter(item => item.str.trim());
          if (!words.length) {
            return "";
          }
          // The body's type size: the one most characters are set in.
          const sizes = new Map();
          for (const { height, str } of words) {
            const key = Math.round(height * 2000);
            sizes.set(key, (sizes.get(key) || 0) + str.length);
          }
          const body = [...sizes].sort((a, b) => b[1] - a[1])[0][0] / 2000;
          const lines = [
            ...new Set(words.map(w => Math.round(w.top * 500) / 500)),
          ].sort((a, b) => a - b);
          let headFoot = -1;
          if (lines.length > 3) {
            const gaps = lines
              .slice(1)
              .map((top, i) => top - lines[i])
              .sort((a, b) => a - b);
            const usual = gaps[Math.floor(gaps.length / 2)];
            if (lines[0] < 0.12 && lines[1] - lines[0] > usual * 1.25) {
              headFoot = lines[0] + usual * 0.5;
            }
          }
          let text = "";
          for (const item of list) {
            const blank = !item.str.trim();
            if (blank || (item.height >= body * 0.85 && item.top > headFoot)) {
              text += item.str;
              // A line ending in a dash runs on without a space.
              if (item.eol && !/[–—]$/.test(item.str)) {
                text += " ";
              }
            }
          }
          return text
            .replaceAll(/(\p{L})[-­‐]\s+(\p{Ll})/gu, "$1$2")
            .replaceAll(/\s+/g, " ")
            .trim();
        })().catch(() => "")
      );
    }
    return pageTextCache.get(pageNumber);
  }

  /** Where a passage is in a page's text: {start, end} offsets, or null. */
  function locateIn(text, passageText) {
    let hay = "";
    const at = [];
    for (let i = 0; i < text.length; i++) {
      if (LETTER.test(text[i])) {
        hay += text[i].toLowerCase();
        at.push(i);
      }
    }
    const found = findLetters(hay, lettersOnly(passageText));
    return found ? { start: at[found.first], end: at[found.last] + 1 } : null;
  }

  /** Is this full stop (etc.) at `index` the end of a sentence? */
  function endsHere(text, index, mark) {
    if (!mark.startsWith(".")) {
      return true;
    }
    const word = /([\p{L}.]+)$/u.exec(text.slice(0, index))?.[1] || "";
    const bare = word.toLowerCase().replace(/\.$/, "");
    // Initials ("B. R."), abbreviations ("Dr.", "viz.").
    return !(word.length === 1 || NOT_AN_END.has(bare));
  }

  /** Just after the end of the sentence running at `from`; -1: none. */
  function sentenceEndAfter(text, from) {
    const re = new RegExp(SENTENCE_END.source, "gu");
    re.lastIndex = from;
    for (let match; (match = re.exec(text)); ) {
      if (endsHere(text, match.index, match[0])) {
        return match.index + match[0].length;
      }
    }
    return -1;
  }

  /** Where the sentence running at `upto` starts; -1: before this text. */
  function sentenceStartBefore(text, upto) {
    const re = new RegExp(SENTENCE_END.source, "gu");
    let start = -1;
    for (let match; (match = re.exec(text)) && match.index < upto; ) {
      const after = match.index + match[0].length;
      if (after <= upto && endsHere(text, match.index, match[0])) {
        start = after;
      }
    }
    if (start < 0) {
      return -1;
    }
    while (start < upto && /\s/.test(text[start])) {
      start++;
    }
    return start;
  }

  const finishesSentence = text => {
    const trimmed = text.trim();
    const match = /[.?!।]+["”’)\]]*$/u.exec(trimmed);
    return !!match && endsHere(trimmed, match.index, match[0]);
  };

  /**
   * What the sheet can add to a passage to make whole sentences:
   * {core, head?: {text, page?}, tail?: {text, page?}} (page: from the
   * previous or next page), or {} when the passage can't be found.
   */
  async function sentenceOffers(passage) {
    const text = await runningText(passage.page);
    const at = text && locateIn(text, passage.text);
    if (!at) {
      return {};
    }
    const offers = { core: text.slice(at.start, at.end) };
    if (!finishesSentence(passage.text)) {
      const end = sentenceEndAfter(text, at.end);
      if (end >= 0) {
        offers.tail = { text: text.slice(at.end, end) };
      } else {
        const next = await runningText(passage.page + 1);
        const nextEnd = next ? sentenceEndAfter(next, 0) : -1;
        if (nextEnd >= 0) {
          offers.tail = {
            text: `${text.slice(at.end)} ${next.slice(0, nextEnd)}`,
            page: passage.page + 1,
          };
        }
      }
    }
    const start = sentenceStartBefore(text, at.start);
    if (start >= 0) {
      offers.head = { text: text.slice(start, at.start) };
    } else {
      const previous = await runningText(passage.page - 1);
      if (!previous || finishesSentence(previous)) {
        offers.head = { text: text.slice(0, at.start) };
      } else {
        const from = sentenceStartBefore(previous, previous.length);
        if (from >= 0) {
          offers.head = {
            text: `${previous.slice(from)} ${text.slice(0, at.start)}`,
            page: passage.page - 1,
          };
        }
      }
    }
    for (const side of ["head", "tail"]) {
      const added = offers[side]?.text.trim();
      if (!added || !LETTER.test(added) || added.length > SENTENCE_MAX) {
        delete offers[side];
      }
    }
    return offers;
  }

  /**
   * The passage as it will be shared: the selection, with the sentence's
   * start and end if asked for, and the pages it is on.
   */
  function sharedPassage(state) {
    const base = state.passage;
    if (!base) {
      return null;
    }
    const { offers = {} } = state;
    const head = state.head && offers.head;
    const tail = state.tail && offers.tail;
    if (!head && !tail) {
      return base;
    }
    const text = `${head ? head.text : ""}${offers.core}${
      tail ? tail.text : ""
    }`
      .replaceAll(/\s+/g, " ")
      .trim();
    const pages = new Set(base.pages || [base.page]);
    for (const part of [head, tail]) {
      if (part?.page) {
        pages.add(part.page);
      }
    }
    return { ...base, text, pages: [...pages].sort((a, b) => a - b) };
  }

  // A passage kept while the reader selects where it ends on the next page
  // ("Continue on the next page"): {passage, dismiss}.
  let continuedQuote = null;

  /**
   * The note while a quote waits for its end: a small bar at the foot (the
   * next part is usually selected at the top of the page, owner 2026-11-26).
   * Hide clears the note and keeps the quote; Discard drops the quote.
   */
  function showContinuedNote() {
    const note = el("div", "rui-quote-note", { role: "status" });
    const text = el("span");
    text.textContent = "Quote continues: select where it ends, then tap Share.";
    const hide = el("button", "", { type: "button" });
    hide.textContent = "Hide";
    const discard = el("button", "", { type: "button" });
    discard.textContent = "Discard";
    note.append(text, hide, discard);
    const remove = () => note.remove();
    hide.addEventListener("click", remove);
    discard.addEventListener("click", () => {
      continuedQuote = null;
      remove();
      toast("Quote discarded.");
    });
    // Keep the selection while pressing the note's buttons (mouse).
    note.addEventListener("mousedown", event => event.preventDefault());
    const host = document.getElementById("outerContainer") || document.body;
    host.append(note);
    return remove;
  }

  function continueOnNextPage(passage) {
    const last = Math.max(...(passage.pages || [passage.page]));
    if (last >= pagesCount()) {
      return;
    }
    closeSheet();
    window.getSelection()?.removeAllRanges();
    hideSelectionBar();
    app().page = last + 1;
    continuedQuote?.dismiss?.();
    continuedQuote = { passage, dismiss: showContinuedNote() };
  }

  // -- Images -----------------------------------------------------------------

  /** Lines of `text` no wider than `max` at the current font. */
  function wrapText(ctx, text, max) {
    const lines = [];
    for (const paragraph of text.split(/\n+/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > max) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) {
        lines.push(line);
      }
    }
    return lines;
  }

  /** A 1080 x 1350 card with the passage, for posts and chats. */
  async function quoteCardImage(state, qrLink) {
    const { width, height } = SHARE_CARD;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const serif =
      'Georgia, "Noto Serif", "Noto Serif Devanagari", "Times New Roman", serif';
    const sans = getComputedStyle(document.documentElement)
      .getPropertyValue("--rui-font")
      .trim();
    const page = state.passage.page;

    // The QR code loads its logo over the network: start it first.
    const qrSize = 150;
    const qrData = window.getQRCode
      ? Promise.race([
          window.getQRCode(qrLink, qrSize).getRawData("png"),
          new Promise(resolve => {
            setTimeout(resolve, 2500, null);
          }),
        ]).catch(() => null)
      : null;

    ctx.fillStyle = "#fbf7ee";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#2347a0";
    ctx.fillRect(0, 0, width, 14);

    // The passage, as large as fits.
    const text = cut(state.passage.text, SHARE_QUOTE_MAX);
    const area = { x: 110, top: 230, width: width - 220, height: 760 };
    let size = 64;
    let lines;
    for (; size > 30; size -= 2) {
      ctx.font = `${size}px ${serif}`;
      lines = wrapText(ctx, text, area.width);
      if (lines.length * size * 1.4 <= area.height) {
        break;
      }
    }
    ctx.fillStyle = "#c9bfa8";
    ctx.font = `bold 220px ${serif}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("“", area.x - 30, area.top + 40);
    ctx.fillStyle = "#1c1b19";
    ctx.font = `${size}px ${serif}`;
    ctx.textBaseline = "top";
    const lineHeight = size * 1.4;
    const block = lines.length * lineHeight;
    const first = area.top + Math.max(0, (area.height - block) / 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, area.x, first + i * lineHeight);
    });

    // The book (not the speaker: the passage may quote someone else), and
    // who the book is by.
    let y = first + block + 50;
    ctx.fillStyle = "#1c1b19";
    ctx.font = `600 38px ${sans}`;
    const source = wrapText(ctx, `— ${shareSource(page)}`, area.width);
    for (const line of source.slice(0, 2)) {
      ctx.fillText(line, area.x, y);
      y += 50;
    }
    y += 4;
    ctx.fillStyle = "#6b665c";
    ctx.font = `34px ${sans}`;
    ctx.fillText(SHARE_AUTHOR, area.x, y);

    // Foot: the site, the sharer, the QR code to the passage.
    ctx.fillStyle = "#2347a0";
    ctx.font = `bold 40px ${sans}`;
    ctx.fillText("baws.in", area.x, height - 170);
    const who = state.credit && shareIdentity()?.username;
    ctx.fillStyle = "#6b665c";
    ctx.font = `30px ${sans}`;
    ctx.fillText(
      who
        ? `Shared by @${who}`
        : "Dr. Babasaheb Ambedkar's Writings and Speeches",
      area.x,
      height - 115
    );
    const qrBlob = await qrData;
    if (qrBlob) {
      const qr = await createImageBitmap(qrBlob);
      ctx.drawImage(
        qr,
        width - 110 - qrSize,
        height - 110 - qrSize,
        qrSize,
        qrSize
      );
    }
    return new Promise(resolve => {
      canvas.toBlob(resolve, "image/png");
    });
  }

  /**
   * The QR code to the passage (or page): the same image as the long press
   * on Share (viewer-flexi.js: getQRCode, 600 px, the BAWS logo), with the
   * shared link (credit, utm_source=qr_code).
   */
  async function qrImage(state, qrLink) {
    if (!window.getQRCode) {
      return null;
    }
    return Promise.race([
      window
        .getQRCode(qrLink, 600, "https://baws.in/baws_social_logo.png", 50)
        .getRawData("png"),
      new Promise(resolve => {
        setTimeout(resolve, 5000, null);
      }),
    ]).catch(() => null);
  }

  /**
   * The page as an image: drawn from the PDF (the chosen page, when the
   * passage is on two), with the reader's highlights, the shared passage
   * marked as it was selected (remembered when it was captured, so a page
   * left for the next one keeps its mark) and a QR code to the link.
   */
  async function pageImage(state, qrLink) {
    const page = state.imagePage || state.passage?.page || currentPage();
    const url = await printPageImage(page, {
      withQr: true,
      withHighlights: true,
      qrUrl: qrLink,
      marks: state.passage?.marks?.[page] || [],
      scale: SHARE_PAGE_SCALE,
    });
    if (!url) {
      return null;
    }
    try {
      return await (await fetch(url)).blob();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // -- Sending ----------------------------------------------------------------

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = el("a", "", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function postToApp(action, data) {
    window.parent.postMessage(JSON.stringify({ action, data }), "*");
  }

  /** Opens a platform's share page (in the app: through the phone). */
  function openPlatform(href) {
    if (inNativeApp()) {
      postToApp("openExternal", { url: href });
    } else {
      window.open(href, "_blank", "noopener");
    }
  }

  function trackShare(platform, kind, page) {
    try {
      window.parent.gtag?.("event", "share", {
        method: platform,
        content_type: kind,
        item_id: pageId(page) || String(page),
      });
    } catch {
      // no analytics
    }
  }

  /** Chrome on Windows offers file sharing but often fails at it. */
  function canShareFiles() {
    try {
      return (
        !/Windows/.test(navigator.userAgent) &&
        !!navigator.canShare?.({
          files: [new File([""], "x.png", { type: "image/png" })],
        })
      );
    } catch {
      return false;
    }
  }

  async function sendShare(state, platform) {
    const page = state.passage?.page || currentPage();
    const source = platform.id === "more" ? "share_sheet" : platform.id;
    const message = shareMessage(state, source);
    trackShare(source, state.kind, page);
    storageSet("ruiShareImage", state.kind);

    if (state.kind === "none") {
      if (platform.id === "copy") {
        toast(
          (await copyText(message.text))
            ? "Message and link copied."
            : "Couldn't copy. Please try again."
        );
      } else if (platform.id === "more") {
        if (inNativeApp()) {
          postToApp("shareNative", { text: message.text });
        } else if (navigator.share) {
          await navigator.share({ text: message.text }).catch(() => {});
        } else {
          await copyText(message.text);
          toast("Message and link copied: paste them to share.");
        }
      } else {
        openPlatform(platform.href(message));
      }
      return;
    }

    const preparing = toast("Preparing the image…", { timeout: 0 });
    let blob;
    try {
      const qrLink = shareLink(page, state.passage, "qr_code", state.credit);
      const makers = {
        page: pageImage,
        qr: qrImage,
        quote: quoteCardImage,
      };
      blob = await makers[state.kind](state, qrLink);
    } catch (error) {
      console.warn("Share image:", error);
    } finally {
      preparing();
    }
    if (!blob) {
      toast("Couldn't make the image. Sharing the message only.");
      await sendShare({ ...state, kind: "none" }, platform);
      return;
    }
    const imagePage = state.kind === "page" ? state.imagePage || page : page;
    const extension = blob.type === "image/jpeg" ? "jpg" : "png";
    const name = `baws-${state.kind}-${imagePage}.${extension}`;
    const pick =
      platform.href && platform.id !== "more"
        ? ` Choose ${platform.label} in the share window.`
        : "";

    if (inNativeApp()) {
      postToApp("shareNative", {
        text: message.text,
        base64: await blobToDataUrl(blob),
        fileName: name,
      });
      if (pick) {
        toast(pick.trim());
      }
      return;
    }
    if (canShareFiles()) {
      const file = new File([blob], name, { type: blob.type || "image/png" });
      try {
        await navigator.share({ files: [file], text: message.text });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return; // the share window was closed
        }
        // Too long after the tap, or refused: download it instead.
      }
    }
    downloadBlob(blob, name);
    const copied = await copyText(message.text);
    if (platform.href && platform.id !== "more" && platform.id !== "copy") {
      openPlatform(platform.href(message));
      toast(
        `Image downloaded${copied ? " and message copied" : ""}: attach the ` +
          `image in ${platform.label}.`,
        { timeout: 7000 }
      );
    } else {
      toast(`Image downloaded${copied ? ", message and link copied" : ""}.`, {
        timeout: 6000,
      });
    }
  }

  // -- The sheet --------------------------------------------------------------

  function nextShareTip() {
    const index = (Number(storageGet("ruiShareTip")) || 0) % SHARE_TIPS.length;
    storageSet("ruiShareTip", String(index + 1));
    return SHARE_TIPS[index];
  }

  /**
   * Share: from the dock or the selection bar. `kind` preselects what to
   * send ("page" from More → Page image).
   */
  async function openShareSheet({ kind } = {}) {
    let passage = await captureSelection();
    // The end of a passage begun on the previous page ("Continue on the
    // next page"): added to it. Its own end can still finish its sentence.
    let endOffers = null;
    if (continuedQuote) {
      const first = continuedQuote.passage;
      continuedQuote.dismiss?.();
      continuedQuote = null;
      if (passage) {
        const second = await sentenceOffers(passage).catch(() => ({}));
        endOffers = second.core
          ? { core: `${first.text} ${second.core}`, tail: second.tail }
          : {};
        passage = {
          ...first,
          text: `${first.text} ${passage.text}`,
          pages: [...new Set([...first.pages, passage.page])],
          marks: { ...first.marks, ...passage.marks },
          continued: true,
        };
      } else {
        passage = first;
      }
    }
    if (!passage && !kind) {
      openSheet("Share", body => {
        body.classList.add("rui-share");
        const ask = el("p", "rui-share-ask");
        ask.textContent = "Would you like to select something first?";
        const why = el("p", "rui-share-note");
        why.textContent =
          "A selected passage becomes a quote card, and the link opens right at it.";
        const select = el("button", "rui-primary", { type: "button" });
        select.textContent = "Select a passage";
        select.addEventListener("click", () => {
          closeSheet();
          toast(
            "Press and hold a word, then drag to the end of the passage. Then tap Share.",
            { timeout: 7000 }
          );
        });
        const page = el("button", "rui-share-secondary", { type: "button" });
        page.textContent = "Share the whole page";
        page.addEventListener("click", () => showShareOptions(null, "page"));
        const row = el("div", "rui-share-actions");
        row.append(page, select);
        body.append(ask, why, row);
      });
      return;
    }
    // Whole sentences, when the selection cuts one. A passage put together
    // over pages: only its end (its start is the first part, the reader's
    // own choice).
    let offers = endOffers || {};
    if (passage && !passage.continued) {
      offers = await sentenceOffers(passage).catch(() => ({}));
    }
    showShareOptions(passage, kind, offers);
  }

  function showShareOptions(passage, preset, offers = {}) {
    const stored = storageGet("ruiShareImage");
    // In this order (owner, 2026-11-26); a quote card needs a passage.
    const kinds = passage
      ? ["page", "qr", "quote", "none"]
      : ["page", "qr", "none"];
    let kind = kinds.includes(stored) ? stored : kinds[0];
    if (preset && kinds.includes(preset)) {
      kind = preset;
    }
    const state = {
      passage,
      credit: shareCreditOn(),
      kind,
      offers,
      head: false,
      tail: false,
      imagePage: null,
    };
    const page = passage?.page || currentPage();
    openSheet("Share", body => {
      body.classList.add("rui-share");

      const preview = el("p", "rui-share-preview");
      const quote = el("q");
      const where = el("span", "rui-share-where");
      where.textContent = shareSource(page);
      if (passage) {
        preview.append(quote);
      }
      preview.append(where);

      // Whole sentences, and more of the passage on the next page.
      const more = el("div", "rui-share-more");
      const toggles = [];
      const OFFER_LABELS = {
        head: ["Start of the sentence", "(previous page)"],
        tail: ["Finish the sentence", "(next page)"],
      };
      for (const side of ["head", "tail"]) {
        if (!offers[side]) {
          continue;
        }
        const [label, other] = OFFER_LABELS[side];
        const chip = el("button", "rui-chip", {
          type: "button",
          "aria-pressed": "false",
        });
        chip.textContent = offers[side].page ? `${label} ${other}` : label;
        chip.addEventListener("click", () => {
          state[side] = !state[side];
          chip.setAttribute("aria-pressed", String(state[side]));
          refresh();
        });
        toggles.push(chip);
      }
      // Not again for a passage already continued from the page before.
      if (
        passage &&
        !passage.continued &&
        Math.max(...(passage.pages || [page])) < pagesCount()
      ) {
        const next = el("button", "rui-chip", { type: "button" });
        next.textContent = "Continue on the next page";
        // The sentence's end taken from the next page is left out: the
        // reader selects there what to add (it would come twice).
        next.addEventListener("click", () =>
          continueOnNextPage(
            sharedPassage({
              ...state,
              tail: state.tail && !offers.tail?.page,
            })
          )
        );
        toggles.push(next);
      }
      more.append(...toggles);

      // Over two pages, the page image is one of them.
      const pagePick = el("div", "rui-share-pagepick", {
        role: "group",
        "aria-label": "Page image from",
      });
      const refresh = () => {
        const shared = sharedPassage(state);
        if (shared) {
          quote.textContent = cut(shared.text, 260);
        }
        const pages = shared?.pages || [page];
        if (!pages.includes(state.imagePage)) {
          state.imagePage = pages[0];
        }
        pagePick.hidden = pages.length < 2 || state.kind !== "page";
        pagePick.replaceChildren();
        if (pages.length > 1) {
          const label = el("span");
          label.textContent = "Page image:";
          pagePick.append(label);
          pages.forEach((number, i) => {
            const button = el("button", "rui-chip", {
              type: "button",
              "aria-pressed": String(number === state.imagePage),
            });
            button.textContent = i === 0 ? "Where it starts" : "Where it ends";
            button.addEventListener("click", () => {
              state.imagePage = number;
              refresh();
            });
            pagePick.append(button);
          });
        }
      };

      const imageTitle = sectionTitle("Include an image");
      const picker = el("div", "rui-segmented rui-share-kinds", {
        role: "group",
        "aria-label": "Include an image",
      });
      picker.style.gridTemplateColumns = `repeat(${kinds.length}, minmax(0, 1fr))`;
      const KIND_LABELS = {
        page: ["Page", "image"],
        qr: ["QR code", "qr"],
        quote: ["Quote card", "quote"],
        none: ["No image", "link"],
      };
      const showKind = () => {
        for (const button of picker.children) {
          button.setAttribute(
            "aria-pressed",
            String(button.value === state.kind)
          );
        }
      };
      for (const option of kinds) {
        const [label, iconName] = KIND_LABELS[option];
        const button = el("button", "", { type: "button", value: option });
        // Static icon markup and a fixed label.
        // eslint-disable-next-line no-unsanitized/property
        button.innerHTML = icon(iconName);
        button.append(document.createTextNode(label));
        button.addEventListener("click", () => {
          state.kind = option;
          showKind();
          refresh();
        });
        picker.append(button);
      }
      showKind();
      refresh();

      const who = shareIdentity();
      let credit;
      if (who) {
        credit = makeSwitch(
          `Credit me as the source (@${who.username})`,
          state.credit,
          on => {
            state.credit = on;
            storageSet("ruiShareCredit", on ? "1" : "0");
          }
        );
        credit.classList.add("rui-share-credit");
      } else {
        credit = el("p", "rui-share-note");
        credit.textContent =
          "Signed-in readers get credit when people open what they share.";
      }

      const toTitle = sectionTitle("Share to");
      const tiles = el("div", "rui-tiles rui-share-tiles");
      for (const platform of SHARE_PLATFORMS) {
        const tile = el("button", "rui-tile", { type: "button" });
        if (platform.icon) {
          // Static icon markup.
          // eslint-disable-next-line no-unsanitized/property
          tile.innerHTML = icon(platform.icon);
        } else {
          const mark = el("span", "rui-share-mark", { "aria-hidden": "true" });
          mark.textContent = platform.mark;
          mark.style.background = platform.color;
          tile.append(mark);
        }
        const label = el("span");
        label.textContent = platform.label;
        tile.append(label);
        tile.addEventListener("click", () => {
          closeSheet();
          hideSelectionBar();
          sendShare(
            { ...state, passage: sharedPassage(state) },
            platform
          ).catch(error => {
            console.warn("Share:", error);
            toast("Couldn't share. Please try again.");
          });
        });
        tiles.append(tile);
      }

      const tip = el("p", "rui-share-tip");
      const tipLabel = el("strong");
      tipLabel.textContent = "Tip: ";
      tip.append(tipLabel, document.createTextNode(nextShareTip()));

      body.append(preview);
      if (toggles.length) {
        body.append(more);
      }
      body.append(imageTitle, picker, pagePick, credit, toTitle, tiles, tip);
    });
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
      // On wide screens it opens and closes the side panel.
      pressed: () => sidePanel.open && panelAllowed(),
      run: () => {
        if (sidePanel.open && panelAllowed() && notebook.tab === "contents") {
          closePanel();
        } else {
          openNotebook("contents");
        }
      },
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
    // Highlighting is in the selection bar; the dock saves the page for
    // later instead (with the selected passage, if any).
    registerAction({
      id: "savePage",
      label: () => (window.findSavedPage?.(currentPage()) ? "Saved" : "Save"),
      icon: "bookmark",
      placements: ["dock"],
      priority: 30,
      elementId: "ruiSavePage",
      pressed: () => !!window.findSavedPage?.(currentPage()),
      run: toggleSavedPage,
    });
    registerAction({
      id: "share",
      label: "Share",
      icon: "share",
      placements: ["dock"],
      priority: 20,
      elementId: "shareButton",
      run: () => openShareSheet(),
      // As before (a QR code to download, the link copied), with the
      // selected passage's place in the link (owner, 2026-11-27).
      longPress: () => {
        captureSelection()
          .catch(() => null)
          .then(passage => {
            const band =
              passage && passage.y !== null && passage.y2 > passage.y
                ? {
                    page: passage.page,
                    y: round3(passage.y),
                    y2: round3(passage.y2),
                  }
                : null;
            window.shareButtonClick?.(true, band);
          });
      },
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
      run: () => openShareSheet(),
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
      group: "Misc",
      priority: 30,
      // Only inside the BAWS.in app, which hosts the Pradnya chat.
      visible: () => window.parent !== window,
      run: () =>
        window.parent.postMessage(
          JSON.stringify({ action: "openPradnya" }),
          "*"
        ),
    });
    registerAction({
      id: "classicReader",
      label: "Classic reader",
      icon: "swap",
      placements: ["more"],
      group: "Reading",
      priority: 5,
      // The app saves the choice and reopens this page (viewer-flexi.js).
      run: () => window.switchReader?.("classic"),
    });
    registerAction({
      id: "citation",
      label: "Citation",
      icon: "quote",
      placements: ["more"],
      group: "Misc",
      priority: 20,
      keepSheetOpen: true,
      // Only inside the app, which provides the citations.
      visible: () => !!citationSource(),
      run: openCitationSheet,
    });
    registerAction({
      id: "tour",
      label: "Tour",
      icon: "help",
      placements: ["more"],
      group: "Misc",
      priority: 10,
      // After More has closed.
      run: () => setTimeout(startTour, 300),
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
    registerAction({
      id: "translate",
      label: () =>
        `Read in ${EDITION_LANGS[otherLanguage()] || "the other edition"}`,
      icon: "translate",
      placements: ["top-end"],
      // Last: the extreme top right.
      priority: 5,
      elementId: "ruiTranslate",
      // Only on pages that have a counterpart in the other edition.
      visible: () => !!editionStretches(currentPage()),
      pressed: () => edition.on,
      // Reading a translation (opened from the other edition).
      badge: () => !!edition.landing.from,
      run: safely(() => {
        setBands(!edition.on);
        if (edition.on) {
          editionTip();
        }
      }),
    });

    // More sheet: Share
    registerAction({
      id: "sharePage",
      label: "Page image",
      icon: "image",
      placements: ["more"],
      group: "Share",
      priority: 50,
      run: () => openShareSheet({ kind: "page" }),
    });
    registerAction({
      id: "shareQr",
      label: "QR code",
      icon: "qr",
      placements: ["more"],
      group: "Share",
      priority: 40,
      run: () => openShareSheet({ kind: "qr" }),
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
    registerAction({
      id: "printPage",
      label: "Print",
      icon: "print",
      placements: ["more"],
      group: "Share",
      priority: 20,
      // The Android app's web view has no print dialog.
      visible: () => !inNativeApp(),
      keepSheetOpen: true,
      run: openPrintSheet,
    });
  }

  // ---------------------------------------------------------------------
  // Other edition: read this passage in Hindi / English
  // ---------------------------------------------------------------------

  // Position maps between the English volumes and their Hindi translations
  // (made in baws-hybrid-index, data/hindi-segments), one file per Hindi
  // volume, HI_Volume_<N>.json:
  //   {en: {"EN/Volume_06/20": [[from, to, "HI/Volume_11/17", at], ...]},
  //    hi: {"HI/Volume_11/17": [[from, to, "EN/Volume_06/20", at], ...]}}
  // from/to: where the stretch runs on this page, as fractions of the page's
  // text (0 top, 1 bottom); at: how far down the other page it starts. Page
  // ids are "<LANG>/<book>/<PDF page>". index.json (made by baws-search
  // scripts/hindi-segments-index.mjs) says which files can hold an English
  // page: {v: 1, files: [names], en: {"EN/Volume_10": [[first, last,
  // file], ...]}}; a Hindi page is always in its own volume's file.
  //
  // Where the files are served from is a setting: "segments=<base url>" in
  // the viewer's address. Inside the app only the app sets it (for now for
  // beta testers only, see baws-search Book.jsx); a viewer on its own also
  // reads localStorage.readerSegmentsUrl. No setting, no Translate button.
  //
  // Text fractions only approximate places on a PDF page, so the bands
  // cover whole lines, generously; they never claim to be exact.
  //
  // Tapping a band asks the app to open the other edition there
  // ({action: "openOtherEdition", data: {page, at, from, fromAt}}). The app
  // changes its address to /books/<parent>/<LANG>/<book>/pdf/<page> with
  // ?at=&from=&fromAt= (no site reload; the reader opens the other book),
  // and this reader marks the landing place and offers the way back.

  const EDITION_LANGS = { EN: "English", HI: "Hindi" };
  const EDITION_CHIP = { EN: "English", HI: "हिंदी" };
  const PAGE_ID = /^(EN|HI)\/([A-Za-z0-9_]+)\/(\d+)$/;
  const LANDING_MARK_MS = 2500;

  const edition = {
    base: segmentsBase(),
    index: null, // Promise<index.json|null>
    files: new Map(), // file name -> Promise<data|null>
    pages: new Map(), // page number -> stretches, or null (looked up)
    lookups: new Map(), // page number -> Promise (looking up)
    on: false, // bands showing
    landing: landingFromUrl(),
  };

  function segmentsBase() {
    let value = null;
    try {
      value = new URLSearchParams(location.search).get("segments");
    } catch {}
    if (window.parent === window) {
      value ||= storageGet("readerSegmentsUrl");
    }
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value.replace(/\/?$/, "/"), location.href);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function landingFromUrl() {
    const query = new URLSearchParams(location.search);
    const fraction = name => {
      const value = parseFloat(query.get(name));
      return value >= 0 && value <= 1 ? value : null;
    };
    const from = query.get("from");
    const page = /(?:^#|&)page=(\d+)/.exec(location.hash)?.[1];
    return {
      at: fraction("at"),
      // Search's link also gives the passage's height on the PDF page (?y=),
      // for Page view; see markLanding(). A shared passage gives its top and
      // bottom (?y=&y2=) and no ?at=.
      y: fraction("y"),
      y2: fraction("y2"),
      to: null, // Text view: where a shared passage ends (from y2)
      letters: "", // Text view: a shared passage's letters (from y..y2)
      from: PAGE_ID.test(from || "") ? from : null,
      fromAt: fraction("fromAt"),
      page: page ? Number(page) : null,
    };
  }

  function bookLanguage() {
    return window.getBookUrlData?.()?.language;
  }

  function otherLanguage() {
    return { EN: "HI", HI: "EN" }[bookLanguage()];
  }

  function pageId(pageNumber) {
    const data = window.getBookUrlData?.();
    return data && EDITION_LANGS[data.language]
      ? `${data.language}/${data.bookName}/${pageNumber}`
      : null;
  }

  /** "HI/Volume_33/317" -> "Hindi, Volume 33 page 317" */
  function describePage(id) {
    const [, lang, book, page] = PAGE_ID.exec(id);
    const volume = /^Volume_(\d+)(?:_(\d+))?$/.exec(book);
    const name = volume
      ? `Volume ${+volume[1]}${volume[2] ? ` part ${+volume[2]}` : ""}`
      : book.replaceAll("_", " ");
    return `${EDITION_LANGS[lang]}, ${name} page ${page}`;
  }

  const SEGMENTS_TIMEOUT_MS = 15000;

  /**
   * One map file: its data, or null when there is no such file or it isn't
   * a map (kept, not asked for again). Rejects when the server can't be
   * reached or is too slow (offline, server down): not kept, so it is
   * tried again on the next page. Never throws past the caller's catch.
   */
  function fetchSegments(name) {
    if (!edition.files.has(name)) {
      const options = {};
      if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
        options.signal = AbortSignal.timeout(SEGMENTS_TIMEOUT_MS);
      }
      const loading = fetch(edition.base + name, options)
        .catch(error => {
          edition.files.delete(name);
          throw error;
        })
        .then(response => (response.ok ? response.json() : null))
        // Not JSON (e.g. an HTML error page): no map.
        .then(
          data => (data && typeof data === "object" ? data : null),
          error => {
            if (!edition.files.has(name)) {
              throw error; // network: try again later
            }
            return null;
          }
        );
      edition.files.set(name, loading);
    }
    return edition.files.get(name);
  }

  function validStretch(stretch, lang) {
    if (!Array.isArray(stretch)) {
      return false;
    }
    const [from, to, other, at] = stretch;
    const match = PAGE_ID.exec(other || "");
    return (
      from >= 0 &&
      to <= 1 &&
      from < to &&
      at >= 0 &&
      at <= 1 &&
      !!match &&
      match[1] !== lang
    );
  }

  async function findStretches(id) {
    const [, lang, book, pageText] = PAGE_ID.exec(id);
    const page = Number(pageText);
    let names = [`HI_${book}.json`];
    if (lang === "EN") {
      edition.index ||= fetchSegments("index.json").then(
        data => {
          const ok = data?.v === 1 && data.en && Array.isArray(data.files);
          return ok ? data : null;
        },
        error => {
          edition.index = null; // try again later
          throw error;
        }
      );
      const index = await edition.index;
      const runs = index?.en?.[`EN/${book}`];
      names = (Array.isArray(runs) ? runs : [])
        .filter(run => Array.isArray(run) && page >= run[0] && page <= run[1])
        .map(run => index.files[run[2]])
        .filter(name => /^HI_[A-Za-z0-9_]+\.json$/.test(name || ""));
    }
    for (const name of names) {
      const data = await fetchSegments(name);
      const pages = data?.[lang.toLowerCase()];
      const list = pages && typeof pages === "object" ? pages[id] : null;
      const stretches = Array.isArray(list)
        ? list.filter(s => validStretch(s, lang))
        : [];
      if (stretches.length) {
        return stretches;
      }
    }
    return null;
  }

  /** The stretches of a page, if already looked up (else undefined). */
  function editionStretches(pageNumber) {
    return edition.pages.get(pageNumber);
  }

  function lookUpStretches(pageNumber) {
    if (edition.pages.has(pageNumber)) {
      return Promise.resolve(edition.pages.get(pageNumber));
    }
    const id = edition.base && pageId(pageNumber);
    if (!id) {
      return Promise.resolve(null);
    }
    if (!edition.lookups.has(pageNumber)) {
      edition.lookups.set(
        pageNumber,
        findStretches(id).then(
          stretches => {
            edition.lookups.delete(pageNumber);
            edition.pages.set(pageNumber, stretches);
            return stretches;
          },
          () => {
            // Maps not reachable: no Translate button for now; not kept,
            // so the page is looked up again when the reader comes back.
            edition.lookups.delete(pageNumber);
            return null;
          }
        )
      );
    }
    return edition.lookups.get(pageNumber);
  }

  /** Shows or hides the Translate button for the current page. */
  async function updateTranslateButton() {
    const page = currentPage();
    const stretches = await lookUpStretches(page);
    if (page !== currentPage()) {
      return;
    }
    const shown = !!document.getElementById("ruiTranslate");
    if (shown !== !!stretches) {
      renderBars();
    }
    if (!stretches && edition.on) {
      // Nothing to show here, and no button to turn the bands off.
      setBands(false);
    }
  }

  // -- Where a text fraction is on the page ---------------------------------

  /**
   * A function giving the line that holds a text fraction of the page, as
   * {top, bottom} fractions of the page's height; null while the page isn't
   * drawn. Page view uses the PDF's text layer (its lines, top to bottom);
   * Text view the text itself.
   */
  function textPlaces(view) {
    const box = view.div.getBoundingClientRect();
    if (!box.height) {
      return null;
    }
    const relative = rect => ({
      top: (rect.top - box.top) / box.height,
      bottom: (rect.bottom - box.top) / box.height,
    });

    if (window.VIEW_MODE === "text") {
      const text = view.div.querySelector(".textView");
      if (!text || text.classList.contains("textViewUnavailable")) {
        return null;
      }
      const nodes = [];
      let total = 0;
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.data.trim()) {
          nodes.push([node, total]);
          total += node.data.length;
        }
      }
      if (!total) {
        return null;
      }
      const range = document.createRange();
      return fraction => {
        const target = Math.min(total - 1, Math.max(0, fraction * total));
        let i = nodes.length - 1;
        while (i > 0 && nodes[i][1] > target) {
          i--;
        }
        const [node, start] = nodes[i];
        const offset = Math.min(
          node.data.length - 1,
          Math.floor(target - start)
        );
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const rect =
          range.getClientRects()[0] ||
          node.parentElement.getBoundingClientRect();
        return relative(rect);
      };
    }

    const lines = layerLines(view);
    if (!lines) {
      return null; // not drawn yet
    }
    const total = lines.reduce((sum, line) => sum + line.chars, 0);
    if (!total) {
      // A page without text (a scan without a text layer): the text area
      // of a printed page, roughly.
      return fraction => {
        const y = 0.07 + fraction * 0.86;
        return { top: y - 0.015, bottom: y + 0.015 };
      };
    }
    return fraction => {
      const target = fraction * total;
      let seen = 0;
      for (const line of lines) {
        seen += line.chars;
        if (seen > target) {
          return line;
        }
      }
      return lines.at(-1);
    };
  }

  /**
   * The lines of a page's text layer, top first: {top, bottom} (page
   * fractions) and their characters; null before the layer is drawn.
   */
  function layerLines(view) {
    const box = view.div.getBoundingClientRect();
    const layer = view.div.querySelector(".textLayer");
    if (!box.height || !layer?.querySelector(".endOfContent")) {
      return null;
    }
    const spans = [];
    for (const span of layer.querySelectorAll("span")) {
      const rect = span.getBoundingClientRect();
      if (
        !span.firstElementChild &&
        rect.width > 0 &&
        rect.height > 0 &&
        span.textContent.trim()
      ) {
        spans.push({ rect, chars: span.textContent.length });
      }
    }
    spans.sort((a, b) => a.rect.top - b.rect.top);
    const lines = [];
    for (const { rect, chars } of spans) {
      const line = lines.at(-1);
      if (line && rect.top < line.top + (line.bottom - line.top) * 0.5) {
        line.bottom = Math.max(line.bottom, rect.bottom);
        line.chars += chars;
      } else {
        lines.push({ top: rect.top, bottom: rect.bottom, chars });
      }
    }
    return lines.map(line => ({
      top: (line.top - box.top) / box.height,
      bottom: (line.bottom - box.top) / box.height,
      chars: line.chars,
    }));
  }

  const LANDING_LINES = 3;

  /**
   * {top, bottom} (page fractions) for a height on the PDF page: the line
   * there and the next ones (LANDING_LINES in all, from the line above when
   * the height is in a line's upper part); null before the text layer is
   * drawn. A page without text: a little below that height.
   */
  function heightBox(view, y) {
    const lines = layerLines(view);
    if (!lines) {
      return null;
    }
    if (!lines.length) {
      return { top: Math.max(0, y - 0.005), bottom: Math.min(1, y + 0.05) };
    }
    let first = lines.findIndex(line => line.bottom > y);
    if (first < 0) {
      first = lines.length - 1;
    }
    // The height is interpolated between measured points and comes out up
    // to a line low (a passage starting near the end of a line): unless it
    // is near a line's foot, start with the line above too.
    const line = lines[first];
    if (first > 0 && y - line.top < 0.75 * (line.bottom - line.top)) {
      first -= 1;
    }
    const last = lines[Math.min(lines.length - 1, first + LANDING_LINES - 1)];
    return { top: lines[first].top, bottom: last.bottom };
  }

  /** {top, bottom} (page fractions) of the lines a stretch runs over. */
  function stretchBox(place, from, to) {
    const first = place(from);
    // The last character inside the stretch, not the first one after it.
    const last = place(Math.max(from, to - 0.0005));
    return { top: first.top, bottom: Math.max(first.bottom, last.bottom) };
  }

  /**
   * {top, bottom} for a shared passage in Page view: the text-layer lines
   * between its top and bottom heights (the selection's own lines); the
   * heights themselves on a page without text or before the layer is drawn
   * (null then, to try again).
   */
  function spanBox(view, y, y2) {
    const lines = layerLines(view);
    if (!lines) {
      return null;
    }
    const inside = lines.filter(line => {
      const middle = (line.top + line.bottom) / 2;
      return middle >= y && middle <= y2;
    });
    if (!inside.length) {
      return { top: y, bottom: y2 };
    }
    return {
      top: Math.min(...inside.map(line => line.top)),
      bottom: Math.max(...inside.map(line => line.bottom)),
    };
  }

  // -- A page's text lines from the PDF itself ------------------------------
  //
  // Shared links carry heights on the PDF page (?y=&y2=), whichever view
  // the passage was selected in, so they open right in Page view (the
  // default). Text view converts between those heights and places in the
  // page's text (fractions of its characters, as ?at= is) with the PDF's
  // own lines: no drawn page needed.

  const pdfRowsCache = new Map(); // page number -> Promise<rows|null>
  // Text view's text and the PDF's lines count characters a little
  // differently (spaces, hyphens): a passage converted between them is
  // widened by about half a line each way, so the bar holds all of it.
  const PLACE_SLACK = 0.012;

  /** The page's text lines, top first: {top, bottom, chars} (fractions). */
  function pdfRows(pageNumber) {
    if (!pdfRowsCache.has(pageNumber)) {
      pdfRowsCache.set(
        pageNumber,
        (async () => {
          const page = await app().pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const { items } = await page.getTextContent();
          const pieces = [];
          for (const item of items) {
            if (!item.str?.trim()) {
              continue;
            }
            const [x, base] = viewport.convertToViewportPoint(
              item.transform[4],
              item.transform[5]
            );
            const height =
              Math.abs(item.height || item.transform[3]) ||
              viewport.height * 0.01;
            pieces.push({
              top: (base - height) / viewport.height,
              bottom: base / viewport.height,
              left: x / viewport.width,
              width: (item.width || 0) / viewport.width,
              chars: item.str.length,
              str: item.str,
            });
          }
          const inOrder = pieces.slice(); // the PDF's own (reading) order
          pieces.sort((a, b) => a.top - b.top);
          const rows = [];
          for (const piece of pieces) {
            const row = rows.at(-1);
            if (row && piece.top < row.top + (row.bottom - row.top) * 0.5) {
              row.bottom = Math.max(row.bottom, piece.bottom);
              row.chars += piece.chars;
            } else {
              rows.push({ ...piece });
            }
          }
          rows.items = inOrder;
          return rows;
        })().catch(() => null)
      );
    }
    return pdfRowsCache.get(pageNumber);
  }

  /** A height on the page as a place in its text; `end`: a passage's foot. */
  function heightToPlace(rows, y, end = false) {
    const total = rows.reduce((sum, row) => sum + row.chars, 0);
    if (!total) {
      return null;
    }
    let seen = 0;
    for (const row of rows) {
      if (end ? row.top >= y : row.bottom > y) {
        break;
      }
      seen += row.chars;
    }
    return Math.min(1, seen / total);
  }

  /** A place in the page's text as a height; `end`: that line's foot. */
  function placeToHeight(rows, place, end = false) {
    const total = rows.reduce((sum, row) => sum + row.chars, 0);
    if (!total || !rows.length) {
      return null;
    }
    const target = place * total;
    let seen = 0;
    for (const row of rows) {
      seen += row.chars;
      if (seen > target || (end && seen >= target)) {
        return end ? row.bottom : row.top;
      }
    }
    return end ? rows.at(-1).bottom : rows.at(-1).top;
  }

  // -- Matching a passage by its words -----------------------------------
  //
  // Text view's text and the PDF's text are the same words, spaced and
  // hyphenated differently. Compared as letters only (no spaces,
  // punctuation or hyphens), a passage is found exactly in either.

  const LETTER = /[\p{L}\p{M}\p{N}]/u;
  const NEEDLE = 24; // letters looked for at each end of a passage

  /** The letters of `text`, lower case. */
  function lettersOnly(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      if (LETTER.test(text[i])) {
        out += text[i].toLowerCase();
      }
    }
    return out;
  }

  /**
   * Where a passage (its letters) is in `hay` (letters): {first, last}
   * letter indices, or null.
   */
  function findLetters(hay, letters) {
    if (letters.length < 8) {
      return null;
    }
    for (const size of [NEEDLE, 12]) {
      const head = letters.slice(0, size);
      const tail = letters.slice(-size);
      const first = hay.indexOf(head);
      if (first < 0) {
        continue;
      }
      const end = hay.indexOf(tail, first);
      if (end >= 0) {
        return { first, last: end + tail.length - 1 };
      }
    }
    return null;
  }

  /** A passage's text as heights on the PDF page {y, y2}, or null. */
  function passageHeights(rows, text) {
    const items = rows?.items;
    if (!items?.length) {
      return null;
    }
    let hay = "";
    const owner = [];
    items.forEach((item, i) => {
      const letters = lettersOnly(item.str);
      hay += letters;
      for (let k = 0; k < letters.length; k++) {
        owner.push(i);
      }
    });
    const found = findLetters(hay, lettersOnly(text));
    if (!found) {
      return null;
    }
    const first = items[owner[found.first]];
    const last = items[owner[found.last]];
    return { y: first.top, y2: Math.max(first.bottom, last.bottom) };
  }

  /** The letters of the PDF's text between two heights (a shared passage). */
  function lettersBetween(rows, y, y2) {
    return lettersOnly(
      (rows?.items || [])
        .filter(item => {
          const middle = (item.top + item.bottom) / 2;
          return middle >= y && middle <= y2;
        })
        .map(item => item.str)
        .join("")
    );
  }

  /**
   * A passage (its letters) in a page's Text view, as places (fractions of
   * its characters, as textPlaces counts them): {at, to}, or null.
   */
  function findInTextView(view, letters) {
    const text = view.div.querySelector(".textView");
    if (!text || !letters) {
      return null;
    }
    let hay = "";
    const offsets = [];
    let total = 0;
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.data.trim()) {
        continue;
      }
      for (let k = 0; k < node.data.length; k++) {
        if (LETTER.test(node.data[k])) {
          hay += node.data[k].toLowerCase();
          offsets.push(total + k);
        }
      }
      total += node.data.length;
    }
    const found = total && findLetters(hay, letters);
    if (!found) {
      return null;
    }
    return {
      at: offsets[found.first] / total,
      to: (offsets[found.last] + 1) / total,
    };
  }

  /** A shared link (heights only): its passage as places, for Text view. */
  async function landingTextPlace(pageNumber) {
    const { y, y2 } = edition.landing;
    const rows = y !== null && (await pdfRows(pageNumber));
    if (!rows?.length) {
      return;
    }
    if (y2 !== null && y2 > y) {
      edition.landing.letters = lettersBetween(rows, y, y2);
    }
    const at = heightToPlace(rows, y);
    if (at === null) {
      return;
    }
    edition.landing.at = Math.max(0, at - PLACE_SLACK);
    if (y2 !== null && y2 > y) {
      const to = heightToPlace(rows, y2, true);
      edition.landing.to = to === null ? null : Math.min(1, to + PLACE_SLACK);
    }
  }

  // -- Bands -----------------------------------------------------------------

  function setBands(on) {
    edition.on = on;
    if (on) {
      hideSelectionBar();
    }
    for (const view of app().pdfViewer._pages || []) {
      drawBands(view);
    }
    refreshPressedStates();
  }

  function drawBands(view) {
    view.div.querySelector(".rui-xl-layer")?.remove();
    if (!edition.on) {
      return;
    }
    const stretches = editionStretches(view.id);
    if (!stretches) {
      if (!edition.pages.has(view.id)) {
        lookUpStretches(view.id).then(
          safely(found => found && drawBands(view))
        );
      }
      return;
    }
    const place = textPlaces(view);
    if (!place) {
      return; // drawn again when the page is (see wireOtherEdition)
    }
    const boxes = stretches.map(([from, to]) => stretchBox(place, from, to));
    // Neighbouring stretches can share a line: they meet half way, so no
    // band covers another. The outer edges get a little room.
    for (let i = 1; i < boxes.length; i++) {
      const prev = boxes[i - 1];
      const next = boxes[i];
      if (next.top - prev.bottom < 0.03) {
        const middle = (prev.bottom + next.top) / 2;
        prev.bottom = middle;
        next.top = middle;
      }
    }
    boxes[0].top -= 0.006;
    boxes.at(-1).bottom += 0.006;

    const layer = el("div", "rui-xl-layer");
    stretches.forEach(([from, , other, at], i) => {
      const top = Math.max(0, boxes[i].top);
      const bottom = Math.min(1, boxes[i].bottom);
      const band = el("button", "rui-xl-band", {
        type: "button",
        "aria-label": `Read this passage in ${describePage(other)}`,
        title: `Read in ${describePage(other)}`,
      });
      band.style.top = `${top * 100}%`;
      band.style.height = `${Math.max(0.02, bottom - top) * 100}%`;
      const chip = el("span", "rui-xl-chip", { "aria-hidden": "true" });
      const [, lang, , page] = PAGE_ID.exec(other);
      chip.textContent = `${EDITION_CHIP[lang]} · p.${page}`;
      chip.lang = lang.toLowerCase();
      band.append(chip);
      wireBand(band, other, at, { from: pageId(view.id), fromAt: from });
      layer.append(band);
    });
    view.div.append(layer);
    keepChipsInView();
  }

  /**
   * On phones the page is wider than the screen (its margins are cut off),
   * so the labels ("हिंदी · p.27") keep to the visible part of the page,
   * not the paper's edge, as the page scrolls sideways.
   */
  let chipsWired = false;
  function keepChipsInView() {
    const container = document.getElementById("viewerContainer");
    const place = () => {
      const right = container.getBoundingClientRect().right;
      for (const layer of container.querySelectorAll(".rui-xl-layer")) {
        const hidden = layer.getBoundingClientRect().right - right;
        layer.style.setProperty(
          "--rui-xl-hidden-right",
          `${Math.max(0, Math.round(hidden))}px`
        );
      }
    };
    place();
    if (chipsWired) {
      return;
    }
    chipsWired = true;
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    container.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
  }

  // -- New tab or window ------------------------------------------------------

  // In the reader's own language, as the reader is about to switch to it.
  const EDITION_WORDS = {
    EN: {
      tip: "Long press to open in a new tab/window",
      title: page => `Open English, p.${page}`,
      tab: "New tab",
      window: "New window",
    },
    HI: {
      tip: "नए टैब/विंडो में खोलने के लिए देर तक दबाएँ",
      title: page => `हिंदी, पृष्ठ ${page} खोलें`,
      tab: "नया टैब",
      window: "नई विंडो",
    },
  };
  const EDITION_TIP_TIMES = 3;
  const EDITION_TIP_MS = 3500;

  /** A new tab or window makes sense in a browser, not in the Android app. */
  function newTabsPossible() {
    return !inNativeApp();
  }

  /** On turning the bands on, the first few times: how to keep this page. */
  function editionTip() {
    const shown = parseInt(storageGet("ruiTipEditionTabs"), 10) || 0;
    if (!newTabsPossible() || shown >= EDITION_TIP_TIMES || sheetOpen) {
      return;
    }
    storageSet("ruiTipEditionTabs", String(shown + 1));
    const lang = otherLanguage();
    toast(EDITION_WORDS[lang].tip, { timeout: EDITION_TIP_MS });
    const text = ui.toasts.lastElementChild?.firstElementChild;
    if (text) {
      text.lang = lang.toLowerCase();
    }
  }

  /**
   * A band: a tap opens the passage here; a long press (or right click)
   * asks whether to open it in a new tab or window instead. Ctrl/Cmd+click
   * and Shift+click do so at once, as for links.
   */
  function wireBand(band, other, at, origin) {
    const here = () => openOtherEdition(other, at, origin);
    if (!newTabsPossible()) {
      band.addEventListener("click", safely(here));
      return;
    }
    let timer = null;
    let start = null;
    let longPressed = false;
    const choose = () => {
      clearTimeout(timer);
      longPressed = true;
      chooseNewTab(other, at);
    };
    const cancel = () => clearTimeout(timer);
    band.addEventListener("pointerdown", event => {
      if (event.button !== 0) {
        return;
      }
      longPressed = false;
      start = { x: event.clientX, y: event.clientY };
      clearTimeout(timer);
      timer = setTimeout(safely(choose), LONG_PRESS_MS);
    });
    band.addEventListener("pointermove", event => {
      // Moving the finger (scrolling) isn't a long press.
      if (
        start &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10
      ) {
        cancel();
      }
    });
    band.addEventListener("pointerup", cancel);
    // After a long press, lifting the finger would "click" whatever is now
    // under it: the sheet's backdrop, which would close the sheet at once.
    band.addEventListener("touchend", event => {
      if (longPressed && event.cancelable) {
        event.preventDefault();
      }
    });
    band.addEventListener("pointerleave", cancel);
    band.addEventListener("pointercancel", cancel);
    // Some phones report a long press as a context menu, before our timer.
    band.addEventListener("contextmenu", event => {
      event.preventDefault();
      if (!sheetOpen) {
        safely(choose)();
      }
    });
    band.addEventListener(
      "click",
      safely(event => {
        if (longPressed) {
          longPressed = false;
          return;
        }
        if (event.ctrlKey || event.metaKey) {
          openOtherEdition(other, at, { open: "tab" });
        } else if (event.shiftKey) {
          openOtherEdition(other, at, { open: "window" });
        } else {
          here();
        }
      })
    );
  }

  function chooseNewTab(other, at) {
    const [, lang, , page] = PAGE_ID.exec(other);
    const words = EDITION_WORDS[lang];
    openSheet(words.title(page), body => {
      body.closest(".rui-sheet").lang = lang.toLowerCase();
      const list = el("div", "rui-jump");
      for (const open of ["tab", "window"]) {
        const row = el("button", "rui-jump-row", { type: "button" });
        const text = el("span", "rui-jump-text");
        const name = el("span", "rui-jump-title");
        name.textContent = words[open];
        text.append(name);
        row.append(text);
        row.addEventListener(
          "click",
          safely(() => {
            closeSheet(true);
            openOtherEdition(other, at, { open });
          })
        );
        list.append(row);
      }
      body.append(list);
    });
  }

  /**
   * Opens a page of the other edition. Inside the app, the app changes its
   * address (the site stays loaded; only the reader opens the other book).
   * On its own, the viewer opens that book itself. With `open` "tab" or
   * "window", it opens there and this page stays as it is (so no way back
   * is needed there).
   */
  function openOtherEdition(
    target,
    at,
    { from = null, fromAt = null, open = null } = {}
  ) {
    const match = PAGE_ID.exec(target);
    if (!match) {
      return;
    }
    if (open) {
      from = null;
    } else {
      toast(`Opening ${describePage(target)}…`);
    }
    if (window.parent !== window) {
      window.parent.postMessage(
        JSON.stringify({
          action: "openOtherEdition",
          data: { page: target, at, from, fromAt, open },
        }),
        "*"
      );
      return;
    }
    const [, lang, book, page] = match;
    const pdf = app().baseUrl.replace(
      /\/[A-Z]{2}\/[^/]+\.pdf$/,
      `/${lang}/${book}.pdf`
    );
    const query = new URLSearchParams();
    for (const key of ["ui", "segments"]) {
      const value = new URLSearchParams(location.search).get(key);
      if (value) {
        query.set(key, value);
      }
    }
    query.set("at", String(at));
    if (from) {
      query.set("from", from);
      query.set("fromAt", String(fromAt ?? 0));
    }
    // file= last: everything after it is the PDF's address.
    const url = `${location.pathname}?${query}&file=${pdf}#page=${page}`;
    if (open) {
      openNewTab(url, open);
    } else {
      location.href = url;
    }
  }

  /** "tab": a new tab; "window": a window of its own, near this one's size. */
  function openNewTab(url, open) {
    if (open === "window") {
      const width = Math.min(window.outerWidth || 900, 1100);
      const height = window.outerHeight || 800;
      window.open(url, "_blank", `popup,width=${width},height=${height}`);
    } else {
      window.open(url, "_blank");
    }
  }

  // -- Landing: mark the passage, offer the way back --------------------------

  function markLanding(view) {
    const { at, to: end, y, y2 } = edition.landing;
    let box;
    if (y !== null && window.VIEW_MODE !== "text") {
      // From search, in Page view: the lines at that height (owner,
      // 2026-11-22), not the whole passage of the edition maps. A shared
      // passage: exactly its lines (owner, 2026-11-26).
      box = y2 !== null && y2 > y ? spanBox(view, y, y2) : heightBox(view, y);
    } else if (at === null) {
      return false; // heights not yet turned into a place in the text
    } else if (end !== null && end > at) {
      // A shared passage in Text view: its words, from start to end (by
      // character counts if they can't be found).
      const place = textPlaces(view);
      const found = findInTextView(view, edition.landing.letters);
      box =
        place &&
        (found
          ? stretchBox(place, found.at, found.to)
          : stretchBox(place, at, end));
    } else {
      const place = textPlaces(view);
      const stretches = place ? editionStretches(view.id) || [] : [];
      const hit = stretches.find(([from, to]) => at >= from && at < to);
      box =
        place &&
        (hit
          ? stretchBox(place, hit[0], hit[1])
          : stretchBox(place, at, Math.min(1, at + 0.08)));
    }
    if (!box) {
      return false;
    }
    const top = Math.max(0, box.top - 0.006);
    const bottom = Math.min(1, box.bottom + 0.006);
    const mark = el("div", "rui-xl-mark", { "aria-hidden": "true" });
    mark.style.top = `${top * 100}%`;
    mark.style.height = `${Math.max(0.02, bottom - top) * 100}%`;
    view.div.querySelector(".rui-xl-mark")?.remove();
    view.div.append(mark);

    // The passage a quarter of the way down the screen.
    const container = document.getElementById("viewerContainer");
    const page = view.div.getBoundingClientRect();
    const frame = container.getBoundingClientRect();
    container.scrollTop +=
      page.top + top * page.height - (frame.top + frame.height * 0.25);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      if (reduced) {
        mark.remove();
        return;
      }
      mark.classList.add("rui-xl-fade");
      setTimeout(() => mark.remove(), 900);
    }, LANDING_MARK_MS);
    return true;
  }

  function showBackBar(landingPage) {
    const { from, fromAt } = edition.landing;
    if (!from) {
      return;
    }
    const [, lang, , page] = PAGE_ID.exec(from);
    const bar = el("button", "rui-xl-back", {
      type: "button",
      "aria-label": `Back to ${describePage(from)}`,
    });
    // Static markup (icons and fixed labels only).
    // eslint-disable-next-line no-unsanitized/property
    bar.innerHTML = icon("back") + "<span></span>";
    bar.querySelector(
      "span"
    ).textContent = `Back to ${EDITION_LANGS[lang]}, p.${page}`;
    bar.addEventListener(
      "click",
      safely(() => {
        bar.remove();
        openOtherEdition(from, fromAt ?? 0);
      })
    );
    (document.getElementById("outerContainer") || document.body).append(bar);
    // Until the reader moves a page away.
    const bus = app().eventBus;
    const away = e => {
      if (e.pageNumber !== landingPage) {
        bar.remove();
        bus._off("pagechanging", away);
      }
    };
    bus._on("pagechanging", away);
  }

  /**
   * Runs a Translate handler so that a failure only turns the feature off
   * for the moment: an exception thrown in a pdf.js event listener would
   * stop the listeners after it (page rendering, the rest of the reader).
   */
  function safely(fn) {
    return (...args) => {
      try {
        const result = fn(...args);
        result?.catch?.(error => console.warn("Translate:", error));
      } catch (error) {
        console.warn("Translate:", error);
      }
    };
  }

  function wireOtherEdition(a) {
    if (!edition.base) {
      return;
    }
    const bus = a.eventBus;
    bus._on("pagechanging", safely(updateTranslateButton));
    safely(updateTranslateButton)();

    const redraw = safely(e => {
      const view = a.pdfViewer.getPageView(e.pageNumber - 1);
      if (view && edition.on) {
        drawBands(view);
      }
    });
    bus._on("textlayerrendered", redraw);
    bus._on("pagerendered", e => {
      // Page view: the text layer comes a little later (textlayerrendered).
      if (window.VIEW_MODE === "text") {
        redraw(e);
      }
    });

    document.addEventListener(
      "keydown",
      safely(event => {
        if (event.key === "Escape" && edition.on) {
          setBands(false);
        }
      })
    );
  }

  /**
   * A link that names a passage (?at= from search or Translate, ?y= / ?y=&y2=
   * from search or a share): mark it once its page is drawn, and offer the way
   * back to the other edition. Works without the Translate maps too.
   */
  function wireLanding(a) {
    const bus = a.eventBus;
    const landing = edition.landing;
    if (landing.at === null && landing.y === null) {
      return;
    }
    const landingPage = landing.page || currentPage();
    if (landing.from) {
      safely(showBackBar)(landingPage);
    }
    // Mark the passage once the page is there (with its map if it can be
    // had; without it, the place it starts). A shared passage has only
    // heights: Text view needs them as places in the page's text.
    Promise.all([
      lookUpStretches(landingPage).catch(() => null),
      landing.at === null
        ? landingTextPlace(landingPage).catch(() => null)
        : null,
    ]).then(() => {
      let done = false;
      const tryMark = safely(() => {
        const view = !done && a.pdfViewer.getPageView(landingPage - 1);
        if (view) {
          done = markLanding(view);
        }
      });
      tryMark();
      const onDrawn = e => {
        if (e.pageNumber === landingPage) {
          // After pdf.js has scrolled to the page.
          setTimeout(tryMark, 50);
        }
      };
      bus._on("textlayerrendered", onDrawn);
      bus._on("pagerendered", onDrawn);
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
      // The side panel may have opened before the outline came.
      refreshPanel("outline");
    } else if (tries < 60) {
      setTimeout(() => waitForOutline(tries + 1), 1000);
    }
  }

  function startReaderUi() {
    keepOldSidebarClosed();
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

      // A page without a text version (.md) in "Text view" mode: offer
      // the original page, once per switch into that mode.
      let textNoticeShown = false;
      a.eventBus._on("textviewunavailable", () => {
        if (textNoticeShown || window.VIEW_MODE !== "text") {
          return;
        }
        textNoticeShown = true;
        toast("This page has no text version yet.", {
          actionLabel: "Page view",
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

      // The book's language, so the browser can hyphenate the justified
      // "Text view" text (unless the PDF names its own).
      const lang = { EN: "en", HI: "hi", MR: "mr", GU: "gu" }[
        window.getBookUrlData?.()?.language
      ];
      if (lang && !a.pdfViewer.viewer.lang) {
        a.pdfViewer.viewer.lang = lang;
      }

      const container = document.getElementById("viewerContainer");
      wireScrollHiding(container);
      wireGestures(container);
      wireTextCentering(container, a);
      wireSelectionBar(container);
      wirePlayer();
      wireNotebook();
      wirePanel(a);
      wireMouseEdges();
      wireWordHelper();
      wireSaveNudge();
      wireOtherEdition(a);
      wireLanding(a);
      // Save shows whether this page is saved (pages change; the app sends
      // the saved list with the highlights).
      a.eventBus._on("pagechanging", refreshPressedStates);
      document.addEventListener("baws:highlightschange", refreshPressedStates);
      a.eventBus._on("pagechanging", () => {
        hideSelectionBar();
        closeDefinition();
        updatePlayer();
      });

      wireTips(a);
      // After the first page is on screen.
      setTimeout(maybeWelcome, 1200);
    });

    document.addEventListener("baws:speakingchange", refreshPressedStates);
  }

  // ---------------------------------------------------------------------
  // The classic reader's sidebar
  // ---------------------------------------------------------------------

  // pdf.js reopens its own sidebar (Contents, thumbnails) when it remembers
  // it open for a book (pdfjs.history, written by the classic reader) or the
  // PDF asks for it. The new reader hides the toolbar holding its close
  // button and has its own Notebook, so that sidebar would sit over the page
  // for good: never open it here, and forget it was open.
  const SIDEBAR_NONE = 0; // pdf.js SidebarView.NONE

  function forgetOldSidebar() {
    try {
      const history = JSON.parse(localStorage.getItem("pdfjs.history"));
      const files = Array.isArray(history?.files) ? history.files : [];
      if (files.some(file => file?.sidebarView)) {
        for (const file of files) {
          if (file?.sidebarView) {
            file.sidebarView = SIDEBAR_NONE;
          }
        }
        localStorage.setItem("pdfjs.history", JSON.stringify(history));
      }
    } catch {
      // No storage, or not ours to read: closing it below still works.
    }
  }

  function keepOldSidebarClosed() {
    // Before the book opens: not the remembered view, not the PDF's own.
    const setOption = () =>
      window.PDFViewerApplicationOptions?.set(
        "sidebarViewOnLoad",
        SIDEBAR_NONE
      );
    setOption();
    document.addEventListener("webviewerloaded", setOption, { once: true });
    forgetOldSidebar();

    whenViewerReady(a => {
      const close = () => {
        if (a.pdfSidebar?.isOpen) {
          a.pdfSidebar.close(); // also saves "closed" for this book
        }
      };
      close();
      a.eventBus._on("sidebarviewchanged", () => setTimeout(close));
    });
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
