// ==UserScript==
// @name         GSC Top Queries Tools
// @namespace    https://github.com/srteamseo/seo-tools/
// @version      1.1
// @description  Select queries in GSC and copy or open in Ahrefs
// @match        https://search.google.com/*search-console/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    let lastUrl = location.href;

    function init() {
        injectCheckboxes();
        addButtons();
    }

    function injectCheckboxes() {
        const rows = document.querySelectorAll('table tbody tr');

        rows.forEach(row => {
            if (row.dataset.checkboxInjected === "true") return;

            const firstCell = row.querySelector('td');
            if (!firstCell) return;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'gsc-query-checkbox';
            checkbox.style.marginRight = '8px';
            checkbox.style.cursor = 'pointer';

            checkbox.addEventListener('click', e => e.stopPropagation());
            checkbox.addEventListener('mousedown', e => e.stopPropagation());

            firstCell.prepend(checkbox);
            row.dataset.checkboxInjected = "true";
        });
    }

    function getSelectedQueries() {
        const selected = [];
        document.querySelectorAll('.gsc-query-checkbox:checked').forEach(cb => {
            const row = cb.closest('tr');
            const queryText = row.querySelector('td').innerText.trim();
            selected.push(queryText);
        });
        return selected;
    }

    function getActiveDimension() {
        const activeTab = document.querySelector('div[role="tab"][aria-selected="true"]');
        if (activeTab) {
            const label = activeTab.textContent.trim().toLowerCase();
            if (label.includes('page')) return 'page';
            if (label.includes('quer')) return 'query';
            if (label.includes('countr')) return 'country';
            if (label.includes('device')) return 'device';
        }
        // Fallback to URL param if the tab can't be found
        return new URL(location.href).searchParams.get('breakdown') || 'query';
    }

    function buildRowUrl(value) {
        const currentUrl = new URL(location.href);
        const params = currentUrl.searchParams;

        const currentBreakdown = getActiveDimension();
        const encodedValue = encodeURIComponent(`!${value}`);

        // Preserve the /u/#/ prefix from the original path
        const pathMatch = currentUrl.pathname.match(/^(\/u\/\d+)?(\/search-console\/.*)$/);
        const prefix = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        const basePath = pathMatch ? pathMatch[2] : currentUrl.pathname;

        const newParams = new URLSearchParams(params);

        let targetKey;
        if (currentBreakdown === 'page') {
            // Table is showing pages: clicking a row's page value
            targetKey = 'page';
            newParams.set('page', encodedValue);
            newParams.set('breakdown', 'query');
        } else {
            // Table is showing queries (breakdown is query or unset): clicking a row's query text
            targetKey = 'query';
            newParams.set('query', encodedValue);
            newParams.set('breakdown', 'page');
        }

        // URLSearchParams will double-encode our already-encoded value; rebuild manually
        const parts = [];
        newParams.forEach((val, key) => {
            if (key === targetKey) {
                parts.push(`${key}=${encodedValue}`);
            } else {
                parts.push(`${key}=${encodeURIComponent(val)}`);
            }
        });

        return `${currentUrl.origin}${prefix}${basePath}?${parts.join('&')}`;
    }

    function addButtons() {
        if (document.getElementById('gsc-tools-container')) return;

        const container = document.createElement('div');
        container.id = 'gsc-tools-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.gap = '10px';

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Selected';
        styleButton(copyBtn, '#1a73e8');

        copyBtn.onclick = () => {
            const selected = getSelectedQueries();
            if (!selected.length) {
                alert('No queries selected.');
                return;
            }
            GM_setClipboard(selected.join('\n'));
        };

        // Copy with commas button
        const copyCommaBtn = document.createElement('button');
        copyCommaBtn.textContent = 'Copy with Commas';
        styleButton(copyCommaBtn, '#1a73e8');

        copyCommaBtn.onclick = () => {
            const selected = getSelectedQueries();
            if (!selected.length) {
                alert('No queries selected.');
                return;
            }
            GM_setClipboard(selected.join(', '));
        };

        // Open GSC rows button
        const openRowsBtn = document.createElement('button');
        openRowsBtn.textContent = 'Open Rows (Background)';
        styleButton(openRowsBtn, '#34a853');

        openRowsBtn.onclick = () => {
            const selected = getSelectedQueries();
            if (!selected.length) {
                alert('No queries selected.');
                return;
            }

            selected.forEach(value => {
                const url = buildRowUrl(value);
                GM_openInTab(url, { active: false, insert: true, setParent: true });
            });
        };

        // Ahrefs button
        const ahrefsBtn = document.createElement('button');
        ahrefsBtn.textContent = 'Ahrefs (Matching Terms)';
        styleButton(ahrefsBtn, '#ff8800');

        ahrefsBtn.onclick = () => {
            const selected = getSelectedQueries();
            if (!selected.length) {
                alert('No queries selected.');
                return;
            }

            selected.forEach((keyword, i) => {
                const encoded = encodeURIComponent(keyword);
                const url = `https://app.ahrefs.com/keywords-explorer/google/nz/overview?keyword=${encoded}`;
                setTimeout(() => window.open(url, '_blank'), i * 200); // 200ms delay per tab
            });
        };

        // Ahrefs site button
        const ahrefsSiteBtn = document.createElement('button');
        ahrefsSiteBtn.textContent = 'Ahrefs (Site)';
        styleButton(ahrefsSiteBtn, '#ff8800');

        ahrefsSiteBtn.onclick = () => {
            const selected = getSelectedQueries();
            if (!selected.length) {
                alert('No queries selected.');
                return;
            }

            selected.forEach((keyword, i) => {
                const encoded = encodeURIComponent(keyword);
                const url = `https://app.ahrefs.com/v2-site-explorer/overview?mode=prefix&target=${encoded}`;
                setTimeout(() => window.open(url, '_blank'), i * 200); // 200ms delay per tab
            });
        };

        container.appendChild(copyBtn);
        container.appendChild(copyCommaBtn);
        container.appendChild(openRowsBtn);
        container.appendChild(ahrefsBtn);
        container.appendChild(ahrefsSiteBtn);
        document.body.appendChild(container);
    }

    function styleButton(btn, color) {
        btn.style.padding = '10px 14px';
        btn.style.background = color;
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    }

    function clearCheckboxes() {
        document.querySelectorAll('.gsc-query-checkbox').forEach(cb => cb.checked = false);
    }

    // Observe dynamic content changes
    const observer = new MutationObserver(() => {
        injectCheckboxes();

        // Clear checkboxes when URL changes (new page/filter)
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            clearCheckboxes();
            setTimeout(init, 500); // re-initialize buttons/checkboxes
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', () => setTimeout(init, 1000));

})();
