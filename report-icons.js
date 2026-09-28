/*
 * report-icons.js
 * ------------------------------------------------------------------
 * Shared white SVG icons for the coloured section-header blocks used by
 * BOTH the Classroom Observation report and the Culture Walkthrough
 * report. Inline SVG (no icon-font dependency), drawn with
 * stroke="currentColor" so they inherit `text-white` from the block.
 *
 * Usage:  reportIcon('fourP')  ->  '<svg ...>...</svg>'
 *
 * Names are shared across reports where the concept is the same:
 *   fourP       4P diagnostic (Classroom "1. 4P Diagnostic Output",
 *               Culture "1. Institutional Diagnostic Level")
 *   frameworks  SAMR & TPACK framework           (Classroom 2)
 *   tpack       TPACK diagnostic                 (Classroom 3)
 *   evidence    Field evidence & artifact record (Classroom 4)
 *   scaffold    Scaffolding suggestions          (Classroom 5)
 *   reflection  Reflection prompts               (Classroom 6)
 *   followUp    Recommendations & follow-up      (Classroom 7)
 *   insight     Operational to Affective Insight (Culture 2)
 *   lens        Critical Advisory Lens           (Culture 3)
 *   support     Measures of Support (pillars)    (Culture 4)
 *   evidence    (also) Field Observation Findings & Evidence (Culture 5)
 */

const PATHS = {
  // Four-point diamond radar: one axis per P (People, Practice, Pedagogy, Platforms)
  fourP:
    '<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 3v18M3 12h18"/><path d="M12 8l4 4-4 4-4-4z"/>',
  // Stacked layers
  frameworks: '<path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/>',
  // TPACK Venn: three overlapping circles
  tpack: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>',
  // Clipboard with tick
  evidence:
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M8.5 14l2.5 2.5 4.5-5"/>',
  // Ascending steps
  scaffold: '<path d="M3 21h5v-5h5v-5h5V6h3"/>',
  // Speech bubble with question mark
  reflection:
    '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5"/><path d="M12 16.5h.01"/>',
  // Flag on a pole
  followUp: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  // Magnifying glass
  lens: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  // Pillars under a pediment
  support:
    '<path d="M3 10l9-6 9 6z"/><path d="M5 10v10M10 10v10M14 10v10M19 10v10M3 21h18"/>',
  // Light bulb
  insight:
    '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
};

export function reportIcon(name, size = 18) {
  const body = PATHS[name] || PATHS.fourP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
