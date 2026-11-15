# BAWS reader: decisions log

Decisions about the BAWS reader (this pdf.js fork) and how it works with the
baws-search app, gathered from the working sessions so far. Newest
decisions are dated; "why" is given where the reason isn't obvious.
Commit hashes refer to the `baws` branch of this repo unless marked
baws-search.

## How we work

- **Repos and branches.** pdf.js ships from `baws` (Mozilla's `master` is
  upstream); baws-search from `master`. Since 2026-10-12: commit straight
  to `baws` / `master`, no feature branches until the owner says otherwise.
  Push to `origin` (baws-in/pdf.js), never to the `upstream` remote
  (Mozilla).
- **Nothing ships without the owner's go-ahead**: no commit unless asked,
  no push, no S3 upload, no app release.
- **App logic belongs in baws-search.** The fork stays generic and only
  displays data the app produces (citations, word lists, search text,
  annotations). Example: citation data and formats live in baws-search
  `src/util/citation.js`; the reader only shows them.
- **The baws-search checkout is shared** with another working session:
  check the branch and status before committing and stage only your own
  files.
- **Messages between reader and app**: any new or changed message must be
  reported so `Book.jsx` / `App.jsx` in baws-search are updated.
- **Never hand-edit** `baws-search/public/pdfjs*` except as an emergency
  fix (then mirror it here).
- Throwaway test scripts stay outside the repos.

## Build and ship pipeline

1. `npx gulp generic` → `build/generic`
2. `powershell -File minify.ps1` → `dist/generic`
3. baws-search serves it through `public/pdfjs.newui`, a link to
   `dist/generic`; test on the dev server (http://localhost:3000, e.g.
   `/books/baws/EN/Volume_01/pdf/234`).
4. Ship: website = `./deploy.sh reader` in baws-search (S3); Android = new
   app build + `./deploy.sh app`.

**The Android app bundles the reader and the app pages** (Capacitor,
`webDir: 'build'`, no `server.url`, no live updates). Any reader or app
change reaches app users only with a new Play Store release.

### Live updates (discussed 2026-10-13, not built)

Wanted: the app runs its own bundled copy, but picks up a newer web bundle
when there is one. Proposed: `@capgo/capacitor-updater` in self-hosted
mode with S3 — a small `version.json` (`version`, zip `url`, `minNative`)
is checked at launch; a newer bundle downloads in the background and is
used from the next launch; a bundle that fails to start rolls back; offline
or same version = no change. Native changes (plugins, permissions, icons)
still need a store release; `minNative` keeps web bundles away from older
shells. `build/` is ~22 MB unzipped (reader ~8 MB), so delta updates
matter. Pointing the app at `https://baws.in` (`server.url`) was rejected:
no offline start, no fallback.

## Reader UI (the new reader)

- **Switching readers.** The new reader loads with `ui=2` in the URL or
  `localStorage.readerUI = "2"`. `switchReader("classic"|"new")`: inside
  the app it posts `{action:'switchReader', data}`; standalone it sets
  `localStorage.readerUI` and reloads.
  - Classic reader: a "Try the new reader" row in the Reader Mode panel
    only. The extra toolbar button was removed (two buttons was one too
    many, and it didn't fit on phones).
  - New reader: More → "Classic reader".
- **More sheet groups**:
  - Reading: Notebook, Go to page, Fullscreen, Classic reader.
  - Share: Page image, QR code, Copy link, Print.
  - Misc: Ask Pradnya, Citation, Tour.
- **View names**: "Original page" → **Page view**; "Fit to phone" →
  **Text view**.
- **Default theme is Light (2026-10-25).** People with dark mode on their
  phones were opening books in dark mode. The reader now starts in Light;
  Night, Sepia or System (follow the phone) only when the reader chooses
  one in Display settings. A saved choice is kept.
  - Still following the phone, outside the reader: the baws-search app
    screens (Tailwind's default `media` dark mode, status bar in
    `App.jsx`). For the same first experience: `darkMode: 'class'` and a
    light status bar there.
  - The classic reader's toolbars also still follow the phone
    (`viewer.css`); left alone as the classic reader is being retired.

### Controls hiding (phones and desktop)

- Bars auto-hide while reading, **per bar**: a bar hides only if it covers
  at least 2% of the page on screen (`HIDE_MIN_COVER`); otherwise it stays
  (`rui-keep-top` / `rui-keep-bottom`). A tap still hides both. Why: on a
  411×770 phone the top bar was hiding over empty background.
- Mouse at the top or bottom edge shows the bars (desktop).

### Phones: page fit and swipes

- **Phones open at "page-fit" and the page is a little wider than the
  screen on purpose**: it cuts off the PDFs' wide white margins. Not a bug;
  keep page-fit as the phone default.
- Swipes turn pages; when zoomed in, a sideways swipe scrolls first and
  turns the page only at that edge.
- **iPhone / iPad (all iOS browsers are WebKit) — 2026-10-12, a082ea3e1
  and follow-ups**:
  - iOS scrolls diagonally and bounces at edges, so a swipe also scrolled
    the page and the bounce brought the controls back. Scrolling during
    and just after a sideways swipe, and the bounce, no longer show them.
  - Near the normal size (page at most 20% wider than the screen), a swipe
    always turns the page and the page doesn't pan sideways.
  - **The printed text is centred, not the paper**: book pages have the
    wider margin on the outside, so centring the paper cut off text on
    the right.
  - "Zoomed in" is judged by how much wider than the screen the page
    really is, not by how the zoom was set (a small zoom-out had stopped
    right swipes).
  - Curved thumb swipes count (1.5:1 instead of 2:1).

### Desktop layout (Phase 6)

The full desktop redesign (permanent top bar, left rail, docked player,
notes margin) was rejected: it takes height on small laptops and dropped
the auto-hiding bottom slider with bookmark marks. Goal: when reading, give
the page as much space as possible. Built instead (merged 4425d0bdb):

1. Notebook (Contents / Highlights / Notes / Words) as a 340px side panel
   in the left margin (windows ≥ 900px). **The page never moves**: stays
   centred.
2. Opens by default when it fits without covering the page; closing is
   remembered per device; Contents toggles it.
3. If it would cover the page, it floats over the page edge and hides with
   the bars while reading.
4. Bottom bar on desktop: slider and buttons in one centred row (≤1100px).
5. Mouse at the top/bottom edge shows the bars.

Not done yet: the desktop page header sits under the top bar at 1366×768.

### Text view

- Text comes from one Markdown file per PDF page:
  `<PDF URL without .pdf>/<page>.md`, e.g.
  `https://assets.studyring.org/assets/books/baws/EN/Volume_01/234.md`.
  `<page>` is the 1-based PDF page index, not the printed page number, no
  zero padding. The PDF URL must end in `.pdf` (no query string). Missing
  or empty file → "Text view unavailable" notice on that page.
- baws-search's page preview (Search, Bookmarks) loads the **same files**
  (`pageMarkdownUrl()` in `src/component/PagePreview.jsx`).
- The chapter outline is `<PDF URL>.json` (e.g. `Volume_01.pdf.json`).
- **Justified text** with `hyphens: auto`, also on phones; the reader sets
  the book's language on `#viewer` so the browser can hyphenate (only
  where it has dictionaries). Headings and tables stay left-aligned.
- **No highlighting in Text view (2026-10-13, cec142918).** Highlights are
  drawn on the page, and the Text view box is not the PDF page. The
  selection bar has no colour swatches there; **Save** keeps the page for
  later with the page details and the selected text (no rects, no
  colour). The classic reader's highlight button does the same in Text
  view.
- **Read aloud doesn't jump in Text view (fe17ce913).** Read aloud no
  longer runs a "find" per sentence there (the find scrolled to the match
  in the PDF's text). Switching to Text view stops any running search. In
  Page view, read aloud still marks the sentence being read.

### Read this passage in the other language (2026-11-14, not shipped)

Hindi ↔ English: the reader opens the other edition at the same passage.
Design reference: the "Reader language switch" mockup (three phone
screens).

- **Phone top bar** (≤ 599px): the zoom − and + sit in one narrow column
  (+ above −) with a tiny "zoom" label, freeing one button's width. Order
  at the top right: zoom, Aa, Find, **Translate** (extreme right). Desktop
  top bar unchanged (zoom side by side, no label).
- **Translate button**: the Material "translate" icon (A + 文), shown
  **only on pages that have a counterpart** in the other edition; label
  "Read in Hindi" / "Read in English". While reading a translation (opened
  from the other edition) it carries a small accent dot.
- **Tap Translate → translation bands** on the drawn pages: a tinted band
  over each stretch that has a counterpart (full page width), with a small
  chip "हिंदी · p.17" / "English · p.29". Each band is a button ("Read this
  passage in Hindi, Volume 11 page 17"). Translate again or Escape hides
  them. Works in Page view (PDF text layer lines) and Text view (the text
  itself).
- **Tap a band → the other edition** at the matching page; the landing
  stretch is marked and fades after ~2.5 s (reduced motion: shown, then
  removed, no animation), scrolled to a quarter down the screen. A
  "Back to English, p.20" bar stays until the reader moves a page away.
- **No site reload.** The reader posts `{action: "openOtherEdition",
  data: {page: "HI/Volume_11/18", at, from: "EN/Volume_06/20", fromAt}}`
  (JSON string, like the other `action` messages, handled in baws-search
  `Book.jsx`); the app changes its route to
  `/books/baws/HI/Volume_11/pdf/18?at=&from=&fromAt=` (react-router, not a
  page load) and passes those to the reader before `file=`. Only the reader
  frame opens the other PDF. Going back sends no `from` (no dot, no bar).
- **Data**: position maps from baws-hybrid-index `data/hindi-segments`
  (`HI_Volume_<N>.json`, one per Hindi volume; fractions of the page's
  text). An English volume can be translated by several Hindi volumes, so
  `index.json` (baws-search `scripts/hindi-segments-index.mjs`, ~2 KB)
  lists page runs → files; the reader fetches only the file(s) for the
  page. Overlapping runs (EN 10, EN 13) are tried in order.
- **Maps not reachable never break the reader (2026-11-14).** Offline,
  server down, a 404, an HTML page instead of JSON, malformed data or a
  server that never answers (15 s timeout): no Translate button on that
  page, pages keep turning. Network failures aren't remembered, so the
  button comes back once the maps can be had. Every Translate handler is
  wrapped so an error can't stop pdf.js's other listeners. Landing without
  the maps still shows the Back bar and marks the place `at` gives.
- **Fractions are approximate**: bands cover whole lines and are drawn
  generously; neighbouring stretches meet half way. A page without a text
  layer falls back to the printed text area.
- **Beta testers only at first (2026-11-14);** baws-search 7cee3e5 then
  opened it to every reader. Inside the app the reader still takes the
  maps' address from the app alone.
- **New tab or window (2026-11-14).** A tap on a band opens the passage
  here, as before. A long press (600 ms, or a right click) opens a sheet,
  "New tab" / "New window", in the target edition's language; Ctrl/Cmd+
  click and Shift+click do so at once, as for links. The message gets
  `open: "tab" | "window"` and no `from` (this page stays open, so no Back
  bar there); Book.jsx calls `window.open` on the site's book route (the
  tap carries over to the parent, so it isn't blocked as a pop-up; if it
  is, it opens here). The band's size there comes from the new page's own
  map (the stretch holding `at`), as for a tap. Turning the bands on shows
  a short tip (3.5 s) in the target language, "Long press to open in a
  new tab/window" / "नए टैब/विंडो में खोलने के लिए देर तक दबाएँ", the first 3
  times only (`ruiTipEditionTabs`). Not in the Android app (no tabs
  there): no tip, a long press does nothing special. After a long press
  the touch's own click is cancelled, or it would land on the sheet's
  backdrop and close it.
- **Where the maps are served from is a setting** (publishing is a
  separate step needing the owner's OK): `segments=<base url>` in the
  reader's address, which the app adds from `REACT_APP_HINDI_SEGMENTS_URL`
  (`hindiSegmentsUrl` in `constants.js`), or until that is set from the
  beta tester's `localStorage.readerSegmentsUrl`. A viewer opened on its
  own reads `localStorage.readerSegmentsUrl` itself. Not set = no
  Translate button. Local testing: a small static server on :3100 serving
  the folder.

### Selection bar (2026-11-14)

The bar with the colours and Define / Share / Copy **moves lazily**: while
a selection is being adjusted it stays where it is, faint and letting the
finger through; once the selection settles it moves only if it would cover
the selected text or the selection has gone more than ~140px away.
Scrolling still carries it along (once a frame). Why: re-centring on every
pause in a handle drag put it under the finger and fought the selection.

### Tutorial

Welcome card, a 4-step "try it" tour, one-time tips, and More → Tour. Tour
texts must only describe what really exists (an invented "Listen from
selection" was removed). Possible later: a "Things to try" checklist.

### Citations (2026-10-12)

- Display only in the reader (More → Citation); the reader calls
  `window.parent.getCitation({language, bookName, pdfPage, titles, url})`
  → `[{id, label, parts, note}]`. Data, formats and `pdf2book` live in
  baws-search `src/util/citation.js`.
- Styles: APA, MLA, Chicago and BAWS (short form). The bulky BAWS style
  and "Short" were merged into one short BAWS style.
- English volumes are cited as the **2019 Dr. Ambedkar Foundation
  reprint**, first published **14 April 1979**. Volume 16: ISBN
  978-93-5109-188-2.
- The printed page comes from `pdf2book()`; if unknown, cite "XXX" and ask
  the reader to replace it with the number printed on the page.

### Print pages (a37b9c678)

- More → Share → Print. Choices: **This page**, **[N] pages from here**
  (typed number, 1–20), **Rest of chapter** (greyed out on the chapter's
  last page). Three balanced options; "Next 5" became a typed number.
- Switches: **QR code on each page** and **Keep my highlights**.
- Each page is drawn fresh from the PDF at 3×, so no word underlines or
  controls come along; one page per sheet; tip about two-sided printing.
- Hidden in the native app.

### Sharing and QR codes

QR codes use `getQRCode()` (`web/viewer.js`, qr-code-styling 1.8.0): blue
`#4267b2` extra-rounded dots, logo in the middle, transparent background.
The Play Store QR (`https://play.google.com/store/apps/details?id=in.baws.app&pcampaignid=web_share`)
was made with the same settings (PNG 1200px + SVG).

## Saved for later, bookmarks, highlights

- Saved pages from any host (localhost, LAN IPs, other schemes) count as
  baws.in: `normalizeBookmarkUrl` (baws-search) treats every host as
  baws.in. Other hosts are only test points.
- The home page "Saved for later" is a **horizontal shelf (Swiper)**, not
  a list: it will hold 20–30 items.
- Highlight messages: `{type:"saveHighlight"|"deleteHighlight", payload}`;
  optional `color` (yellow, blue, green, pink; missing = yellow, so old
  bookmarks need no migration). Rects are page percentages.
- Feed: "Your reading" filter — side-column items are excluded only under
  "All".

## Offline and caching

- The PDF chunk cache asks for **persistent storage** (not in Firefox) and
  is limited to 500 MB (or 25% of the quota).
- Only exact `Content-Range` matches are cached, so failed or partial
  responses are never stored.
- The Android launch clean-up deletes only `workbox-*` and `images`
  caches, not the chunk cache.
- Offline: if the HEAD check fails, the book opens from the cache.
- Pages that failed to download show a message and redraw when back online
  or when returning to the page (pdf.js no longer keeps failed promises).
- **"Download this volume" was abandoned**: volumes are large (some Marathi
  PDFs are ~70 MB).
- The asset server sends `Cache-Control: immutable` (1 year): replacing a
  PDF needs a CloudFront invalidation.

## Planned next

- **Whole-book search** (its own phase): the find bar keeps instant search
  of nearby pages; "Search the whole book" downloads a per-book text file
  generated from the PDF text layer (`<book>.text.json`, next to the PDF);
  "Search all books" hands off to the app's server search.
- **Words helper**: generator and curation in baws-search
  (`scripts/book-words.mjs`, `data/words/curation.json`); per-book word
  files to move next to the PDFs. The stem-matched dictionary gives wrong
  meanings for common words; common English words and proper nouns are
  skipped.
- **Phase 6 rest**: turn the new reader on for everyone and remove the old
  UI (check the old reader first).
- **Live updates** for the Android app (see above).
- Small issues: desktop header under the top bar at 1366×768; the
  "page unavailable" message stays light in Night/Sepia.
