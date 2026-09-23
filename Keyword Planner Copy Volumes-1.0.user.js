// ==UserScript==
// @name         Keyword Planner Copy Volumes
// @namespace    https://github.com/srteamseo/seo-tools/
// @version      1.1
// @description  Adds "Copy SV" and "Copy KW/SV" buttons next to the existing Copy button when keywords are selected in Google Keyword Planner, and overrides the native Copy button to match on-screen order.
// @author       you
// @match        https://ads.google.com/aw/keywordplanner/*
// @match        https://ads.google.com/*keywordplanner*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // --- Utilities -------------------------------------------------------

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error('Copy failed', e);
    }
    document.body.removeChild(ta);
  }

  // --- Finding the data table & selected rows --------------------------

  function findKeywordTable() {
    // Rows are div.particle-table-row[role="row"]; find their common ancestor.
    const anyRow = document.querySelector('.particle-table-row[role="row"]');
    if (!anyRow) return null;
    // Walk up to a reasonably stable ancestor that contains all rows.
    return anyRow.closest('[role="grid"], [role="table"], .particle-table, body') || document.body;
  }

  function getSelectedRows(tableEl) {
    const scope = tableEl || document;
    return Array.from(scope.querySelectorAll('div.particle-table-row.particle-row-selected[role="row"]'));
  }

  function getCellByField(row, essfield) {
    return row.querySelector(`[essfield="${essfield}"]`);
  }

  function getKeywordText(row) {
    const cell = getCellByField(row, 'text');
    if (!cell) return '';
    const span = cell.querySelector('.keyword');
    return (span ? span.innerText : cell.innerText || '').trim();
  }

  function getVolumeText(row) {
    const cell = getCellByField(row, 'search_volume');
    if (!cell) return '';
    const span = cell.querySelector('.value-text');
    return (span ? span.innerText : cell.innerText || '').trim();
  }

  function getSelectedKeywordData() {
    const tableEl = findKeywordTable();
    if (!tableEl) return [];

    const selectedRows = getSelectedRows(tableEl);

    return selectedRows
      .map((row) => ({
        keyword: getKeywordText(row),
        volume: getVolumeText(row),
      }))
      .filter((d) => d.keyword || d.volume);
  }

  // --- Finding the existing Copy button / toolbar ----------------------

  function findExistingCopyButton() {
    // Real markup: <material-button ... aria-label="Copy to clipboard" role="button">
    return document.querySelector('material-button[aria-label="Copy to clipboard"]');
  }

  // --- Overriding the native Copy button ---------------------------------
  // Google's native copy button doesn't preserve on-screen row order (it
  // appears to use some other internal ordering). This script's own
  // getSelectedKeywordData() reads rows via querySelectorAll, which matches
  // what's visually on screen. So we replace the native button's handler
  // with our own, keeping its keyword-only output but sourced the same way
  // as "Copy KW/SV".

  function overrideNativeCopyButton() {
    const nativeBtn = findExistingCopyButton();
    if (!nativeBtn || nativeBtn.hasAttribute('data-kp-copy-overridden')) return null;

    const replacement = nativeBtn.cloneNode(true);
    replacement.setAttribute('data-kp-copy-overridden', 'true');

    replacement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const data = getSelectedKeywordData();
      if (data.length === 0) return;
      const text = data.map((d) => d.keyword).join('\n');
      copyToClipboard(text);
    });

    nativeBtn.replaceWith(replacement);
    return replacement;
  }

  // --- Building our buttons ---------------------------------------------

  function makeButton(referenceBtn, label, onClick) {
    const btn = referenceBtn.cloneNode(true);
    btn.removeAttribute('id');
    btn.removeAttribute('data-kp-copy-overridden');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('data-kp-copy-extra', label);
    btn.title = label;

    // Swap the visible label text, keep the icon markup intact.
    const span = btn.querySelector('span');
    if (span) {
      span.textContent = label;
    }

    // Stack icon above label instead of the default side-by-side layout.
    const content = btn.querySelector('.content');
    if (content) {
      content.style.flexDirection = 'column';
      content.style.gap = '2px';
    }

    // Angular's own click handlers don't come along with cloneNode, so this
    // is the only listener that will fire.
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  function injectButtons() {
    // Avoid duplicate injection
    if (document.querySelector('[data-kp-copy-extra="Copy SV"]')) return;

    const copyBtn = findExistingCopyButton();
    if (!copyBtn) return;

    // Replace the native Copy button so its output order matches the
    // on-screen order too (see overrideNativeCopyButton above).
    overrideNativeCopyButton();
    const copyBtnFresh = findExistingCopyButton();
    if (!copyBtnFresh) return;

    // Walk up to the outer ".element" wrapper so our buttons sit in the same
    // toolbar row/flex context as the existing Copy button.
    const copyBtnContainer = copyBtnFresh.closest('.element') || copyBtnFresh.parentElement;
    if (!copyBtnContainer || !copyBtnContainer.parentElement) return;

    const copyVolumeBtn = makeButton(copyBtnFresh, 'Copy SV', () => {
      const data = getSelectedKeywordData();
      if (data.length === 0) return;
      const text = data.map((d) => d.volume).join('\n');
      copyToClipboard(text);
    });

    const copyKeywordVolumeBtn = makeButton(copyBtnFresh, 'Copy KW/SV', () => {
      const data = getSelectedKeywordData();
      if (data.length === 0) return;
      const text = data.map((d) => `${d.keyword} (${d.volume})`).join('\n');
      copyToClipboard(text);
    });

    // Wrap each clone in its own ".element" container, matching the
    // structure of the surrounding toolbar buttons.
    const wrapVolume = document.createElement('div');
    wrapVolume.className = 'element';
    wrapVolume.appendChild(copyVolumeBtn);

    const wrapKeywordVolume = document.createElement('div');
    wrapKeywordVolume.className = 'element';
    wrapKeywordVolume.appendChild(copyKeywordVolumeBtn);

    copyBtnContainer.insertAdjacentElement('afterend', wrapVolume);
    wrapVolume.insertAdjacentElement('afterend', wrapKeywordVolume);

    // Job done — no need to keep observing the whole page.
    observer.disconnect();
  }

  // --- Observe DOM for the toolbar/table appearing dynamically ----------

  const debouncedInject = debounce(injectButtons, 50);

  const observer = new MutationObserver(() => {
    // Cheap bail-out: skip work entirely once our buttons already exist.
    if (document.querySelector('[data-kp-copy-extra="Copy SV"]')) return;
    debouncedInject();
  });

  function startObserving() {
    observer.observe(document.body, { childList: true, subtree: true });
    debouncedInject();
  }

  if (document.body) {
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  }
})();
