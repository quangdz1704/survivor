// Technical atlas slicing only; generated artwork and its alpha are preserved.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const original = "docs/artwork/forest-atlas-source.png";
const boxes = [
  { left: 54, top: 14, width: 430, height: 493 },
  { left: 545, top: 65, width: 438, height: 429 },
  { left: 1022, top: 60, width: 514, height: 422 },
  { left: 0, top: 510, width: 539, height: 514 },
  { left: 546, top: 512, width: 475, height: 512 },
  { left: 1031, top: 551, width: 505, height: 456 },
];
const layers = [];
for (let i = 0; i < boxes.length; i++) {
  const input = await sharp(await readFile(original))
    .extract(boxes[i])
    .resize(480, 480, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  layers.push({
    input,
    left: (i % 3) * 512 + 16,
    top: Math.floor(i / 3) * 512 + 16,
  });
}
await sharp({
  create: {
    width: 1536,
    height: 1024,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(layers)
  .webp({ quality: 95, alphaQuality: 100 })
  .toFile("public/assets/forest-atlas.webp");
await writeFile(
  "docs/ATLAS_REGIONS.json",
  JSON.stringify(boxes, null, 2) + "\n",
);
console.log("Six isolated sprites packed into normalized 512×512 cells.");

await sharp("public/assets/forest-atlas.webp")
  .extract({ left: 0, top: 0, width: 512, height: 512 })
  .webp({ quality: 95, alphaQuality: 100 })
  .toFile("public/assets/adventurer.webp");
