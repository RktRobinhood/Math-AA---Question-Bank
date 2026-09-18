/**
 * Question Bank Hover Preview
 *
 * Features:
 * - Hover a search result to preview the question.
 * - Uses the whole result card as the hover anchor.
 * - Preview slightly overlaps the card edge to eliminate dead space.
 * - Invisible hover bridge protects slow/diagonal mouse movement.
 * - Move onto the preview to keep it open.
 * - Mouse wheel zoom.
 * - + / - / reset zoom controls.
 * - Drag to pan while zoomed.
 * - Escape closes preview.
 * - Keyboard focus supported.
 */
(function questionHoverPreview() {
  'use strict';

  const CONFIG = Object.freeze({
    openDelayMs: 260,
    focusDelayMs: 80,

    /*
     * A slightly forgiving close delay helps mouse movement
     * between the result and preview without making the UI
     * feel sticky.
     */
    closeDelayMs: 160,

    /*
     * Negative means the preview overlaps the card slightly.
     * This eliminates any visible dead strip.
     */
    previewGapPx: -4,

    /*
     * Extra invisible corridor around the path between
     * the question card and the preview.
     */
    bridgePaddingPx: 14,

    viewportMarginPx: 12,
    renderedPageTimeoutMs: 6000,
    maxCacheEntries: 80,

    minZoom: 1,
    maxZoom: 4,
    zoomStep: 0.25,
  });

  const QUESTION_LINK_SELECTOR = [
    'a[href^="questions/"]',
    'a[href^="./questions/"]',
    'a[href^="../questions/"]',
    'a[href*="/questions/"]',
  ].join(',');

  /*
   * Prefer the whole visible search-result card as our anchor,
   * rather than the text/link inside the card.
   */
  const CARD_SELECTOR = [
    '[data-question-id]',
    '[data-question-url]',
    '[data-href]',
    '.question-card',
    '.question-result',
    '.result-card',
    '.search-result',
    'article',
  ].join(',');

  const DATA_IMAGE_ATTRIBUTES = [
    'previewSrc',
    'questionImage',
    'questionImageSrc',
    'imageSrc',
    'thumbnail',
    'thumbnailSrc',
  ];

  const GLOBAL_DATA_KEYS = [
    'AASL_DATA',
    'AASL_QUESTIONS',
    'QUESTION_BANK',
    'QUESTION_DATA',
    'QUESTIONS',
    'questions',
  ];

  const IMAGE_FILE_RE =
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

  const POSITIVE_IMAGE_RE =
    /(?:question|prompt|problem|crop)/i;

  const NEGATIVE_IMAGE_RE =
    /(?:mark[\s_-]*scheme|solution|answer|logo|icon|avatar|formula|favicon|badge)/i;

  const IDENTITY_KEYS_RE =
    /^(?:id|key|slug|qid|question_?(?:id|url|path|file)|page_?url|filename|file|path|href|url|page)$/i;

  const previewCache = new Map();

  const finePointerQuery = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)')
    : { matches: true };

  let popover = null;
  let hoverBridge = null;

  let currentTrigger = null;
  let currentRequest = 0;

  let openTimer = 0;
  let closeTimer = 0;
  let repositionFrame = 0;

  let zoomLevel = 1;
  let panState = null;

  /* -------------------------------------------------------
     STYLES
  ------------------------------------------------------- */

  function injectStyles() {
    if (
      document.getElementById(
        'aasl-question-hover-preview-styles'
      )
    ) {
      return;
    }

    const style = document.createElement('style');

    style.id =
      'aasl-question-hover-preview-styles';

    style.textContent = `
      .aasl-question-preview {
        position: fixed;
        z-index: 10000;

        width: min(620px, calc(100vw - 24px));
        max-height: min(76vh, 760px);

        display: flex;
        flex-direction: column;

        box-sizing: border-box;
        overflow: hidden;

        border: 1px solid rgba(15, 23, 42, 0.18);
        border: 1px solid color-mix(
          in srgb,
          CanvasText 18%,
          transparent
        );

        border-radius: 14px;

        background: Canvas;
        color: CanvasText;

        box-shadow:
          0 18px 54px rgba(15, 23, 42, 0.24),
          0 4px 14px rgba(15, 23, 42, 0.14);

        opacity: 0;
        visibility: hidden;
        pointer-events: none;

        transform: translateY(4px) scale(0.992);

        transition:
          opacity 120ms ease,
          transform 120ms ease,
          visibility 0s linear 120ms;
      }

      .aasl-question-preview[data-open="true"] {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;

        transform: translateY(0) scale(1);

        transition-delay: 0s;
      }

      /*
       * Invisible pointer-safe corridor between the result
       * and the preview.
       */
      .aasl-question-preview__bridge {
        position: fixed;
        z-index: 9999;

        display: none;

        background: transparent;

        pointer-events: auto;
      }

      .aasl-question-preview__bridge[data-open="true"] {
        display: block;
      }

      .aasl-question-preview__header {
        min-height: 42px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 12px;

        padding: 9px 12px;

        box-sizing: border-box;

        border-bottom: 1px solid rgba(15, 23, 42, 0.12);
        border-bottom: 1px solid color-mix(
          in srgb,
          CanvasText 12%,
          transparent
        );

        background: #f8fafc;
        background: color-mix(
          in srgb,
          Canvas 94%,
          CanvasText 6%
        );
      }

      .aasl-question-preview__title {
        min-width: 0;

        overflow: hidden;

        color: inherit;

        font:
          650 0.84rem/1.25
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aasl-question-preview__controls {
        display: flex;
        align-items: center;

        gap: 6px;

        flex: 0 0 auto;
      }

      .aasl-question-preview__zoom {
        min-width: 42px;

        color: #64748b;
        color: color-mix(
          in srgb,
          CanvasText 64%,
          transparent
        );

        font:
          600 0.72rem/1.2
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        text-align: center;
      }

      .aasl-question-preview__button {
        width: 28px;
        height: 28px;

        display: grid;
        place-items: center;

        padding: 0;

        border: 1px solid rgba(15, 23, 42, 0.14);
        border: 1px solid color-mix(
          in srgb,
          CanvasText 14%,
          transparent
        );

        border-radius: 7px;

        background: Canvas;
        color: CanvasText;

        cursor: pointer;

        font:
          650 0.9rem/1
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .aasl-question-preview__button:hover,
      .aasl-question-preview__button:focus-visible {
        background: #eef2f7;
        background: color-mix(
          in srgb,
          Canvas 90%,
          CanvasText 10%
        );

        outline: none;
      }

      .aasl-question-preview__body {
        min-height: 132px;

        flex: 1 1 auto;

        display: grid;
        place-items: center;

        overflow: auto;

        overscroll-behavior: contain;
        scrollbar-gutter: stable;

        background: #fff;
      }

      .aasl-question-preview__body[data-zoomed="true"] {
        cursor: grab;
      }

      .aasl-question-preview__body[data-panning="true"] {
        cursor: grabbing;
      }

      .aasl-question-preview__image {
        display: block;

        width: 100%;
        height: auto;

        max-width: none;

        margin: 0 auto;

        background: #fff;

        transform-origin: top left;

        user-select: none;
        -webkit-user-drag: none;
      }

      .aasl-question-preview__hint {
        min-height: 30px;

        display: flex;
        align-items: center;
        justify-content: center;

        gap: 8px;

        padding: 6px 10px;

        box-sizing: border-box;

        border-top: 1px solid rgba(15, 23, 42, 0.10);
        border-top: 1px solid color-mix(
          in srgb,
          CanvasText 10%,
          transparent
        );

        background: #f8fafc;
        background: color-mix(
          in srgb,
          Canvas 96%,
          CanvasText 4%
        );

        color: #64748b;
        color: color-mix(
          in srgb,
          CanvasText 62%,
          transparent
        );

        font:
          500 0.72rem/1.2
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        text-align: center;
        white-space: nowrap;
      }

      .aasl-question-preview__hint kbd {
        padding: 1px 5px;

        border: 1px solid rgba(15, 23, 42, 0.14);
        border: 1px solid color-mix(
          in srgb,
          CanvasText 14%,
          transparent
        );

        border-bottom-width: 2px;
        border-radius: 5px;

        background: Canvas;
        color: inherit;

        font: inherit;
      }

      .aasl-question-preview__status {
        min-height: 132px;

        display: flex;
        align-items: center;
        justify-content: center;

        gap: 10px;

        padding: 18px;

        box-sizing: border-box;

        color: #475569;

        font:
          500 0.84rem/1.4
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        text-align: center;
      }

      .aasl-question-preview__spinner {
        width: 18px;
        height: 18px;

        flex: 0 0 auto;

        box-sizing: border-box;

        border: 2px solid rgba(71, 85, 105, 0.22);
        border-top-color: #475569;

        border-radius: 999px;

        animation:
          aasl-question-preview-spin
          650ms linear infinite;
      }

      @keyframes aasl-question-preview-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (hover: none) {
        .aasl-question-preview,
        .aasl-question-preview__bridge {
          display: none !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .aasl-question-preview {
          transition: none;
        }

        .aasl-question-preview__spinner {
          animation-duration: 1.25s;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* -------------------------------------------------------
     PREVIEW + BRIDGE CREATION
  ------------------------------------------------------- */

  function ensurePopover() {
    if (popover) {
      return popover;
    }

    injectStyles();

    popover = document.createElement('div');

    popover.className =
      'aasl-question-preview';

    popover.id =
      'aasl-question-hover-preview';

    popover.setAttribute(
      'role',
      'tooltip'
    );

    popover.setAttribute(
      'aria-hidden',
      'true'
    );

    popover.innerHTML = `
      <div class="aasl-question-preview__header">

        <span class="aasl-question-preview__title">
          Question preview
        </span>

        <span
          class="aasl-question-preview__controls"
          aria-label="Preview zoom controls"
        >

          <button
            class="aasl-question-preview__button"
            type="button"
            data-preview-zoom="out"
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>

          <span
            class="aasl-question-preview__zoom"
            aria-live="polite"
          >
            100%
          </span>

          <button
            class="aasl-question-preview__button"
            type="button"
            data-preview-zoom="in"
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>

          <button
            class="aasl-question-preview__button"
            type="button"
            data-preview-zoom="reset"
            aria-label="Reset zoom"
            title="Reset zoom to 100%"
          >
            ↺
          </button>

        </span>
      </div>

      <div class="aasl-question-preview__body"></div>

      <div
        class="aasl-question-preview__hint"
        aria-hidden="true"
      >
        Mouse wheel: zoom
        &nbsp;·&nbsp;
        Drag: pan
        &nbsp;·&nbsp;
        <kbd>Esc</kbd>: close
      </div>
    `;

    document.body.appendChild(popover);

    /*
     * Transparent pointer-safe bridge.
     */
    hoverBridge =
      document.createElement('div');

    hoverBridge.className =
      'aasl-question-preview__bridge';

    hoverBridge.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.appendChild(
      hoverBridge
    );

    /*
     * Entering either the preview or bridge
     * cancels pending closure.
     */
    const keepAlive = () => {
      window.clearTimeout(
        closeTimer
      );
    };

    popover.addEventListener(
      'mouseenter',
      keepAlive
    );

    hoverBridge.addEventListener(
      'mouseenter',
      keepAlive
    );

    popover.addEventListener(
      'mouseleave',
      () => {
        if (currentTrigger) {
          scheduleHide(
            currentTrigger
          );
        }
      }
    );

    hoverBridge.addEventListener(
      'mouseleave',
      () => {
        if (currentTrigger) {
          scheduleHide(
            currentTrigger
          );
        }
      }
    );

    popover.addEventListener(
      'wheel',
      handlePreviewWheel,
      {
        passive: false,
      }
    );

    popover.addEventListener(
      'click',
      handlePreviewControlClick
    );

    popover.addEventListener(
      'pointerdown',
      startPreviewPan
    );

    window.addEventListener(
      'pointermove',
      movePreviewPan
    );

    window.addEventListener(
      'pointerup',
      endPreviewPan
    );

    window.addEventListener(
      'pointercancel',
      endPreviewPan
    );

    return popover;
  }

  /* -------------------------------------------------------
     QUESTION RESULT DETECTION
  ------------------------------------------------------- */

  function isQuestionHref(rawHref) {
    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      /^javascript:/i.test(rawHref)
    ) {
      return false;
    }

    try {
      const url =
        new URL(
          rawHref,
          document.baseURI
        );

      return /\/questions\/[^/]+(?:\.html)?\/?$/i.test(
        url.pathname
      );
    } catch (_) {
      return false;
    }
  }

  function findQuestionTrigger(startNode) {
    if (!(startNode instanceof Element)) {
      return null;
    }

    /*
     * First locate the actual question link.
     */
    const link =
      startNode.closest(
        QUESTION_LINK_SELECTOR
      ) ||
      startNode
        .closest(CARD_SELECTOR)
        ?.querySelector(
          QUESTION_LINK_SELECTOR
        );

    if (
      link &&
      isQuestionHref(
        link.getAttribute('href')
      )
    ) {
      /*
       * IMPORTANT:
       *
       * Anchor the preview to the surrounding card,
       * not to the inner text/link.
       *
       * This is the main fix for the gap visible
       * in the screenshot.
       */
      const card =
        link.closest(
          CARD_SELECTOR
        );

      return makeTrigger(
        card || link,
        link.getAttribute('href'),
        link
      );
    }

    const card =
      startNode.closest(
        CARD_SELECTOR
      );

    if (!card) {
      return null;
    }

    const rawHref =
      card.dataset.questionUrl ||
      card.dataset.href ||
      card.dataset.url;

    if (
      isQuestionHref(rawHref)
    ) {
      return makeTrigger(
        card,
        rawHref
      );
    }

    return null;
  }

  function makeTrigger(
    element,
    rawHref,
    linkElement
  ) {
    try {
      const url =
        new URL(
          rawHref,
          document.baseURI
        );

      return {
        element,
        link:
          linkElement ||
          (
            element.matches('a')
              ? element
              : null
          ),
        url,
      };
    } catch (_) {
      return null;
    }
  }

  function triggerTitle(trigger) {
    const source =
      trigger.link ||
      trigger.element;

    const explicit =
      source.getAttribute(
        'aria-label'
      ) ||
      source.getAttribute(
        'title'
      ) ||
      trigger.element.dataset
        .questionTitle ||
      trigger.element.querySelector(
        [
          '[data-question-title]',
          '.question-title',
          'h2',
          'h3',
          'h4',
        ].join(',')
      )?.textContent;

    const text =
      (
        explicit ||
        source.textContent ||
        'Question preview'
      )
        .replace(/\s+/g, ' ')
        .trim();

    return (
      text ||
      'Question preview'
    );
  }

  /* -------------------------------------------------------
     DISPLAY CONTENT
  ------------------------------------------------------- */

  function renderLoading(trigger) {
    const panel =
      ensurePopover();

    panel.querySelector(
      '.aasl-question-preview__title'
    ).textContent =
      triggerTitle(trigger);

    const body =
      panel.querySelector(
        '.aasl-question-preview__body'
      );

    body.dataset.zoomed =
      'false';

    body.dataset.panning =
      'false';

    body.innerHTML = `
      <div
        class="aasl-question-preview__status"
        aria-live="polite"
      >
        <span
          class="aasl-question-preview__spinner"
          aria-hidden="true"
        ></span>

        <span>
          Loading question preview…
        </span>
      </div>
    `;

    updateZoomIndicator(1);
  }

  function renderError() {
    if (!popover) {
      return;
    }

    const body =
      popover.querySelector(
        '.aasl-question-preview__body'
      );

    body.dataset.zoomed =
      'false';

    body.dataset.panning =
      'false';

    body.innerHTML = `
      <div class="aasl-question-preview__status">
        Preview unavailable.
        Click the question to open it.
      </div>
    `;

    updateZoomIndicator(1);

    queueReposition();
  }

  function renderImage(
    preview,
    trigger
  ) {
    if (!popover) {
      return;
    }

    const body =
      popover.querySelector(
        '.aasl-question-preview__body'
      );

    body.replaceChildren();

    const image =
      document.createElement('img');

    image.className =
      'aasl-question-preview__image';

    image.alt =
      preview.alt ||
      `${triggerTitle(trigger)} preview`;

    image.decoding =
      'async';

    image.draggable =
      false;

    image.src =
      preview.src;

    image.addEventListener(
      'load',
      queueReposition,
      {
        once: true,
      }
    );

    image.addEventListener(
      'error',
      renderError,
      {
        once: true,
      }
    );

    body.appendChild(image);

    setZoom(1);
  }

  function updateZoomIndicator(zoom) {
    if (!popover) {
      return;
    }

    const indicator =
      popover.querySelector(
        '.aasl-question-preview__zoom'
      );

    if (indicator) {
      indicator.textContent =
        `${Math.round(zoom * 100)}%`;
    }
  }

  /* -------------------------------------------------------
     ZOOM
  ------------------------------------------------------- */

  function handlePreviewWheel(event) {
    if (
      !popover ||
      popover.dataset.open !==
        'true'
    ) {
      return;
    }

    if (
      !popover.querySelector(
        '.aasl-question-preview__image'
      )
    ) {
      return;
    }

    event.preventDefault();

    const direction =
      event.deltaY < 0
        ? 1
        : -1;

    setZoom(
      zoomLevel +
        direction *
        CONFIG.zoomStep,
      event.clientX,
      event.clientY
    );
  }

  function handlePreviewControlClick(
    event
  ) {
    const button =
      event.target.closest(
        '[data-preview-zoom]'
      );

    if (
      !button ||
      !popover?.contains(button)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const action =
      button.dataset.previewZoom;

    if (action === 'in') {
      setZoom(
        zoomLevel +
          CONFIG.zoomStep
      );
    }

    if (action === 'out') {
      setZoom(
        zoomLevel -
          CONFIG.zoomStep
      );
    }

    if (action === 'reset') {
      setZoom(1);
    }

    /*
     * Mouse clicks otherwise leave focus on the button.
     * That focus would deliberately keep the preview alive.
     *
     * Keyboard activation has detail === 0, so keyboard
     * users retain normal focus behavior.
     */
    if (event.detail > 0) {
      button.blur();
    }
  }

  function setZoom(
    nextZoom,
    pointerX,
    pointerY
  ) {
    if (!popover) {
      return;
    }

    const body =
      popover.querySelector(
        '.aasl-question-preview__body'
      );

    const image =
      popover.querySelector(
        '.aasl-question-preview__image'
      );

    if (!body || !image) {
      return;
    }

    const oldZoom =
      zoomLevel;

    const newZoom =
      clamp(
        Math.round(
          nextZoom /
            CONFIG.zoomStep
        ) *
          CONFIG.zoomStep,

        CONFIG.minZoom,
        CONFIG.maxZoom
      );

    if (
      newZoom === oldZoom &&
      image.style.width
    ) {
      return;
    }

    const bodyRect =
      body.getBoundingClientRect();

    const focusX =
      Number.isFinite(pointerX)
        ? (
          pointerX -
          bodyRect.left +
          body.scrollLeft
        )
        : (
          body.clientWidth /
          2 +
          body.scrollLeft
        );

    const focusY =
      Number.isFinite(pointerY)
        ? (
          pointerY -
          bodyRect.top +
          body.scrollTop
        )
        : (
          body.clientHeight /
          2 +
          body.scrollTop
        );

    const ratio =
      newZoom /
      oldZoom;

    zoomLevel =
      newZoom;

    image.style.width =
      `${newZoom * 100}%`;

    image.style.maxHeight =
      newZoom === 1
        ? 'calc(min(76vh, 760px) - 73px)'
        : 'none';

    image.style.objectFit =
      newZoom === 1
        ? 'contain'
        : 'initial';

    updateZoomIndicator(
      newZoom
    );

    body.dataset.zoomed =
      newZoom > 1
        ? 'true'
        : 'false';

    if (newZoom === 1) {
      body.dataset.panning =
        'false';
    }

    requestAnimationFrame(
      () => {
        if (newZoom === 1) {
          body.scrollTo({
            left: 0,
            top: 0,
          });
        } else {
          const targetX =
            Number.isFinite(
              pointerX
            )
              ? (
                pointerX -
                bodyRect.left
              )
              : (
                body.clientWidth /
                2
              );

          const targetY =
            Number.isFinite(
              pointerY
            )
              ? (
                pointerY -
                bodyRect.top
              )
              : (
                body.clientHeight /
                2
              );

          body.scrollLeft =
            Math.max(
              0,
              focusX *
                ratio -
                targetX
            );

          body.scrollTop =
            Math.max(
              0,
              focusY *
                ratio -
                targetY
            );
        }

        queueReposition();
      }
    );
  }

  /* -------------------------------------------------------
     DRAG TO PAN
  ------------------------------------------------------- */

  function startPreviewPan(event) {
    if (
      event.button !== 0 ||
      zoomLevel <= 1 ||
      !popover
    ) {
      return;
    }

    const body =
      event.target.closest(
        '.aasl-question-preview__body'
      );

    if (
      !body ||
      !popover.contains(body)
    ) {
      return;
    }

    panState = {
      pointerId:
        event.pointerId,

      body,

      startX:
        event.clientX,

      startY:
        event.clientY,

      scrollLeft:
        body.scrollLeft,

      scrollTop:
        body.scrollTop,
    };

    body.dataset.panning =
      'true';

    body.setPointerCapture?.(
      event.pointerId
    );

    event.preventDefault();
  }

  function movePreviewPan(event) {
    if (
      !panState ||
      event.pointerId !==
        panState.pointerId
    ) {
      return;
    }

    panState.body.scrollLeft =
      panState.scrollLeft -
      (
        event.clientX -
        panState.startX
      );

    panState.body.scrollTop =
      panState.scrollTop -
      (
        event.clientY -
        panState.startY
      );

    event.preventDefault();
  }

  function endPreviewPan(event) {
    if (!panState) {
      return;
    }

    if (
      event.pointerId != null &&
      event.pointerId !==
        panState.pointerId
    ) {
      return;
    }

    panState.body.dataset.panning =
      'false';

    try {
      panState.body
        .releasePointerCapture?.(
          panState.pointerId
        );
    } catch (_) {
      /* no-op */
    }

    panState = null;
  }

  /* -------------------------------------------------------
     OPEN / CLOSE
  ------------------------------------------------------- */

  function showPanel() {
    const panel =
      ensurePopover();

    panel.hidden =
      false;

    panel.dataset.open =
      'true';

    panel.setAttribute(
      'aria-hidden',
      'false'
    );

    if (hoverBridge) {
      hoverBridge.dataset.open =
        'true';
    }

    queueReposition();
  }

  function hidePanel({
    immediate = false,
  } = {}) {
    window.clearTimeout(
      openTimer
    );

    window.clearTimeout(
      closeTimer
    );

    currentRequest += 1;

    currentTrigger =
      null;

    panState =
      null;

    if (hoverBridge) {
      hoverBridge.dataset.open =
        'false';
    }

    if (!popover) {
      return;
    }

    popover.dataset.open =
      'false';

    popover.setAttribute(
      'aria-hidden',
      'true'
    );

    if (immediate) {
      popover.hidden =
        true;

      return;
    }

    window.setTimeout(
      () => {
        if (
          popover &&
          popover.dataset.open !==
            'true'
        ) {
          popover.hidden =
            true;
        }
      },
      140
    );
  }

  function scheduleHide(trigger) {
    window.clearTimeout(
      openTimer
    );

    window.clearTimeout(
      closeTimer
    );

    closeTimer =
      window.setTimeout(
        () => {
          const triggerActive =
            trigger?.element.matches(
              ':hover'
            ) ||
            trigger?.element.contains(
              document.activeElement
            );

          const panelActive =
            popover?.matches(
              ':hover'
            ) ||
            popover?.contains(
              document.activeElement
            );

          const bridgeActive =
            hoverBridge?.matches(
              ':hover'
            );

          if (
            !triggerActive &&
            !panelActive &&
            !bridgeActive
          ) {
            hidePanel();
          }
        },
        CONFIG.closeDelayMs
      );
  }

  function scheduleOpen(
    trigger,
    delayMs
  ) {
    if (!trigger) {
      return;
    }

    window.clearTimeout(
      openTimer
    );

    window.clearTimeout(
      closeTimer
    );

    if (
      currentTrigger?.element ===
        trigger.element &&
      popover?.dataset.open ===
        'true'
    ) {
      queueReposition();
      return;
    }

    openTimer =
      window.setTimeout(
        () => {
          openPreview(trigger);
        },
        delayMs
      );
  }

  async function openPreview(trigger) {
    const requestId =
      ++currentRequest;

    currentTrigger =
      trigger;

    zoomLevel = 1;

    renderLoading(trigger);

    showPanel();

    const preview =
      await getPreview(trigger);

    if (
      requestId !==
        currentRequest ||
      currentTrigger?.element !==
        trigger.element
    ) {
      return;
    }

    if (preview?.src) {
      renderImage(
        preview,
        trigger
      );
    } else {
      renderError();
    }
  }

  /* -------------------------------------------------------
     POSITIONING
  ------------------------------------------------------- */

  function queueReposition() {
    if (
      !currentTrigger ||
      !popover ||
      popover.hidden
    ) {
      return;
    }

    window.cancelAnimationFrame(
      repositionFrame
    );

    repositionFrame =
      window.requestAnimationFrame(
        positionPopover
      );
  }

  function positionPopover() {
    if (
      !currentTrigger ||
      !popover ||
      popover.hidden
    ) {
      return;
    }

    if (
      !document.documentElement.contains(
        currentTrigger.element
      )
    ) {
      hidePanel({
        immediate: true,
      });

      return;
    }

    const margin =
      CONFIG.viewportMarginPx;

    const gap =
      CONFIG.previewGapPx;

    const anchor =
      currentTrigger.element
        .getBoundingClientRect();

    const panel =
      popover
        .getBoundingClientRect();

    const viewportWidth =
      document.documentElement
        .clientWidth;

    const viewportHeight =
      document.documentElement
        .clientHeight;

    if (
      anchor.bottom < 0 ||
      anchor.top >
        viewportHeight ||
      anchor.right < 0 ||
      anchor.left >
        viewportWidth
    ) {
      hidePanel({
        immediate: true,
      });

      return;
    }

    const roomRight =
      viewportWidth -
      anchor.right -
      gap -
      margin;

    const roomLeft =
      anchor.left -
      gap -
      margin;

    let left;
    let top;
    let placement;

    if (
      roomRight >=
      panel.width
    ) {
      placement = 'right';

      left =
        anchor.right +
        gap;

      top =
        anchor.top;

      popover.style.transformOrigin =
        'top left';
    } else if (
      roomLeft >=
      panel.width
    ) {
      placement = 'left';

      left =
        anchor.left -
        panel.width -
        gap;

      top =
        anchor.top;

      popover.style.transformOrigin =
        'top right';
    } else {
      left =
        clamp(
          anchor.left,
          margin,
          viewportWidth -
            panel.width -
            margin
        );

      const roomBelow =
        viewportHeight -
        anchor.bottom -
        gap -
        margin;

      const roomAbove =
        anchor.top -
        gap -
        margin;

      if (
        roomBelow >=
          panel.height ||
        roomBelow >=
          roomAbove
      ) {
        placement = 'below';

        top =
          anchor.bottom +
          gap;

        popover.style.transformOrigin =
          'top left';
      } else {
        placement = 'above';

        top =
          anchor.top -
          panel.height -
          gap;

        popover.style.transformOrigin =
          'bottom left';
      }
    }

    top =
      clamp(
        top,
        margin,
        viewportHeight -
          panel.height -
          margin
      );

    left =
      clamp(
        left,
        margin,
        viewportWidth -
          panel.width -
          margin
      );

    popover.style.left =
      `${Math.round(left)}px`;

    popover.style.top =
      `${Math.round(top)}px`;

    positionHoverBridge(
      anchor,
      {
        left,
        top,
        right:
          left +
          panel.width,
        bottom:
          top +
          panel.height,
        width:
          panel.width,
        height:
          panel.height,
      },
      placement
    );
  }

  /*
   * Create a transparent rectangle joining the result card
   * and preview. The rectangle intentionally overlaps both
   * ends slightly.
   *
   * This means a slow or diagonal mouse movement cannot
   * accidentally cross unowned page space.
   */
  function positionHoverBridge(
    anchor,
    panel,
    placement
  ) {
    if (!hoverBridge) {
      return;
    }

    const padding =
      CONFIG.bridgePaddingPx;

    let left;
    let top;
    let width;
    let height;

    if (
      placement === 'right'
    ) {
      left =
        Math.min(
          anchor.right,
          panel.left
        ) -
        padding;

      top =
        Math.min(
          anchor.top,
          panel.top
        ) -
        padding;

      width =
        Math.abs(
          panel.left -
          anchor.right
        ) +
        padding * 2;

      height =
        Math.max(
          anchor.height,
          panel.height
        ) +
        padding * 2;
    } else if (
      placement === 'left'
    ) {
      left =
        Math.min(
          panel.right,
          anchor.left
        ) -
        padding;

      top =
        Math.min(
          anchor.top,
          panel.top
        ) -
        padding;

      width =
        Math.abs(
          anchor.left -
          panel.right
        ) +
        padding * 2;

      height =
        Math.max(
          anchor.height,
          panel.height
        ) +
        padding * 2;
    } else if (
      placement === 'below'
    ) {
      left =
        Math.min(
          anchor.left,
          panel.left
        ) -
        padding;

      top =
        Math.min(
          anchor.bottom,
          panel.top
        ) -
        padding;

      width =
        Math.max(
          anchor.width,
          panel.width
        ) +
        padding * 2;

      height =
        Math.abs(
          panel.top -
          anchor.bottom
        ) +
        padding * 2;
    } else {
      left =
        Math.min(
          anchor.left,
          panel.left
        ) -
        padding;

      top =
        Math.min(
          panel.bottom,
          anchor.top
        ) -
        padding;

      width =
        Math.max(
          anchor.width,
          panel.width
        ) +
        padding * 2;

      height =
        Math.abs(
          anchor.top -
          panel.bottom
        ) +
        padding * 2;
    }

    /*
     * Because the preview overlaps the result by a few
     * pixels, width/height could otherwise become tiny.
     */
    width =
      Math.max(
        width,
        padding * 2
      );

    height =
      Math.max(
        height,
        padding * 2
      );

    hoverBridge.style.left =
      `${Math.round(left)}px`;

    hoverBridge.style.top =
      `${Math.round(top)}px`;

    hoverBridge.style.width =
      `${Math.round(width)}px`;

    hoverBridge.style.height =
      `${Math.round(height)}px`;
  }

  function clamp(
    value,
    min,
    max
  ) {
    if (max < min) {
      return min;
    }

    return Math.min(
      Math.max(
        value,
        min
      ),
      max
    );
  }

  /* -------------------------------------------------------
     PREVIEW CACHE
  ------------------------------------------------------- */

  function cacheKey(trigger) {
    return trigger.url.href
      .split('#')[0];
  }

  function rememberPreview(
    key,
    promise
  ) {
    if (
      previewCache.size >=
      CONFIG.maxCacheEntries
    ) {
      const oldestKey =
        previewCache
          .keys()
          .next()
          .value;

      previewCache.delete(
        oldestKey
      );
    }

    previewCache.set(
      key,
      promise
    );

    return promise;
  }

  function getPreview(trigger) {
    const key =
      cacheKey(trigger);

    if (
      previewCache.has(key)
    ) {
      return previewCache.get(
        key
      );
    }

    const promise =
      resolvePreview(trigger)
        .catch(
          () => null
        )
        .then(
          (preview) => {
            if (!preview) {
              previewCache.delete(
                key
              );
            }

            return preview;
          }
        );

    return rememberPreview(
      key,
      promise
    );
  }

  /* -------------------------------------------------------
     FIND PREVIEW IMAGE
  ------------------------------------------------------- */

  async function resolvePreview(trigger) {
    const identifiers =
      collectIdentifiers(trigger);

    const direct =
      previewFromTriggerAttributes(
        trigger
      );

    if (direct) {
      return direct;
    }

    const fromData =
      previewFromGlobalData(
        identifiers,
        trigger.url
      );

    if (fromData) {
      return fromData;
    }

    const fetched =
      await previewFromFetchedHtml(
        trigger.url,
        identifiers
      );

    if (fetched) {
      return fetched;
    }

    return previewFromRenderedPage(
      trigger.url
    );
  }

  function previewFromTriggerAttributes(
    trigger
  ) {
    const sources =
      [
        trigger.element,
        trigger.link,
      ].filter(Boolean);

    for (const source of sources) {
      for (
        const attribute
        of DATA_IMAGE_ATTRIBUTES
      ) {
        const value =
          source.dataset?.[
            attribute
          ];

        if (
          isImageString(value) &&
          !NEGATIVE_IMAGE_RE.test(
            value
          )
        ) {
          return {
            src:
              resolveImageUrl(
                value,
                trigger.url
              ),

            alt: '',
          };
        }
      }

      const inlineImage =
        source.querySelector?.(
          [
            'img[data-question-image]',
            'img.question-image',
            '[data-preview] img',
            'img[data-preview-src]',
          ].join(',')
        );

      const rawSrc =
        inlineImage?.dataset
          .previewSrc ||
        inlineImage?.getAttribute(
          'src'
        );

      if (
        isImageString(rawSrc) &&
        !NEGATIVE_IMAGE_RE.test(
          rawSrc
        )
      ) {
        return {
          src:
            resolveImageUrl(
              rawSrc,
              trigger.url
            ),

          alt:
            inlineImage
              .getAttribute('alt') ||
            '',
        };
      }
    }

    return null;
  }

  function collectIdentifiers(trigger) {
    const values =
      new Set();

    const add = (value) => {
      if (
        value == null ||
        value === ''
      ) {
        return;
      }

      const normalized =
        normalizeIdentity(value);

      if (normalized) {
        values.add(normalized);
      }
    };

    const pathname =
      decodeURIComponent(
        trigger.url.pathname
      );

    const basename =
      pathname
        .split('/')
        .filter(Boolean)
        .pop() ||
      '';

    add(trigger.url.href);
    add(pathname);
    add(basename);

    add(
      basename.replace(
        /\.html?$/i,
        ''
      )
    );

    for (
      const source
      of [
        trigger.element,
        trigger.link,
      ].filter(Boolean)
    ) {
      for (
        const [key, value]
        of Object.entries(
          source.dataset || {}
        )
      ) {
        if (
          /(?:question|qid|slug|key|id|file|path|url|href)/i.test(
            key
          )
        ) {
          add(value);
        }
      }
    }

    return values;
  }

  function normalizeIdentity(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(
        /^https?:\/\/[^/]+/i,
        ''
      )
      .replace(
        /[?#].*$/,
        ''
      )
      .replace(
        /\.html?$/i,
        ''
      )
      .replace(
        /^\.?\/?/,
        ''
      )
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );
  }

  function globalDataRoots() {
    const roots = [];
    const added = new Set();

    const add = (
      key,
      value
    ) => {
      if (
        !value ||
        typeof value !==
          'object' ||
        added.has(value)
      ) {
        return;
      }

      added.add(value);

      roots.push([
        key,
        value,
      ]);
    };

    for (
      const key
      of GLOBAL_DATA_KEYS
    ) {
      add(
        key,
        window[key]
      );
    }

    if (
      typeof AASL_DATA !==
      'undefined'
    ) {
      add(
        'AASL_DATA',
        AASL_DATA
      );
    }

    if (
      typeof AASL_QUESTIONS !==
      'undefined'
    ) {
      add(
        'AASL_QUESTIONS',
        AASL_QUESTIONS
      );
    }

    if (
      typeof QUESTION_BANK !==
      'undefined'
    ) {
      add(
        'QUESTION_BANK',
        QUESTION_BANK
      );
    }

    if (
      typeof QUESTION_DATA !==
      'undefined'
    ) {
      add(
        'QUESTION_DATA',
        QUESTION_DATA
      );
    }

    if (
      typeof QUESTIONS !==
      'undefined'
    ) {
      add(
        'QUESTIONS',
        QUESTIONS
      );
    }

    return roots;
  }

  function previewFromGlobalData(
    identifiers,
    pageUrl
  ) {
    let best = null;

    const seen =
      new WeakSet();

    for (
      const [key, root]
      of globalDataRoots()
    ) {
      if (
        !root ||
        typeof root !==
          'object'
      ) {
        continue;
      }

      searchData(
        root,
        key,
        0
      );
    }

    return best
      ? {
        src:
          resolveImageUrl(
            best.src,
            pageUrl
          ),

        alt:
          best.alt || '',
      }
      : null;

    function searchData(
      value,
      parentKey,
      depth
    ) {
      if (
        !value ||
        depth > 6
      ) {
        return;
      }

      if (
        typeof value !==
        'object'
      ) {
        return;
      }

      if (
        seen.has(value)
      ) {
        return;
      }

      seen.add(value);

      if (
        !Array.isArray(value)
      ) {
        const identityScore =
          scoreRecordIdentity(
            value,
            parentKey,
            identifiers
          );

        if (
          identityScore > 0
        ) {
          const image =
            bestImageInObject(
              value
            );

          if (image) {
            const score =
              identityScore +
              image.score;

            if (
              !best ||
              score >
                best.score
            ) {
              best = {
                ...image,
                score,
              };
            }
          }
        }
      }

      if (
        Array.isArray(value)
      ) {
        for (
          const item
          of value
        ) {
          searchData(
            item,
            parentKey,
            depth + 1
          );
        }
      } else {
        for (
          const [key, child]
          of Object.entries(
            value
          )
        ) {
          if (
            child &&
            typeof child ===
              'object'
          ) {
            searchData(
              child,
              key,
              depth + 1
            );
          }
        }
      }
    }
  }

  function scoreRecordIdentity(
    record,
    parentKey,
    identifiers
  ) {
    let score = 0;

    const parentIdentity =
      normalizeIdentity(
        parentKey || ''
      );

    if (
      parentIdentity &&
      identitySimilarity(
        parentIdentity,
        identifiers
      )
    ) {
      score =
        Math.max(
          score,
          90
        );
    }

    for (
      const [key, value]
      of Object.entries(record)
    ) {
      if (
        !IDENTITY_KEYS_RE.test(
          key
        ) ||
        (
          typeof value !==
            'string' &&
          typeof value !==
            'number'
        )
      ) {
        continue;
      }

      const normalized =
        normalizeIdentity(value);

      const similarity =
        identitySimilarity(
          normalized,
          identifiers
        );

      if (
        similarity === 2
      ) {
        score =
          Math.max(
            score,
            140
          );
      } else if (
        similarity === 1
      ) {
        score =
          Math.max(
            score,
            80
          );
      }
    }

    return score;
  }

  function identitySimilarity(
    candidate,
    identifiers
  ) {
    if (!candidate) {
      return 0;
    }

    for (
      const identifier
      of identifiers
    ) {
      if (
        candidate ===
        identifier
      ) {
        return 2;
      }

      if (
        candidate.length >= 7 &&
        identifier.length >= 7 &&
        (
          candidate.endsWith(
            identifier
          ) ||
          identifier.endsWith(
            candidate
          )
        )
      ) {
        return 1;
      }
    }

    return 0;
  }

  function bestImageInObject(record) {
    let best = null;

    const visited =
      new WeakSet();

    walk(
      record,
      '',
      0
    );

    return best;

    function walk(
      value,
      keyPath,
      depth
    ) {
      if (
        depth > 3 ||
        value == null
      ) {
        return;
      }

      if (
        typeof value ===
        'string'
      ) {
        if (
          !isImageString(value)
        ) {
          return;
        }

        const score =
          scoreImageString(
            value,
            keyPath
          );

        if (
          score > 0 &&
          (
            !best ||
            score >
              best.score
          )
        ) {
          best = {
            src: value,
            alt: '',
            score,
          };
        }

        return;
      }

      if (
        typeof value !==
          'object' ||
        visited.has(value)
      ) {
        return;
      }

      visited.add(value);

      if (
        Array.isArray(value)
      ) {
        for (
          let i = 0;
          i < value.length;
          i += 1
        ) {
          walk(
            value[i],
            `${keyPath}[${i}]`,
            depth + 1
          );
        }
      } else {
        for (
          const [key, child]
          of Object.entries(
            value
          )
        ) {
          walk(
            child,
            keyPath
              ? `${keyPath}.${key}`
              : key,
            depth + 1
          );
        }
      }
    }
  }

  function scoreImageString(
    src,
    context
  ) {
    const combined =
      `${context} ${src}`;

    if (
      NEGATIVE_IMAGE_RE.test(
        combined
      )
    ) {
      return -200;
    }

    let score = 15;

    if (
      POSITIVE_IMAGE_RE.test(
        context
      )
    ) {
      score += 115;
    }

    if (
      POSITIVE_IMAGE_RE.test(
        src
      )
    ) {
      score += 65;
    }

    if (
      /questions?\//i.test(
        src
      )
    ) {
      score += 35;
    }

    if (
      /thumb/i.test(
        combined
      )
    ) {
      score -= 10;
    }

    return score;
  }

  async function previewFromFetchedHtml(
    url,
    identifiers
  ) {
    let response;

    try {
      response =
        await fetch(
          url.href,
          {
            credentials:
              'same-origin',

            headers: {
              Accept:
                'text/html',
            },
          }
        );
    } catch (_) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const html =
      await response.text();

    const parsed =
      new DOMParser()
        .parseFromString(
          html,
          'text/html'
        );

    for (
      const element
      of [
        parsed.body,
        parsed.documentElement,
      ]
    ) {
      if (!element) {
        continue;
      }

      for (
        const [key, value]
        of Object.entries(
          element.dataset || {}
        )
      ) {
        if (
          /(?:question|qid|slug|key|id)/i.test(
            key
          )
        ) {
          identifiers.add(
            normalizeIdentity(value)
          );
        }
      }
    }

    const fromData =
      previewFromGlobalData(
        identifiers,
        url
      );

    if (fromData) {
      return fromData;
    }

    const metaImage =
      parsed.querySelector(
        [
          'meta[name="question-image"]',
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
        ].join(',')
      )?.getAttribute(
        'content'
      );

    if (
      isImageString(metaImage) &&
      !NEGATIVE_IMAGE_RE.test(
        metaImage
      )
    ) {
      return {
        src:
          resolveImageUrl(
            metaImage,
            url
          ),

        alt: '',
      };
    }

    return chooseBestImage(
      parsed,
      url,
      {
        requireStrongSignal:
          true,
      }
    );
  }

  function previewFromRenderedPage(url) {
    if (
      url.origin !==
      window.location.origin
    ) {
      return Promise.resolve(
        null
      );
    }

    return new Promise(
      (resolve) => {
        const frame =
          document.createElement(
            'iframe'
          );

        const startedAt =
          Date.now();

        let finished = false;
        let scanTimer = 0;

        const finish =
          (value) => {
            if (finished) {
              return;
            }

            finished = true;

            window.clearTimeout(
              scanTimer
            );

            frame.remove();

            resolve(
              value || null
            );
          };

        const scan =
          () => {
            if (finished) {
              return;
            }

            let frameDocument;

            try {
              frameDocument =
                frame.contentDocument;
            } catch (_) {
              finish(null);
              return;
            }

            if (frameDocument) {
              prepareRenderedImages(
                frameDocument
              );

              const image =
                chooseBestImage(
                  frameDocument,
                  url,
                  {
                    requireStrongSignal:
                      false,
                  }
                );

              if (image) {
                finish(image);
                return;
              }
            }

            if (
              Date.now() -
              startedAt >=
              CONFIG.renderedPageTimeoutMs
            ) {
              finish(null);
              return;
            }

            scanTimer =
              window.setTimeout(
                scan,
                120
              );
          };

        frame.setAttribute(
          'aria-hidden',
          'true'
        );

        frame.tabIndex = -1;

        frame.style.cssText = [
          'position:fixed',
          'left:-10000px',
          'top:0',
          'width:1200px',
          'height:900px',
          'visibility:hidden',
          'pointer-events:none',
          'border:0',
        ].join(';');

        frame.addEventListener(
          'load',
          scan,
          {
            once: true,
          }
        );

        frame.addEventListener(
          'error',
          () => {
            finish(null);
          },
          {
            once: true,
          }
        );

        frame.src =
          url.href;

        document.body.appendChild(
          frame
        );

        scanTimer =
          window.setTimeout(
            scan,
            250
          );
      }
    );
  }

  function prepareRenderedImages(
    frameDocument
  ) {
    for (
      const image
      of frameDocument
        .querySelectorAll('img')
    ) {
      image.loading =
        'eager';

      if (
        !image.getAttribute('src')
      ) {
        const deferredSrc =
          image.dataset.src ||
          image.dataset.lazySrc ||
          image.dataset.original;

        if (deferredSrc) {
          image.setAttribute(
            'src',
            deferredSrc
          );
        }
      }
    }
  }

  function chooseBestImage(
    root,
    pageUrl,
    {
      requireStrongSignal,
    }
  ) {
    const candidates =
      Array.from(
        root.querySelectorAll('img')
      );

    let best = null;

    for (
      const image
      of candidates
    ) {
      const rawSrc =
        image.currentSrc ||
        image.getAttribute('src') ||
        image.dataset.src;

      if (
        !rawSrc ||
        rawSrc.startsWith(
          'data:image/svg+xml'
        )
      ) {
        continue;
      }

      const descriptors =
        [
          rawSrc,
          image.getAttribute('alt') || '',
          image.id || '',
          image.className || '',
          image.closest(
            '[class], [id]'
          )?.className || '',
          image.closest(
            '[class], [id]'
          )?.id || '',
        ].join(' ');

      if (
        NEGATIVE_IMAGE_RE.test(
          descriptors
        )
      ) {
        continue;
      }

      let score =
        scoreImageString(
          rawSrc,
          descriptors
        );

      const width =
        image.naturalWidth ||
        Number(
          image.getAttribute('width')
        ) ||
        0;

      const height =
        image.naturalHeight ||
        Number(
          image.getAttribute('height')
        ) ||
        0;

      const visible =
        image.getClientRects?.()
          .length > 0;

      if (
        POSITIVE_IMAGE_RE.test(
          descriptors
        )
      ) {
        score += 90;
      }

      if (
        image.closest(
          [
            'main',
            '[role="main"]',
            '.question',
            '.question-view',
            '.question-page',
          ].join(',')
        )
      ) {
        score += 40;
      }

      if (visible) {
        score += 35;
      }

      if (width >= 320) {
        score += 25;
      }

      if (height >= 100) {
        score += 15;
      }

      score +=
        Math.min(
          (
            width *
            height
          ) /
            120000,
          35
        );

      if (
        requireStrongSignal &&
        !POSITIVE_IMAGE_RE.test(
          descriptors
        ) &&
        !/questions?\//i.test(
          rawSrc
        )
      ) {
        continue;
      }

      if (score < 55) {
        continue;
      }

      if (
        !best ||
        score > best.score
      ) {
        best = {
          src:
            resolveImageUrl(
              rawSrc,
              pageUrl
            ),

          alt:
            image.getAttribute(
              'alt'
            ) || '',

          score,
        };
      }
    }

    return (
      best &&
      best.src
    )
      ? {
        src: best.src,
        alt: best.alt,
      }
      : null;
  }

  function isImageString(value) {
    if (
      typeof value !==
        'string' ||
      !value.trim()
    ) {
      return false;
    }

    const trimmed =
      value.trim();

    return (
      IMAGE_FILE_RE.test(
        trimmed
      ) ||
      /^data:image\/(?!svg\+xml)/i.test(
        trimmed
      )
    );
  }

  function resolveImageUrl(
    rawSrc,
    pageUrl
  ) {
    const value =
      String(rawSrc).trim();

    if (
      /^(?:data:|blob:|https?:\/\/)/i.test(
        value
      )
    ) {
      return value;
    }

    if (
      value.startsWith('/')
    ) {
      return new URL(
        value,
        window.location.origin
      ).href;
    }

    if (
      /^(?:assets|questions|exams|question-bank)\//i.test(
        value
      )
    ) {
      return new URL(
        value,
        document.baseURI
      ).href;
    }

    return new URL(
      value,
      pageUrl
    ).href;
  }

  /* -------------------------------------------------------
     EVENTS
  ------------------------------------------------------- */

  function onPointerOver(event) {
    if (
      !finePointerQuery.matches ||
      event.pointerType ===
        'touch'
    ) {
      return;
    }

    const trigger =
      findQuestionTrigger(
        event.target
      );

    if (!trigger) {
      return;
    }

    if (
      event.relatedTarget
        instanceof Node &&
      trigger.element.contains(
        event.relatedTarget
      )
    ) {
      return;
    }

    scheduleOpen(
      trigger,
      CONFIG.openDelayMs
    );
  }

  function onPointerOut(event) {
    if (
      !finePointerQuery.matches ||
      event.pointerType ===
        'touch'
    ) {
      return;
    }

    const trigger =
      findQuestionTrigger(
        event.target
      );

    if (!trigger) {
      return;
    }

    if (
      event.relatedTarget
        instanceof Node &&
      trigger.element.contains(
        event.relatedTarget
      )
    ) {
      return;
    }

    scheduleHide(trigger);
  }

  function onFocusIn(event) {
    const trigger =
      findQuestionTrigger(
        event.target
      );

    if (trigger) {
      scheduleOpen(
        trigger,
        CONFIG.focusDelayMs
      );
    }
  }

  function onFocusOut(event) {
    const trigger =
      findQuestionTrigger(
        event.target
      );

    if (!trigger) {
      return;
    }

    if (
      event.relatedTarget
        instanceof Node &&
      trigger.element.contains(
        event.relatedTarget
      )
    ) {
      return;
    }

    scheduleHide(trigger);
  }

  function onKeyDown(event) {
    if (
      event.key === 'Escape' &&
      popover?.dataset.open ===
        'true'
    ) {
      hidePanel({
        immediate: true,
      });
    }
  }

  function onClick(event) {
    if (
      popover?.contains(
        event.target
      )
    ) {
      return;
    }

    if (
      findQuestionTrigger(
        event.target
      )
    ) {
      hidePanel({
        immediate: true,
      });
    }
  }

  /* -------------------------------------------------------
     INITIALIZE
  ------------------------------------------------------- */

  function init() {
    injectStyles();

    document.addEventListener(
      'pointerover',
      onPointerOver,
      true
    );

    document.addEventListener(
      'pointerout',
      onPointerOut,
      true
    );

    document.addEventListener(
      'focusin',
      onFocusIn,
      true
    );

    document.addEventListener(
      'focusout',
      onFocusOut,
      true
    );

    document.addEventListener(
      'keydown',
      onKeyDown,
      true
    );

    document.addEventListener(
      'click',
      onClick,
      true
    );

    window.addEventListener(
      'resize',
      queueReposition,
      {
        passive: true,
      }
    );

    window.addEventListener(
      'scroll',
      queueReposition,
      {
        passive: true,
        capture: true,
      }
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true,
      }
    );
  } else {
    init();
  }
})();