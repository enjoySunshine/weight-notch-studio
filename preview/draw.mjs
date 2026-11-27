// Draws the Ç of PhantomTest-VF at the two notches the sign is measured at:
// the font's default weight, and its heaviest. The numbers the sign was
// measured at are printed next to the previews, so they can be compared with
// the outlines.
//
//   node preview/draw.mjs
//
// Writes preview/out.html, which switches between the two, and
// preview/out-default.svg and preview/out-heavy.svg, one notch each.

import fs from 'node:fs';
import { openSync } from 'fontkit';

const font = openSync(
  new URL('../test/data/PhantomTest/PhantomTest-VF.ttf', import.meta.url),
);

const codePoint = 0xc7; // Ç
const heavyWeight = font.variationAxes.wght.max;

// Read each notch from its own font: one drag of the slider must not touch
// the other, and both must come from the font's outlines rather than being
// scaled copies of one another.
const notch = (font, label) => {
  const glyph = font.glyphForCodePoint(codePoint);
  const [startX, startY] = glyph.path.commands[0].args;
  return {
    label,
    path: glyph.path.toSVG(),
    startX,
    startY,
    advance: glyph.advanceWidth,
    bbox: glyph.path.bbox,
  };
};

const notches = {
  default: notch(font, 'default'),
  heavy: notch(font.getVariation({ wght: heavyWeight }), `${heavyWeight}`),
};

for (const [key, n] of Object.entries(notches)) {
  console.log(
    `${key.padEnd(8)} start M${n.startX} ${n.startY}  advance ${n.advance}`,
  );
}

// The two notches share a box, so the outlines can be compared in place.
const box = (a, b) => ({
  minX: Math.min(a.minX, b.minX),
  minY: Math.min(a.minY, b.minY),
  maxX: Math.max(a.maxX, b.maxX),
  maxY: Math.max(a.maxY, b.maxY),
});
const both = box(notches.default.bbox, notches.heavy.bbox);
const pad = 24;
const view = {
  x: both.minX - pad,
  y: -both.maxY - pad,
  w: both.maxX - both.minX + pad * 2,
  h: both.maxY - both.minY + pad * 2,
};
const viewBox = `${view.x} ${view.y} ${view.w} ${view.h}`;

const svg = (n) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="480" height="480">
  <rect x="${view.x}" y="${view.y}" width="${view.w}" height="${view.h}" fill="#111"/>
  <path d="${n.path}" transform="scale(1,-1)" fill="#f4f1ea"/>
</svg>
`;

fs.writeFileSync(
  new URL('./out-default.svg', import.meta.url),
  svg(notches.default),
);
fs.writeFileSync(
  new URL('./out-heavy.svg', import.meta.url),
  svg(notches.heavy),
);

// A page with a slider between the two notches. Both paths are drawn from the
// font when the page is made; the slider picks which one, and shows its
// numbers. The default is first, the heaviest last.
const html = `<!doctype html>
<meta charset="utf-8">
<title>PhantomTest Ç</title>
<style>
  body { margin: 0; background: #111; color: #f4f1ea; font: 16px/1.5 system-ui, sans-serif; }
  main { display: flex; flex-direction: column; gap: 16px; align-items: center; padding: 24px; }
  svg { width: min(80vmin, 480px); height: auto; }
  output { font-variant-numeric: tabular-nums; white-space: pre; }
  input[type=range] { width: min(80vmin, 480px); }
  .row { display: flex; gap: 12px; }
  .row strong { width: 6ch; }
</style>
<main>
  <svg viewBox="${viewBox}">
    <path id="outline" transform="scale(1,-1)" fill="#f4f1ea"></path>
  </svg>
  <input id="slider" type="range" min="0" max="1" step="1" value="0">
  <div class="row"><strong id="weight"></strong><output id="numbers"></output></div>
  <div class="row"><strong>start</strong><output id="start"></output></div>
</main>
<script>
  const notches = ${JSON.stringify(notches)};
  const order = ["default", "heavy"];
  const outline = document.getElementById("outline");
  const slider = document.getElementById("slider");
  const drawn = (key) => {
    const n = notches[key];
    outline.setAttribute("d", n.path);
    document.getElementById("weight").textContent = key === "default" ? "default" : n.label;
    document.getElementById("numbers").textContent = "advance " + n.advance;
    document.getElementById("start").textContent = "M" + n.startX + " " + n.startY;
  };
  slider.addEventListener("input", () => drawn(order[slider.value]));
  drawn(order[slider.value]);
</script>
`;

fs.writeFileSync(new URL('./out.html', import.meta.url), html);
console.log('wrote preview/out.html, out-default.svg, out-heavy.svg');
