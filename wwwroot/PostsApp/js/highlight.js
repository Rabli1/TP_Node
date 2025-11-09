window.HighlightUtils = (function () {
    const minKeywordLength = 3;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function removeDiacritics(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function normalizeTokens(value) {
        if (!value) return [];
        return value
            .split(/\s+/)
            .map(token => removeDiacritics(token.trim().toLowerCase()))
            .filter(token => token.length >= minKeywordLength);
    }

    function buildNormalizedMap(text) {
        const normalizedChars = [];
        const map = [];
        for (let i = 0; i < text.length; i++) {
            const baseChar = text[i];
            const normalized = removeDiacritics(baseChar.toLowerCase());
            if (normalized.length === 0) continue;
            for (let j = 0; j < normalized.length; j++) {
                normalizedChars.push(normalized[j]);
                map.push(i);
            }
        }
        return { normalized: normalizedChars.join(''), map };
    }

    function mergeRanges(ranges) {
        if (ranges.length === 0) return [];
        ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const merged = [ranges[0]];
        for (let i = 1; i < ranges.length; i++) {
            const prev = merged[merged.length - 1];
            const current = ranges[i];
            if (current[0] <= prev[1]) {
                prev[1] = Math.max(prev[1], current[1]);
            } else {
                merged.push([...current]);
            }
        }
        return merged;
    }

    function computeRanges(text, tokens) {
        const ranges = [];
        const normalizedData = buildNormalizedMap(text);
        const { normalized, map } = normalizedData;
        tokens.forEach(token => {
            if (token.length < minKeywordLength) return;
            let start = 0;
            while (start <= normalized.length) {
                const index = normalized.indexOf(token, start);
                if (index === -1) break;
                const startOriginal = map[index];
                const endOriginal = map[index + token.length - 1] + 1;
                ranges.push([startOriginal, endOriginal]);
                start = index + token.length;
            }
        });
        return mergeRanges(ranges);
    }

    function applyHighlight(rawText, tokens) {
        if (!rawText) return '';
        if (!tokens || tokens.length === 0) {
            return escapeHtml(rawText).replace(/\n/g, '<br>');
        }
        const normalizedTokens = tokens.map(token => removeDiacritics(token.toLowerCase()));
        const ranges = computeRanges(rawText, normalizedTokens);
        if (ranges.length === 0) {
            return escapeHtml(rawText).replace(/\n/g, '<br>');
        }
        let cursor = 0;
        let html = '';
        ranges.forEach(([start, end]) => {
            if (cursor < start) {
                html += escapeHtml(rawText.slice(cursor, start));
            }
            html += `<span class="highlight">${escapeHtml(rawText.slice(start, end))}</span>`;
            cursor = end;
        });
        if (cursor < rawText.length) {
            html += escapeHtml(rawText.slice(cursor));
        }
        return html.replace(/\n/g, '<br>');
    }

    function clear($elements) {
        $elements.each(function () {
            const rawValue = $(this).data('raw');
            if (rawValue !== undefined) {
                $(this).html(escapeHtml(rawValue).replace(/\n/g, '<br>'));
            }
        });
    }

    function apply($elements, tokens) {
        if (!$elements || $elements.length === 0) return;
        if (!tokens || tokens.length === 0) {
            clear($elements);
            return;
        }
        $elements.each(function () {
            const rawValue = $(this).data('raw');
            if (rawValue !== undefined) {
                $(this).html(applyHighlight(rawValue, tokens));
            }
        });
    }

    return {
        minKeywordLength,
        escapeHtml,
        normalizeTokens,
        applyHighlight,
        apply,
        clear
    };
})();
