// Turns a contact detail into vector outlines for the browser to draw on a canvas, so the text itself
// never leaves the server. Every call perturbs each point by a few font units and shuffles the glyph
// order in the path, so no two responses are identical and a glyph cannot be matched against the
// font's own outline by string comparison. At display sizes the noise is well under a pixel.
import { ASCENT, DESCENT, GLYPHS, UNITS_PER_EM } from './glyphs';

export interface ContactOutline {
  /** One SVG path in font units, y down, origin at the top-left of the line box. */
  d: string;
  width: number;
  height: number;
  /** Distance from the top of the line box to the baseline. */
  baseline: number;
  unitsPerEm: number;
}

/** Max per-coordinate displacement in font units: 0.6% of an em, ~0.1px at 16px text. */
export const OUTLINE_JITTER = Math.round(UNITS_PER_EM * 0.006);

export function composeOutline(text: string, rand: () => number = Math.random, jitter = OUTLINE_JITTER): ContactOutline {
  const noise = () => Math.round((rand() * 2 - 1) * jitter);
  const pieces: string[] = [];
  let x = 0;
  for (const ch of text) {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`no outline for character ${JSON.stringify(ch)}; rerun scripts/contact-glyphs.mjs`);
    if (glyph.commands.length > 0) {
      const parts: string[] = [];
      for (const [op, ...coords] of glyph.commands) {
        const pts: number[] = [];
        for (let i = 0; i < coords.length; i += 2) {
          pts.push(x + coords[i] + noise(), ASCENT - coords[i + 1] + noise());
        }
        parts.push(op + pts.join(' '));
      }
      pieces.push(parts.join(''));
    }
    x += glyph.advance;
  }
  // Fisher-Yates: glyph order in the path is irrelevant to the drawing, so it carries no reading order.
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return { d: pieces.join(''), width: x, height: ASCENT - DESCENT, baseline: ASCENT, unitsPerEm: UNITS_PER_EM };
}
