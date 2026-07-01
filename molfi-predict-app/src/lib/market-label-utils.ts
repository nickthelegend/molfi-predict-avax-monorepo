/**
 * Utilities for extracting clean labels from grouped market titles.
 */

/**
 * Extract a clean group title from an array of related market titles.
 */
export function extractGroupTitle(titles: string[]): string {
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];

  const cleaned = titles.map(t => t.replace(/[?!.]+$/, '').trim());
  const wordArrays = cleaned.map(t => t.split(/\s+/));
  const threshold = Math.ceil(titles.length * 0.8);
  const minWordCount = Math.min(...wordArrays.map(w => w.length));

  // Word-level suffix matching (80% majority, tolerates singular/plural)
  let suffixWords = 0;
  for (let i = 1; i <= minWordCount - 1; i++) {
    const refWord = wordArrays[0][wordArrays[0].length - i]?.toLowerCase();
    const matches = wordArrays.filter(w => {
      const word = w[w.length - i]?.toLowerCase();
      return word === refWord || areSingularPlural(word, refWord);
    }).length;
    if (matches >= threshold) suffixWords = i;
    else break;
  }

  // Word-level prefix matching (80% majority)
  let prefixWords = 0;
  for (let i = 0; i < minWordCount; i++) {
    const refWord = wordArrays[0][i]?.toLowerCase();
    const matches = wordArrays.filter(w => {
      const word = w[i]?.toLowerCase();
      return word === refWord || areSingularPlural(word, refWord);
    }).length;
    if (matches >= threshold) prefixWords = i + 1;
    else break;
  }

  // Build title — try suffix first, then prefix
  let result = '';

  if (suffixWords >= 2) {
    const suffixPhrase = wordArrays[0].slice(-suffixWords).join(' ');
    result = cleanGroupPhrase(suffixPhrase);
  }

  if (result.length < 5 && prefixWords >= 2) {
    const prefixPhrase = wordArrays[0].slice(0, prefixWords).join(' ');
    result = cleanGroupPhrase(prefixPhrase);
  }

  // Capitalize
  if (result.length > 0) {
    result = capitalizeFirst(result);
  }

  // Fallback: use first title cleaned
  if (result.length < 3) {
    let fallback = cleaned[0];
    fallback = fallback.replace(/^(will|who will|what will|which|how many)\s+/i, '').trim();
    return capitalizeFirst(fallback);
  }

  return result;
}

/** Clean a raw phrase into a readable group title */
function cleanGroupPhrase(phrase: string): string {
  let r = phrase.trim();
  // Strip leading question/verb patterns
  r = r.replace(/^(will\s+)?(the\s+)?(there\s+)?(be\s+)?/i, '').trim();
  r = r.replace(/^(win|reach|hit|make|become|get|have|take|go|happen)\s+(the\s+|in\s+)?/i, '').trim();
  r = r.replace(/^(as the|as|in the|in|of the|of|for the|for|to the|to|be the|be)\s+/i, '').trim();
  // Strip leading units/measurements that aren't meaningful as titles
  r = r.replace(/^(\d+\+?\s*)?(bps|bp|basis points?)\s+/i, '').trim();
  // Strip leading connectors again after unit removal
  r = r.replace(/^(after the|after|before the|before|by the|by|during the|during)\s+/i, (match) => {
    // Keep temporal phrases if they form the core of the title
    return match;
  });
  // Remove trailing articles/prepositions
  r = r.replace(/\s+(the|a|an|to|in|of|as|be|is|by|there)$/i, '').trim();
  // Remove question starters
  r = r.replace(/^(will|who will|what will|which|how will|when will|where will|how many)\s+/i, '').trim();
  return r;
}

/**
 * Extract short, unique labels from grouped market titles.
 * Uses word-level prefix and suffix stripping to produce clean outcome labels.
 */
export function extractUniqueSegments(titles: string[]): string[] {
  if (titles.length <= 1) return titles;

  const cleaned = titles.map(t => t.replace(/[?!.]+$/, '').trim());
  const wordArrays = cleaned.map(t => t.split(/\s+/));
  const threshold = Math.ceil(titles.length * 0.8);
  const minWordCount = Math.min(...wordArrays.map(w => w.length));

  // Find common prefix words (80% majority)
  let prefixWords = 0;
  for (let i = 0; i < minWordCount; i++) {
    const refWord = wordArrays[0][i]?.toLowerCase();
    const matches = wordArrays.filter(w => {
      const word = w[i]?.toLowerCase();
      return word === refWord || areSingularPlural(word, refWord);
    }).length;
    if (matches >= threshold) prefixWords = i + 1;
    else break;
  }

  // Find common suffix words (80% majority)
  let suffixWords = 0;
  for (let i = 1; i <= minWordCount - prefixWords; i++) {
    const refWord = wordArrays[0][wordArrays[0].length - i]?.toLowerCase();
    const matches = wordArrays.filter(w => {
      const word = w[w.length - i]?.toLowerCase();
      return word === refWord || areSingularPlural(word, refWord);
    }).length;
    if (matches >= threshold) suffixWords = i;
    else break;
  }

  // Build the common suffix phrase for context enrichment
  const commonSuffix = suffixWords > 0
    ? wordArrays[0].slice(-suffixWords).join(' ')
    : '';

  // Extract unique middle portion for each title
  const segments = wordArrays.map((words, idx) => {
    const start = prefixWords;
    const end = words.length - suffixWords;

    if (start >= end) return cleaned[idx];

    let segment = words.slice(start, end).join(' ');

    // Clean up leading connectors
    segment = segment.replace(/^(the|a|an|be|there be|there)\s+/i, '').trim();
    // Clean up trailing connectors
    segment = segment.replace(/\s+(the|a|an|to|in|of|as|at|on|by|from|with)\s*$/i, '').trim();
    segment = segment.replace(/[,\s]+$/, '').trim();

    // If segment is too short (just a number or 1-2 chars), enrich with suffix context
    if (segment.length <= 3 && commonSuffix) {
      segment = enrichShortLabel(segment, commonSuffix);
    }

    return segment || cleaned[idx];
  });

  return segments.map(s => capitalizeFirst(s));
}

/**
 * Enrich a very short label (e.g. "2") with context from the common suffix.
 * "2" + "Fed rate cuts happen in 2026" → "2 rate cuts"
 */
function enrichShortLabel(label: string, suffix: string): string {
  // Extract the key noun phrase from the suffix
  let context = suffix.trim();
  // Remove temporal/verb parts
  context = context.replace(/\b(happen|occurring|in|during|by|before|after|of)\b.*$/i, '').trim();
  // Remove leading "Fed" type qualifiers for brevity
  context = context.replace(/^(the\s+)?(fed|federal reserve)\s+/i, '').trim();
  // Remove leading verbs
  context = context.replace(/^(will\s+)?(be|have|get|make)\s+/i, '').trim();

  if (context.length > 0 && context.length < 30) {
    return `${label} ${context}`.trim();
  }
  return label;
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function areSingularPlural(a: string, b: string): boolean {
  if (!a || !b) return false;
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  return (
    la + 's' === lb || lb + 's' === la ||
    la + 'es' === lb || lb + 'es' === la
  );
}
