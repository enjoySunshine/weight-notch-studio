import fs from "node:fs";
import { openSync } from "../src/node.js";

const font = openSync(new URL("../test/data/OpenSans/OpenSans-Regular.ttf", import.meta.url));
const glyph = font.glyphForCodePoint(0x41);
const d = glyph.path.toSVG();
const box = glyph.path.bbox;
const w = Math.max(1, Math.ceil(box.maxX - box.minX));
const h = Math.max(1, Math.ceil(box.maxY - box.minY));
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX} ${-box.maxY} ${w} ${h}" width="480" height="480">
  <rect x="${box.minX}" y="${-box.maxY}" width="${w}" height="${h}" fill="#111"/>
  <path d="${d}" transform="scale(1,-1)" fill="#f4f1ea"/>
</svg>
`;
fs.writeFileSync(new URL("./out.svg", import.meta.url), svg);
console.log("wrote preview/out.svg", w, h);
