// ==UserScript==
// @name         Claude Projects Compact Rows
// @namespace    claude-compact-projects
// @version      1.0
// @description  Show Claude project cards as compact single-line rows, no descriptions
// @match        https://claude.ai/cowork/projects*
// @match        https://claude.ai/projects*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STYLE_ID = 'ccp-style';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      ul[aria-label="Projects"] {
        display: block !important;
      }
      ul[aria-label="Projects"] > li {
        height: auto !important;
        border-bottom: 1px solid #c9c9c9;
      }
      ul[aria-label="Projects"] > li:last-child {
        border-bottom: none;
      }
      ul[aria-label="Projects"] > li [data-grid-cell] {
        min-height: unset !important;
        padding: 8px 12px !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      ul[aria-label="Projects"] .line-clamp-3 {
        display: none !important;
      }
      ul[aria-label="Projects"] > li > div[data-grid-cell] {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
      }
      ul[aria-label="Projects"] > li > div[data-grid-cell] > div:first-of-type {
        padding-right: 2.5rem !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
      ul[aria-label="Projects"] > li > div[data-grid-cell] > div.mt-auto {
        margin-top: 0 !important;
        margin-left: auto !important;
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        gap: 0.5rem !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyle);
  } else {
    injectStyle();
  }
})();
