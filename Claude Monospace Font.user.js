// ==UserScript==
// @name         Claude Monospace Font
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Change Claude's font-family to monospace
// @author       You
// @match        https://claude.ai/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS to override font-family
    const style = document.createElement('style');
    style.textContent = `
    :root {
--font-claude-response: monospace !important;
--font-anthropic-serif: monospace;
    }
    * {border-radius: 0px !important}
    span[data-new-page-greeting-text], div[data-new-page-greeting-spark] {display: none}
    div[data-state] {font-family: monospace !important}
    h1, h2, h3 {monospace !important}
    button {border-radius: 0px !important}
    .dframe-sidebar, aside, .font-small {font-family: monospace; line-height: 1em}
    .dframe-sidebar[data-density="comfortable"]{
    --df-row-h: 1.5em;
--df-row-icon-size: 0px;
--df-group-pt: 0px;
    }


    `;
    document.documentElement.appendChild(style);
})();
