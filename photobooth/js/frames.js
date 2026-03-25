'use strict';

/**
 * frames.js — SVG Frame Templates for the Le Image Monogram Builder
 *
 * Each frame has:
 *  - id:           unique string identifier
 *  - name:         display name
 *  - category:     grouping hint
 *  - textPadding:  { x, y } — fractional inset from frame edges (0–1)
 *  - svg:          SVG string with FRAME_COLOR placeholder, viewBox="0 0 400 200"
 *                  null for the "no frame" option
 *
 * Color replacement: every FRAME_COLOR occurrence is replaced with the
 * user's active text color at render time.
 */

const FRAME_TEMPLATES = [

  /* ─────────────────── 1. None ─────────────────────────────── */
  {
    id: 'none',
    name: 'None',
    category: 'simple',
    textPadding: { x: 0.04, y: 0.04 },
    svg: null,
  },

  /* ─────────────────── BOTANICAL FRAMES ─────────────────────── */


  {
    id: 'classic-laurel-crest',
    name: 'Classic Laurel Crest',
    category: 'botanical',
    textPadding: { x: 0.15, y: 0.18 },
    textZone: { left: 0.25, top: 0.25, right: 0.75, bottom: 0.75 },
    svg: null,
    svgFile: 'assets/frames/classic-laurel-crest.svg',
    viewBoxW: 5000,
    viewBoxH: 3519.47,
  },
  {
    id: 'fine-art-botanical',
    name: 'Fine Art Botanical',
    category: 'botanical',
    textPadding: { x: 0.20, y: 0.22 },
    textZone: { left: 0.20, top: 0.20, right: 0.80, bottom: 0.80 },
    svg: null,
    svgFile: 'assets/frames/fine-art-botanical.svg',
    viewBoxW: 4194.53,
    viewBoxH: 5000,
  },
  {
    id: 'hand-drawn-laurel',
    name: 'Hand-Drawn Laurel',
    category: 'botanical',
    textPadding: { x: 0.20, y: 0.22 },
    textZone: { left: 0.22, top: 0.22, right: 0.78, bottom: 0.78 },
    svg: null,
    svgFile: 'assets/frames/hand-drawn-laurel.svg',
    viewBoxW: 5000,
    viewBoxH: 4076.1,
  },

  {
    id: 'rustic-floral',
    name: 'Rustic Floral',
    category: 'botanical',
    textPadding: { x: 0.15, y: 0.18 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.85 },
    svg: null,
    svgFile: 'assets/frames/rustic-floral.svg',
    viewBoxW: 5000,
    viewBoxH: 4241.39,
  },
  {
    id: 'timeless-floral-crest',
    name: 'Timeless Floral Crest',
    category: 'botanical',
    textPadding: { x: 0.15, y: 0.18 },
    textZone: { left: 0.22, top: 0.20, right: 0.78, bottom: 0.78 },
    svg: null,
    svgFile: 'assets/frames/timeless-floral-crest.svg',
    viewBoxW: 5000,
    viewBoxH: 4338.65,
  },
  {
    id: 'wildflower-botanical',
    name: 'Wildflower Botanical',
    category: 'botanical',
    textPadding: { x: 0.15, y: 0.18 },
    textZone: { left: 0.25, top: 0.22, right: 0.75, bottom: 0.78 },
    svg: null,
    svgFile: 'assets/frames/wildflower-botanical.svg',
    viewBoxW: 5000,
    viewBoxH: 3146.93,
  },
  {
    id: 'elegant-floral-emblem',
    name: 'Elegant Floral Emblem',
    category: 'botanical',
    textPadding: { x: 0.20, y: 0.22 },
    textZone: { left: 0.20, top: 0.15, right: 0.80, bottom: 0.75 },
    svg: null,
    svgFile: 'assets/frames/elegant-floral-emblem.svg',
    viewBoxW: 5000,
    viewBoxH: 2923.3,
  },

  {
    id: 'classic-wreath',
    name: 'Classic Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/classic-wreath.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },

  {
    id: 'ornate-wreath',
    name: 'Ornate Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/ornate-wreath.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },

  {
    id: 'wreath-2',
    name: 'Floral Circle',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-2.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-3',
    name: 'Elegant Circle',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-3.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-4',
    name: 'Ornate Circle',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-4.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-5',
    name: 'Vine Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-5.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-6',
    name: 'Garden Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-6.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-7',
    name: 'Leaf Circle',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-7.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-8',
    name: 'Nature Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-8.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-9',
    name: 'Star Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-9.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-10',
    name: 'Botanical Ring',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-10.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },
  {
    id: 'wreath-11',
    name: 'Delicate Wreath',
    category: 'botanical',
    textPadding: { x: 0.25, y: 0.25 },
    textZone: { left: 0.25, top: 0.30, right: 0.75, bottom: 0.70 },
    svg: null,
    svgFile: 'assets/frames/wreath-11.svg',
    viewBoxW: 432,
    viewBoxH: 432,
  },

  /* ─────────────────── 2. Classic Oval ─────────────────────── */
  {
    id: 'classic-oval',
    name: 'Classic Oval',
    category: 'elegant',
    textPadding: { x: 0.16, y: 0.18 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="100" rx="188" ry="88" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <ellipse cx="200" cy="100" rx="180" ry="80" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
</svg>`,
  },

  /* ─────────────────── 3. Diamond ──────────────────────────── */
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'geometric',
    textPadding: { x: 0.26, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <polygon points="200,6 393,100 200,194 7,100" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <polygon points="200,22 375,100 200,178 25,100" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <circle cx="200" cy="6"   r="4" fill="FRAME_COLOR"/>
  <circle cx="393" cy="100" r="4" fill="FRAME_COLOR"/>
  <circle cx="200" cy="194" r="4" fill="FRAME_COLOR"/>
  <circle cx="7"   cy="100" r="4" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 4. Circle Ring ──────────────────────── */
  {
    id: 'circle-ring',
    name: 'Circle Ring',
    category: 'elegant',
    textPadding: { x: 0.20, y: 0.20 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="100" rx="188" ry="92" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <circle cx="200" cy="6"   r="5" fill="FRAME_COLOR"/>
  <circle cx="200" cy="194" r="5" fill="FRAME_COLOR"/>
  <circle cx="10"  cy="100" r="5" fill="FRAME_COLOR"/>
  <circle cx="390" cy="100" r="5" fill="FRAME_COLOR"/>
  <path d="M123,26 l6,-5 l6,5 l-6,5 Z" fill="FRAME_COLOR"/>
  <path d="M265,26 l6,-5 l6,5 l-6,5 Z" fill="FRAME_COLOR"/>
  <path d="M123,164 l6,-5 l6,5 l-6,5 Z" fill="FRAME_COLOR"/>
  <path d="M265,164 l6,-5 l6,5 l-6,5 Z" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 5. Double Circle ────────────────────── */
  {
    id: 'double-circle',
    name: 'Double Circle',
    category: 'elegant',
    textPadding: { x: 0.24, y: 0.25 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="100" rx="190" ry="93" fill="none" stroke="FRAME_COLOR" stroke-width="2"/>
  <ellipse cx="200" cy="100" rx="178" ry="81" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <circle cx="200" cy="8"   r="3.5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="192" r="3.5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="10"  cy="100" r="3.5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="390" cy="100" r="3.5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
</svg>`,
  },

  /* ─────────────────── 6. Ornate Oval ──────────────────────── */
  {
    id: 'ornate-oval',
    name: 'Ornate Oval',
    category: 'ornate',
    textPadding: { x: 0.22, y: 0.28 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="100" rx="172" ry="78" fill="none" stroke="FRAME_COLOR" stroke-width="2"/>
  <path d="M186,22 C191,10 209,10 214,22" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M170,28 C176,14 186,22 186,22" fill="none" stroke="FRAME_COLOR" stroke-width="1.4"/>
  <path d="M214,22 C214,22 224,14 230,28" fill="none" stroke="FRAME_COLOR" stroke-width="1.4"/>
  <path d="M156,36 C162,22 170,28 170,28" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <path d="M230,28 C230,28 238,22 244,36" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <circle cx="200" cy="7"   r="3.5" fill="FRAME_COLOR"/>
  <circle cx="177" cy="13"  r="2.2" fill="FRAME_COLOR"/>
  <circle cx="223" cy="13"  r="2.2" fill="FRAME_COLOR"/>
  <path d="M186,178 C191,190 209,190 214,178" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M170,172 C176,186 186,178 186,178" fill="none" stroke="FRAME_COLOR" stroke-width="1.4"/>
  <path d="M214,178 C214,178 224,186 230,172" fill="none" stroke="FRAME_COLOR" stroke-width="1.4"/>
  <path d="M156,164 C162,178 170,172 170,172" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <path d="M230,172 C230,172 238,178 244,164" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <circle cx="200" cy="193" r="3.5" fill="FRAME_COLOR"/>
  <circle cx="177" cy="187" r="2.2" fill="FRAME_COLOR"/>
  <circle cx="223" cy="187" r="2.2" fill="FRAME_COLOR"/>
  <path d="M22,94 L22,106 M16,100 L28,100" stroke="FRAME_COLOR" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M378,94 L378,106 M372,100 L384,100" stroke="FRAME_COLOR" stroke-width="1.8" stroke-linecap="round"/>
</svg>`,
  },

  /* ─────────────────── 7. Rectangular Frame ────────────────── */
  {
    id: 'rectangular',
    name: 'Rect. Frame',
    category: 'classic',
    textPadding: { x: 0.14, y: 0.18 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="8"  y="8"  width="384" height="184" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <rect x="16" y="16" width="368" height="168" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <line x1="8"   y1="40"  x2="8"   y2="8"   stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="8"   y1="8"   x2="40"  y2="8"   stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="360" y1="8"   x2="392" y2="8"   stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="392" y1="8"   x2="392" y2="40"  stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="8"   y1="160" x2="8"   y2="192" stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="8"   y1="192" x2="40"  y2="192" stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="360" y1="192" x2="392" y2="192" stroke="FRAME_COLOR" stroke-width="2.2"/>
  <line x1="392" y1="192" x2="392" y2="160" stroke="FRAME_COLOR" stroke-width="2.2"/>
  <circle cx="8"   cy="8"   r="3" fill="FRAME_COLOR"/>
  <circle cx="392" cy="8"   r="3" fill="FRAME_COLOR"/>
  <circle cx="8"   cy="192" r="3" fill="FRAME_COLOR"/>
  <circle cx="392" cy="192" r="3" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 8. Art Deco Frame ───────────────────── */
  {
    id: 'art-deco',
    name: 'Art Deco',
    category: 'geometric',
    textPadding: { x: 0.20, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="380" height="180" fill="none" stroke="FRAME_COLOR" stroke-width="2"/>
  <rect x="18" y="18" width="364" height="164" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <rect x="26" y="26" width="348" height="148" fill="none" stroke="FRAME_COLOR" stroke-width="0.5"/>
  <!-- Stepped corners TL -->
  <path d="M10,50 L10,10 L50,10" fill="none" stroke="FRAME_COLOR" stroke-width="3"/>
  <path d="M18,54 L18,18 L54,18" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- TR -->
  <path d="M350,10 L390,10 L390,50" fill="none" stroke="FRAME_COLOR" stroke-width="3"/>
  <path d="M346,18 L382,18 L382,54" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- BL -->
  <path d="M10,150 L10,190 L50,190" fill="none" stroke="FRAME_COLOR" stroke-width="3"/>
  <path d="M18,146 L18,182 L54,182" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- BR -->
  <path d="M350,190 L390,190 L390,150" fill="none" stroke="FRAME_COLOR" stroke-width="3"/>
  <path d="M346,182 L382,182 L382,146" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Center top/bottom accents -->
  <path d="M175,10 L175,18 M200,10 L200,18 M225,10 L225,18" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M175,182 L175,190 M200,182 L200,190 M225,182 L225,190" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Center side accents -->
  <path d="M10,88 L18,88 M10,100 L18,100 M10,112 L18,112" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M382,88 L390,88 M382,100 L390,100 M382,112 L390,112" stroke="FRAME_COLOR" stroke-width="1.5"/>
</svg>`,
  },



  /* ─────────────────── 10. Floral Frame ────────────────────── */
  {
    id: 'floral',
    name: 'Floral Frame',
    category: 'nature',
    textPadding: { x: 0.22, y: 0.24 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="100" rx="172" ry="80" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Top center flower -->
  <circle cx="200" cy="18" r="6" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="18" r="2.5" fill="FRAME_COLOR"/>
  <ellipse cx="200" cy="9"  rx="3" ry="5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="200" cy="27" rx="3" ry="5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="191" cy="18" rx="5" ry="3" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="209" cy="18" rx="5" ry="3" fill="FRAME_COLOR" opacity="0.7"/>
  <!-- Bottom center flower -->
  <circle cx="200" cy="182" r="6" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="182" r="2.5" fill="FRAME_COLOR"/>
  <ellipse cx="200" cy="173" rx="3" ry="5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="200" cy="191" rx="3" ry="5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="191" cy="182" rx="5" ry="3" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="209" cy="182" rx="5" ry="3" fill="FRAME_COLOR" opacity="0.7"/>
  <!-- Left flower -->
  <circle cx="26" cy="100" r="5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="26" cy="100" r="2" fill="FRAME_COLOR"/>
  <ellipse cx="26" cy="92"  rx="2.5" ry="4" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="26" cy="108" rx="2.5" ry="4" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="18" cy="100" rx="4" ry="2.5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="34" cy="100" rx="4" ry="2.5" fill="FRAME_COLOR" opacity="0.7"/>
  <!-- Right flower -->
  <circle cx="374" cy="100" r="5" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="374" cy="100" r="2" fill="FRAME_COLOR"/>
  <ellipse cx="374" cy="92"  rx="2.5" ry="4" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="374" cy="108" rx="2.5" ry="4" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="366" cy="100" rx="4" ry="2.5" fill="FRAME_COLOR" opacity="0.7"/>
  <ellipse cx="382" cy="100" rx="4" ry="2.5" fill="FRAME_COLOR" opacity="0.7"/>
  <!-- Vine segments top-left -->
  <path d="M200,24 Q170,30 148,50 Q132,62 126,80" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <ellipse cx="168" cy="36" rx="6" ry="3.5" transform="rotate(-30 168 36)" fill="FRAME_COLOR" opacity="0.5"/>
  <ellipse cx="142" cy="58" rx="6" ry="3.5" transform="rotate(-50 142 58)" fill="FRAME_COLOR" opacity="0.5"/>
  <!-- Vine segments top-right -->
  <path d="M200,24 Q230,30 252,50 Q268,62 274,80" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <ellipse cx="232" cy="36" rx="6" ry="3.5" transform="rotate(30 232 36)" fill="FRAME_COLOR" opacity="0.5"/>
  <ellipse cx="258" cy="58" rx="6" ry="3.5" transform="rotate(50 258 58)" fill="FRAME_COLOR" opacity="0.5"/>
  <!-- Vine segments bottom-left -->
  <path d="M200,176 Q170,170 148,150 Q132,138 126,120" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <ellipse cx="168" cy="164" rx="6" ry="3.5" transform="rotate(30 168 164)" fill="FRAME_COLOR" opacity="0.5"/>
  <ellipse cx="142" cy="142" rx="6" ry="3.5" transform="rotate(50 142 142)" fill="FRAME_COLOR" opacity="0.5"/>
  <!-- Vine segments bottom-right -->
  <path d="M200,176 Q230,170 252,150 Q268,138 274,120" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <ellipse cx="232" cy="164" rx="6" ry="3.5" transform="rotate(-30 232 164)" fill="FRAME_COLOR" opacity="0.5"/>
  <ellipse cx="258" cy="142" rx="6" ry="3.5" transform="rotate(-50 258 142)" fill="FRAME_COLOR" opacity="0.5"/>
</svg>`,
  },



  /* ─────────────────── 12. Shield ──────────────────────────── */
  {
    id: 'shield',
    name: 'Shield',
    category: 'classic',
    textPadding: { x: 0.22, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M200,8 L370,30 L370,120 C370,160 200,196 200,196 C200,196 30,160 30,120 L30,30 Z"
    fill="none" stroke="FRAME_COLOR" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M200,22 L356,42 L356,120 C356,154 200,182 200,182 C200,182 44,154 44,120 L44,42 Z"
    fill="none" stroke="FRAME_COLOR" stroke-width="0.8" stroke-linejoin="round"/>
  <!-- Crest line -->
  <line x1="30" y1="60" x2="370" y2="60" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- Top accent -->
  <circle cx="200" cy="8"  r="4"   fill="FRAME_COLOR"/>
  <circle cx="30"  cy="30" r="3.5" fill="FRAME_COLOR"/>
  <circle cx="370" cy="30" r="3.5" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 13. Hexagon ─────────────────────────── */
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'geometric',
    textPadding: { x: 0.22, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <polygon points="200,6 374,54 374,146 200,194 26,146 26,54" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <polygon points="200,18 362,60 362,140 200,182 38,140 38,60" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <circle cx="200" cy="6"   r="4" fill="FRAME_COLOR"/>
  <circle cx="374" cy="54"  r="4" fill="FRAME_COLOR"/>
  <circle cx="374" cy="146" r="4" fill="FRAME_COLOR"/>
  <circle cx="200" cy="194" r="4" fill="FRAME_COLOR"/>
  <circle cx="26"  cy="146" r="4" fill="FRAME_COLOR"/>
  <circle cx="26"  cy="54"  r="4" fill="FRAME_COLOR"/>
</svg>`,
  },



  /* ─────────────────── 15. Banner Ribbon ───────────────────── */
  {
    id: 'banner',
    name: 'Banner',
    category: 'ornate',
    textPadding: { x: 0.14, y: 0.30 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Main ribbon -->
  <path d="M6,50 L30,65 L30,150 L6,165 L6,50 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M394,50 L370,65 L370,150 L394,165 L394,50 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <rect x="30" y="60" width="340" height="80" rx="2" fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <rect x="36" y="66" width="328" height="68" rx="1" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <!-- V-cuts on sides -->
  <path d="M6,107 L30,95 M6,107 L30,120" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <path d="M394,107 L370,95 M394,107 L370,120" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- Top and bottom decorative lines -->
  <line x1="30" y1="50" x2="370" y2="50" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="30" y1="150" x2="370" y2="150" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Corner rosettes -->
  <circle cx="30"  cy="60"  r="4" fill="FRAME_COLOR"/>
  <circle cx="370" cy="60"  r="4" fill="FRAME_COLOR"/>
  <circle cx="30"  cy="140" r="4" fill="FRAME_COLOR"/>
  <circle cx="370" cy="140" r="4" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 16. Vintage Scroll ──────────────────── */
  {
    id: 'vintage-scroll',
    name: 'Vintage Scroll',
    category: 'ornate',
    textPadding: { x: 0.20, y: 0.26 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="22" width="340" height="156" rx="3" fill="none" stroke="FRAME_COLOR" stroke-width="2"/>
  <rect x="36" y="28" width="328" height="144" rx="2" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <!-- Scroll corners TL -->
  <path d="M30,22 C22,22 16,28 16,36 C16,44 22,50 30,50 C38,50 44,44 44,36 L44,22 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M30,30 C25,30 22,33 22,38 C22,43 25,46 30,46" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- TR -->
  <path d="M370,22 C378,22 384,28 384,36 C384,44 378,50 370,50 C362,50 356,44 356,36 L356,22 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M370,30 C375,30 378,33 378,38 C378,43 375,46 370,46" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- BL -->
  <path d="M30,178 C22,178 16,172 16,164 C16,156 22,150 30,150 C38,150 44,156 44,164 L44,178 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M30,170 C25,170 22,167 22,162 C22,157 25,154 30,154" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- BR -->
  <path d="M370,178 C378,178 384,172 384,164 C384,156 378,150 370,150 C362,150 356,156 356,164 L356,178 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M370,170 C375,170 378,167 378,162 C378,157 375,154 370,154" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- Center top/bottom ornaments -->
  <path d="M185,22 L185,28 M200,22 L200,28 M215,22 L215,28" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M185,172 L185,178 M200,172 L200,178 M215,172 L215,178" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M190,22 C194,16 206,16 210,22" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M190,178 C194,184 206,184 210,178" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
</svg>`,
  },

  /* ─────────────────── 17. Minimalist Lines ────────────────── */
  {
    id: 'minimalist',
    name: 'Min. Lines',
    category: 'simple',
    textPadding: { x: 0.08, y: 0.20 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="22"  x2="380" y2="22"  stroke="FRAME_COLOR" stroke-width="2"/>
  <line x1="20" y1="30"  x2="380" y2="30"  stroke="FRAME_COLOR" stroke-width="0.6"/>
  <line x1="20" y1="170" x2="380" y2="170" stroke="FRAME_COLOR" stroke-width="0.6"/>
  <line x1="20" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="2"/>
  <!-- Left end stops -->
  <line x1="20" y1="16" x2="20" y2="184" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Right end stops -->
  <line x1="380" y1="16" x2="380" y2="184" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Center diamond accent -->
  <path d="M195,26 L200,20 L205,26 L200,32 Z" fill="FRAME_COLOR"/>
  <path d="M195,168 L200,162 L205,168 L200,174 Z" fill="FRAME_COLOR"/>
</svg>`,
  },



  /* ─────────────────── 19. Star Frame ──────────────────────── */
  {
    id: 'star-frame',
    name: 'Star Frame',
    category: 'ornate',
    textPadding: { x: 0.22, y: 0.24 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Star/sunburst outer ring -->
  <ellipse cx="200" cy="100" rx="186" ry="90" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <ellipse cx="200" cy="100" rx="176" ry="80" fill="none" stroke="FRAME_COLOR" stroke-width="0.6"/>
  <!-- Starburst rays (16 rays) -->
  <line x1="200" y1="8"   x2="200" y2="20"  stroke="FRAME_COLOR" stroke-width="2.5"/>
  <line x1="200" y1="180" x2="200" y2="192" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <line x1="12"  y1="100" x2="24"  y2="100" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <line x1="376" y1="100" x2="388" y2="100" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <!-- Diagonal long rays -->
  <line x1="64"  y1="26"  x2="72"  y2="36"  stroke="FRAME_COLOR" stroke-width="2"/>
  <line x1="328" y1="164" x2="336" y2="174" stroke="FRAME_COLOR" stroke-width="2"/>
  <line x1="336" y1="26"  x2="328" y2="36"  stroke="FRAME_COLOR" stroke-width="2"/>
  <line x1="72"  y1="164" x2="64"  y2="174" stroke="FRAME_COLOR" stroke-width="2"/>
  <!-- Mid-diagonal medium rays -->
  <line x1="30"  y1="55"  x2="38"  y2="63"  stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="362" y1="137" x2="370" y2="145" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="370" y1="55"  x2="362" y2="63"  stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="38"  y1="137" x2="30"  y2="145" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Corner dots -->
  <circle cx="200" cy="8"   r="3.5" fill="FRAME_COLOR"/>
  <circle cx="200" cy="192" r="3.5" fill="FRAME_COLOR"/>
  <circle cx="12"  cy="100" r="3.5" fill="FRAME_COLOR"/>
  <circle cx="388" cy="100" r="3.5" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 20. Leafy Border ────────────────────── */
  {
    id: 'leafy-border',
    name: 'Leafy Border',
    category: 'nature',
    textPadding: { x: 0.20, y: 0.26 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Horizontal stems -->
  <line x1="20" y1="26"  x2="380" y2="26"  stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="20" y1="174" x2="380" y2="174" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <!-- Vertical stems -->
  <line x1="20"  y1="26"  x2="20"  y2="174" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="380" y1="26"  x2="380" y2="174" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <!-- Top leaves (9 pairs) -->
  <ellipse cx="60"  cy="20" rx="8" ry="4" transform="rotate(-20 60 20)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="60"  cy="32" rx="8" ry="4" transform="rotate(20 60 32)"   fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="100" cy="20" rx="8" ry="4" transform="rotate(-20 100 20)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="100" cy="32" rx="8" ry="4" transform="rotate(20 100 32)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="140" cy="20" rx="8" ry="4" transform="rotate(-20 140 20)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="140" cy="32" rx="8" ry="4" transform="rotate(20 140 32)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="200" cy="18" rx="8" ry="4" transform="rotate(-10 200 18)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="200" cy="34" rx="8" ry="4" transform="rotate(10 200 34)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="260" cy="20" rx="8" ry="4" transform="rotate(20 260 20)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="260" cy="32" rx="8" ry="4" transform="rotate(-20 260 32)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="300" cy="20" rx="8" ry="4" transform="rotate(20 300 20)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="300" cy="32" rx="8" ry="4" transform="rotate(-20 300 32)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="340" cy="20" rx="8" ry="4" transform="rotate(20 340 20)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="340" cy="32" rx="8" ry="4" transform="rotate(-20 340 32)" fill="FRAME_COLOR" opacity="0.85"/>
  <!-- Bottom leaves (mirrored) -->
  <ellipse cx="60"  cy="168" rx="8" ry="4" transform="rotate(20 60 168)"   fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="60"  cy="180" rx="8" ry="4" transform="rotate(-20 60 180)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="100" cy="168" rx="8" ry="4" transform="rotate(20 100 168)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="100" cy="180" rx="8" ry="4" transform="rotate(-20 100 180)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="140" cy="168" rx="8" ry="4" transform="rotate(20 140 168)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="140" cy="180" rx="8" ry="4" transform="rotate(-20 140 180)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="200" cy="166" rx="8" ry="4" transform="rotate(10 200 166)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="200" cy="182" rx="8" ry="4" transform="rotate(-10 200 182)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="260" cy="168" rx="8" ry="4" transform="rotate(-20 260 168)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="260" cy="180" rx="8" ry="4" transform="rotate(20 260 180)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="300" cy="168" rx="8" ry="4" transform="rotate(-20 300 168)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="300" cy="180" rx="8" ry="4" transform="rotate(20 300 180)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="340" cy="168" rx="8" ry="4" transform="rotate(-20 340 168)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="340" cy="180" rx="8" ry="4" transform="rotate(20 340 180)"  fill="FRAME_COLOR" opacity="0.85"/>
  <!-- Left side leaves -->
  <ellipse cx="14"  cy="70"  rx="4" ry="7" transform="rotate(-80 14 70)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="26"  cy="70"  rx="4" ry="7" transform="rotate(80 26 70)"   fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="14"  cy="100" rx="4" ry="7" transform="rotate(-80 14 100)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="26"  cy="100" rx="4" ry="7" transform="rotate(80 26 100)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="14"  cy="130" rx="4" ry="7" transform="rotate(-80 14 130)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="26"  cy="130" rx="4" ry="7" transform="rotate(80 26 130)"  fill="FRAME_COLOR" opacity="0.85"/>
  <!-- Right side leaves -->
  <ellipse cx="374" cy="70"  rx="4" ry="7" transform="rotate(80 374 70)"   fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="386" cy="70"  rx="4" ry="7" transform="rotate(-80 386 70)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="374" cy="100" rx="4" ry="7" transform="rotate(80 374 100)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="386" cy="100" rx="4" ry="7" transform="rotate(-80 386 100)" fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="374" cy="130" rx="4" ry="7" transform="rotate(80 374 130)"  fill="FRAME_COLOR" opacity="0.85"/>
  <ellipse cx="386" cy="130" rx="4" ry="7" transform="rotate(-80 386 130)" fill="FRAME_COLOR" opacity="0.85"/>
</svg>`,
  },

  /* ─────────────────── 21. Elegant Swirl ───────────────────── */
  {
    id: 'elegant-swirl',
    name: 'Elegant Swirl',
    category: 'ornate',
    textPadding: { x: 0.18, y: 0.26 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Central oval -->
  <ellipse cx="200" cy="100" rx="155" ry="72" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Left large swirl -->
  <path d="M44,100 C44,70 60,50 80,50 C100,50 110,65 105,80 C100,95 85,95 78,88 C71,81 76,72 84,74" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M44,100 C44,130 60,150 80,150 C100,150 110,135 105,120 C100,105 85,105 78,112 C71,119 76,128 84,126" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <!-- Left connector -->
  <path d="M44,100 C44,100 20,100 12,100" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <circle cx="8" cy="100" r="4" fill="FRAME_COLOR"/>
  <!-- Right large swirl (mirrored) -->
  <path d="M356,100 C356,70 340,50 320,50 C300,50 290,65 295,80 C300,95 315,95 322,88 C329,81 324,72 316,74" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <path d="M356,100 C356,130 340,150 320,150 C300,150 290,135 295,120 C300,105 315,105 322,112 C329,119 324,128 316,126" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <!-- Right connector -->
  <path d="M356,100 C356,100 380,100 388,100" fill="none" stroke="FRAME_COLOR" stroke-width="1.8"/>
  <circle cx="392" cy="100" r="4" fill="FRAME_COLOR"/>
  <!-- Top center flourish -->
  <path d="M175,28 C185,16 215,16 225,28" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="26" r="3" fill="FRAME_COLOR"/>
  <!-- Bottom center flourish -->
  <path d="M175,172 C185,184 215,184 225,172" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="174" r="3" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 22. Infinity Loop ───────────────────── */
  {
    id: 'infinity',
    name: 'Infinity',
    category: 'geometric',
    textPadding: { x: 0.15, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Infinity shape (thick) -->
  <path d="M200,100 C200,68 224,44 256,44 C288,44 312,68 312,100 C312,132 288,156 256,156 C224,156 200,132 200,100 C200,68 176,44 144,44 C112,44 88,68 88,100 C88,132 112,156 144,156 C176,156 200,132 200,100 Z"
    fill="none" stroke="FRAME_COLOR" stroke-width="2.5"/>
  <!-- Inner thinner line -->
  <path d="M200,100 C200,72 222,52 252,52 C282,52 304,72 304,100 C304,128 282,148 252,148 C222,148 200,128 200,100 C200,72 178,52 148,52 C118,52 96,72 96,100 C96,128 118,148 148,148 C178,148 200,128 200,100 Z"
    fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <!-- Top/bottom accent dots at tips -->
  <circle cx="200" cy="44" r="4" fill="FRAME_COLOR"/>
  <circle cx="200" cy="156" r="4" fill="FRAME_COLOR"/>
</svg>`,
  },



  /* ─────────────────── 24. Geometric Mosaic ────────────────── */
  {
    id: 'geometric-mosaic',
    name: 'Geo. Mosaic',
    category: 'geometric',
    textPadding: { x: 0.18, y: 0.22 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer frame -->
  <rect x="6" y="6" width="388" height="188" fill="none" stroke="FRAME_COLOR" stroke-width="2"/>
  <!-- Inner frame -->
  <rect x="18" y="18" width="364" height="164" fill="none" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <!-- Corner triangles TL -->
  <polygon points="6,6 50,6 6,50" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <polygon points="6,6 34,6 6,34" fill="FRAME_COLOR" opacity="0.25"/>
  <!-- TR -->
  <polygon points="350,6 394,6 394,50" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <polygon points="366,6 394,6 394,34" fill="FRAME_COLOR" opacity="0.25"/>
  <!-- BL -->
  <polygon points="6,150 6,194 50,194" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <polygon points="6,166 6,194 34,194" fill="FRAME_COLOR" opacity="0.25"/>
  <!-- BR -->
  <polygon points="394,150 394,194 350,194" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <polygon points="394,166 394,194 366,194" fill="FRAME_COLOR" opacity="0.25"/>
  <!-- Top center geometric accent -->
  <polygon points="200,6 218,18 200,30 182,18" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="18" r="3" fill="FRAME_COLOR"/>
  <!-- Bottom center -->
  <polygon points="200,170 218,182 200,194 182,182" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <circle cx="200" cy="182" r="3" fill="FRAME_COLOR"/>
  <!-- Side diamonds -->
  <polygon points="6,88 18,100 6,112 " fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <polygon points="394,88 382,100 394,112" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Mid-side squares -->
  <rect x="6"   y="88"  width="12" height="24" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <rect x="382" y="88"  width="12" height="24" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <!-- Top/bottom strip pattern -->
  <line x1="60"  y1="6"  x2="60"  y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="90"  y1="6"  x2="90"  y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="120" y1="6"  x2="120" y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="280" y1="6"  x2="280" y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="310" y1="6"  x2="310" y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="340" y1="6"  x2="340" y2="18"  stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="60"  y1="182" x2="60"  y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="90"  y1="182" x2="90"  y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="120" y1="182" x2="120" y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="280" y1="182" x2="280" y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="310" y1="182" x2="310" y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
  <line x1="340" y1="182" x2="340" y2="194" stroke="FRAME_COLOR" stroke-width="1"/>
</svg>`,
  },


  /* ═══════════════════════════════════════════════════════════
     LINE DIVIDERS — horizontal ornamental dividers
     These render as top+bottom decorations, center open for text
  ═══════════════════════════════════════════════════════════ */

  /* ─────────────────── 25. Classic Lines ───────────────────── */
  {
    id: 'div-classic',
    name: 'Classic Lines',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top divider -->
  <line x1="20" y1="22" x2="170" y2="22" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="230" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M190,22 L200,12 L210,22 L200,32 Z" fill="FRAME_COLOR"/>
  <line x1="20" y1="28" x2="380" y2="28" stroke="FRAME_COLOR" stroke-width="0.6"/>
  <!-- Bottom divider -->
  <line x1="20" y1="172" x2="170" y2="172" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="230" y1="172" x2="380" y2="172" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <path d="M190,172 L200,162 L210,172 L200,182 Z" fill="FRAME_COLOR"/>
  <line x1="20" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="0.6"/>
</svg>`,
  },

  /* ─────────────────── 26. Elegant Swirl Divider ───────────── */
  {
    id: 'div-swirl',
    name: 'Elegant Swirl',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top swirl divider -->
  <line x1="20" y1="22" x2="140" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M140,22 C155,22 160,14 168,14 C176,14 178,22 170,26 C162,30 156,22 164,20" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M260,22 C245,22 240,14 232,14 C224,14 222,22 230,26 C238,30 244,22 236,20" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="260" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="200" cy="22" r="4" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="200" cy="22" r="1.5" fill="FRAME_COLOR"/>
  <!-- Bottom swirl divider -->
  <line x1="20" y1="178" x2="140" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M140,178 C155,178 160,170 168,170 C176,170 178,178 170,182 C162,186 156,178 164,176" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M260,178 C245,178 240,170 232,170 C224,170 222,178 230,182 C238,186 244,178 236,176" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="260" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="200" cy="178" r="4" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="200" cy="178" r="1.5" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 27. Double Lines ────────────────────── */
  {
    id: 'div-double',
    name: 'Double Lines',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top double line -->
  <line x1="20" y1="18" x2="380" y2="18" stroke="FRAME_COLOR" stroke-width="2"/>
  <line x1="20" y1="26" x2="380" y2="26" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <!-- Bottom double line -->
  <line x1="20" y1="174" x2="380" y2="174" stroke="FRAME_COLOR" stroke-width="0.8"/>
  <line x1="20" y1="182" x2="380" y2="182" stroke="FRAME_COLOR" stroke-width="2"/>
  <!-- Corner accents -->
  <rect x="16" y="14" width="8" height="16" rx="1" fill="FRAME_COLOR" opacity="0.4"/>
  <rect x="376" y="14" width="8" height="16" rx="1" fill="FRAME_COLOR" opacity="0.4"/>
  <rect x="16" y="170" width="8" height="16" rx="1" fill="FRAME_COLOR" opacity="0.4"/>
  <rect x="376" y="170" width="8" height="16" rx="1" fill="FRAME_COLOR" opacity="0.4"/>
</svg>`,
  },

  /* ─────────────────── 28. Dots ────────────────────────────── */
  {
    id: 'div-dots',
    name: 'Dots',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top dots line -->
  <line x1="20" y1="22" x2="180" y2="22" stroke="FRAME_COLOR" stroke-width="1" stroke-dasharray="3,6"/>
  <line x1="220" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1" stroke-dasharray="3,6"/>
  <circle cx="200" cy="22" r="5" fill="FRAME_COLOR"/>
  <circle cx="174" cy="22" r="2.5" fill="FRAME_COLOR"/>
  <circle cx="226" cy="22" r="2.5" fill="FRAME_COLOR"/>
  <!-- Bottom dots line -->
  <line x1="20" y1="178" x2="180" y2="178" stroke="FRAME_COLOR" stroke-width="1" stroke-dasharray="3,6"/>
  <line x1="220" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1" stroke-dasharray="3,6"/>
  <circle cx="200" cy="178" r="5" fill="FRAME_COLOR"/>
  <circle cx="174" cy="178" r="2.5" fill="FRAME_COLOR"/>
  <circle cx="226" cy="178" r="2.5" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 29. Minimal ─────────────────────────── */
  {
    id: 'div-minimal',
    name: 'Minimal',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top single line -->
  <line x1="20" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Bottom single line -->
  <line x1="20" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.5"/>
</svg>`,
  },

  /* ─────────────────── 30. Hearts ──────────────────────────── */
  {
    id: 'div-hearts',
    name: 'Hearts',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top line with heart -->
  <line x1="20" y1="22" x2="183" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="217" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M200,30 C194,24 186,20 186,14 C186,9 191,6 196,8 C198,9 200,11 200,11 C200,11 202,9 204,8 C209,6 214,9 214,14 C214,20 206,24 200,30 Z" fill="FRAME_COLOR"/>
  <!-- Bottom line with heart -->
  <line x1="20" y1="178" x2="183" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="217" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M200,186 C194,180 186,176 186,170 C186,165 191,162 196,164 C198,165 200,167 200,167 C200,167 202,165 204,164 C209,162 214,165 214,170 C214,176 206,180 200,186 Z" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 31. Stars ───────────────────────────── */
  {
    id: 'div-stars',
    name: 'Stars',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top line with star -->
  <line x1="20" y1="22" x2="183" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="217" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <polygon points="200,12 202.4,18.8 209.5,18.8 203.8,23 206.1,29.8 200,25.6 193.9,29.8 196.2,23 190.5,18.8 197.6,18.8" fill="FRAME_COLOR"/>
  <!-- Bottom line with star -->
  <line x1="20" y1="178" x2="183" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="217" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <polygon points="200,168 202.4,174.8 209.5,174.8 203.8,179 206.1,185.8 200,181.6 193.9,185.8 196.2,179 190.5,174.8 197.6,174.8" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 32. Waves ───────────────────────────── */
  {
    id: 'div-waves',
    name: 'Waves',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top wave -->
  <path d="M20,22 C40,14 60,30 80,22 C100,14 120,30 140,22 C160,14 180,30 200,22 C220,14 240,30 260,22 C280,14 300,30 320,22 C340,14 360,30 380,22" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Bottom wave -->
  <path d="M20,178 C40,170 60,186 80,178 C100,170 120,186 140,178 C160,170 180,186 200,178 C220,170 240,186 260,178 C280,170 300,186 320,178 C340,170 360,186 380,178" fill="none" stroke="FRAME_COLOR" stroke-width="1.5"/>
</svg>`,
  },

  /* ─────────────────── 33. Arrows ──────────────────────────── */
  {
    id: 'div-arrows',
    name: 'Arrows',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="180" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="220" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M192,14 L200,22 L192,30" fill="none" stroke="FRAME_COLOR" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M208,14 L200,22 L208,30" fill="none" stroke="FRAME_COLOR" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="180" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="220" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M192,170 L200,178 L192,186" fill="none" stroke="FRAME_COLOR" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M208,170 L200,178 L208,186" fill="none" stroke="FRAME_COLOR" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,
  },

  /* ─────────────────── 34. Flourish Ends ───────────────────── */
  {
    id: 'div-flourish-ends',
    name: 'Flourish Ends',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="50" y1="22" x2="350" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M50,22 C40,22 30,16 24,10 C30,18 28,26 20,28" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M50,22 C40,22 30,28 24,34 C30,26 28,18 20,16" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M350,22 C360,22 370,16 376,10 C370,18 372,26 380,28" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M350,22 C360,22 370,28 376,34 C370,26 372,18 380,16" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <!-- Bottom -->
  <line x1="50" y1="178" x2="350" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M50,178 C40,178 30,172 24,166 C30,174 28,182 20,184" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M50,178 C40,178 30,184 24,190 C30,182 28,174 20,172" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M350,178 C360,178 370,172 376,166 C370,174 372,182 380,184" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M350,178 C360,178 370,184 376,190 C370,182 372,174 380,172" fill="none" stroke="FRAME_COLOR" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,
  },

  /* ─────────────────── 35. Leaf Divider ────────────────────── */
  {
    id: 'div-leaf',
    name: 'Leaf',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="175" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="225" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <ellipse cx="188" cy="18" rx="7" ry="4" transform="rotate(-30 188 18)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="200" cy="14" rx="4" ry="7" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="212" cy="18" rx="7" ry="4" transform="rotate(30 212 18)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="188" cy="26" rx="7" ry="4" transform="rotate(30 188 26)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="200" cy="30" rx="4" ry="7" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="212" cy="26" rx="7" ry="4" transform="rotate(-30 212 26)" fill="FRAME_COLOR" opacity="0.8"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="175" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="225" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <ellipse cx="188" cy="174" rx="7" ry="4" transform="rotate(-30 188 174)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="200" cy="170" rx="4" ry="7" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="212" cy="174" rx="7" ry="4" transform="rotate(30 212 174)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="188" cy="182" rx="7" ry="4" transform="rotate(30 188 182)" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="200" cy="186" rx="4" ry="7" fill="FRAME_COLOR" opacity="0.8"/>
  <ellipse cx="212" cy="182" rx="7" ry="4" transform="rotate(-30 212 182)" fill="FRAME_COLOR" opacity="0.8"/>
</svg>`,
  },

  /* ─────────────────── 36. Cross ───────────────────────────── */
  {
    id: 'div-cross',
    name: 'Cross',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="185" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="215" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="193" y1="14" x2="207" y2="30" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="207" y1="14" x2="193" y2="30" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="185" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="215" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="193" y1="170" x2="207" y2="186" stroke="FRAME_COLOR" stroke-width="1.5"/>
  <line x1="207" y1="170" x2="193" y2="186" stroke="FRAME_COLOR" stroke-width="1.5"/>
</svg>`,
  },

  /* ─────────────────── 37. Infinity ────────────────────────── */
  {
    id: 'div-infinity',
    name: 'Infinity',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="175" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="225" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M200,22 C200,14 208,10 214,14 C220,18 220,26 214,30 C208,34 200,30 200,22 C200,14 192,10 186,14 C180,18 180,26 186,30 C192,34 200,30 200,22 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="175" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="225" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M200,178 C200,170 208,166 214,170 C220,174 220,182 214,186 C208,190 200,186 200,178 C200,170 192,166 186,170 C180,174 180,182 186,186 C192,190 200,186 200,178 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1.2"/>
</svg>`,
  },

  /* ─────────────────── 38. Ampersand ───────────────────────── */
  {
    id: 'div-ampersand',
    name: 'Ampersand',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="180" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="220" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <text x="200" y="28" font-family="serif" font-size="18" fill="FRAME_COLOR" text-anchor="middle">&amp;</text>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="180" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="220" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <text x="200" y="184" font-family="serif" font-size="18" fill="FRAME_COLOR" text-anchor="middle">&amp;</text>
</svg>`,
  },

  /* ─────────────────── 39. Triple Dots ─────────────────────── */
  {
    id: 'div-triple-dots',
    name: 'Triple Dots',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="178" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="222" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="190" cy="22" r="3" fill="FRAME_COLOR"/>
  <circle cx="200" cy="22" r="3" fill="FRAME_COLOR"/>
  <circle cx="210" cy="22" r="3" fill="FRAME_COLOR"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="178" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="222" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <circle cx="190" cy="178" r="3" fill="FRAME_COLOR"/>
  <circle cx="200" cy="178" r="3" fill="FRAME_COLOR"/>
  <circle cx="210" cy="178" r="3" fill="FRAME_COLOR"/>
</svg>`,
  },

  /* ─────────────────── 40. Ornamental ──────────────────────── */
  {
    id: 'div-ornamental',
    name: 'Ornamental',
    category: 'divider',
    textPadding: { x: 0.04, y: 0.15 },
    svg: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Top -->
  <line x1="20" y1="22" x2="160" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="240" y1="22" x2="380" y2="22" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M170,22 Q180,12 190,18 Q195,22 190,26 Q180,32 170,22 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <path d="M230,22 Q220,12 210,18 Q205,22 210,26 Q220,32 230,22 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <circle cx="200" cy="22" r="3" fill="FRAME_COLOR"/>
  <!-- Bottom -->
  <line x1="20" y1="178" x2="160" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <line x1="240" y1="178" x2="380" y2="178" stroke="FRAME_COLOR" stroke-width="1.2"/>
  <path d="M170,178 Q180,168 190,174 Q195,178 190,182 Q180,188 170,178 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <path d="M230,178 Q220,168 210,174 Q205,178 210,182 Q220,188 230,178 Z" fill="none" stroke="FRAME_COLOR" stroke-width="1"/>
  <circle cx="200" cy="178" r="3" fill="FRAME_COLOR"/>
</svg>`,
  },

];

/* ================================================================
   SVG → Canvas image cache
   Key: `${frameId}::${color}`, Value: HTMLImageElement
   SVG text cache (for external files)
   Key: svgFile path, Value: raw SVG string
================================================================ */
const _frameImageCache = new Map();
const _svgTextCache    = new Map();

/**
 * Fetch an external SVG file once and cache the raw text.
 * Returns a Promise<string|null>.
 */
function _fetchSvgText(svgFile) {
  if (_svgTextCache.has(svgFile)) {
    return Promise.resolve(_svgTextCache.get(svgFile));
  }
  return fetch(svgFile)
    .then(r => r.ok ? r.text() : null)
    .then(text => {
      if (text) _svgTextCache.set(svgFile, text);
      return text;
    })
    .catch(() => null);
}

/**
 * Render a frame SVG to an HTMLImageElement, cached per id+color.
 * Supports both inline svg strings and external svgFile paths.
 * Returns a Promise<HTMLImageElement>.
 */
function getFrameImage(frameId, color) {
  const FIXED_COLOR = color || '#c9a84c';
  const cacheKey = `${frameId}::${FIXED_COLOR}`;

  if (_frameImageCache.has(cacheKey)) {
    return Promise.resolve(_frameImageCache.get(cacheKey));
  }

  const template = FRAME_TEMPLATES.find(f => f.id === frameId);
  if (!template) return Promise.resolve(null);

  const makeImageFromSvg = (svgText) => {
    return new Promise((resolve) => {
      let coloredSvg;
      if (svgText.includes('FRAME_COLOR')) {
        coloredSvg = svgText.split('FRAME_COLOR').join(FIXED_COLOR);
      } else {
        coloredSvg = svgText.replace(/<svg([^>]*)>/, (match, attrs) => {
          if (/fill=/.test(attrs)) return match;
          return `<svg${attrs} fill="${FIXED_COLOR}">`;
        });
      }
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(coloredSvg);
      const img = new Image();
      img.onload = () => { _frameImageCache.set(cacheKey, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };

  // External SVG file (botanical frames)
  if (template.svgFile) {
    return _fetchSvgText(template.svgFile).then(text => {
      if (!text) return null;
      return makeImageFromSvg(text);
    });
  }

  // Inline SVG string
  if (!template.svg) return Promise.resolve(null);
  return makeImageFromSvg(template.svg);
}

/**
 * Clear the image cache (call when switching events or on memory pressure).
 * Keeps the SVG text cache (raw files) since that's cheap to retain.
 */
function clearFrameCache() {
  _frameImageCache.clear();
}

/**
 * Clear both image and SVG text caches.
 */
function clearAllFrameCaches() {
  _frameImageCache.clear();
  _svgTextCache.clear();
}

/* Export to window */
window.FrameTemplates = {
  templates:      FRAME_TEMPLATES,
  getImage:       getFrameImage,
  fetchSvgText:   _fetchSvgText,
  clearCache:     clearFrameCache,
  clearAllCaches: clearAllFrameCaches,
};
