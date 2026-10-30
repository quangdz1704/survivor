import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const { data, info } = await sharp("docs/artwork/adventurer-rig-source.png")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height } = info,
  seen = new Uint8Array(width * height),
  queue = new Int32Array(width * height),
  components = [];
for (let start = 0; start < width * height; start++) {
  if (seen[start] || data[start * 4 + 3] < 8) continue;
  let head = 0,
    tail = 1;
  queue[0] = start;
  seen[start] = 1;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  while (head < tail) {
    const at = queue[head++],
      x = at % width,
      y = Math.floor(at / width);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    for (const next of [
      x > 0 ? at - 1 : -1,
      x < width - 1 ? at + 1 : -1,
      y > 0 ? at - width : -1,
      y < height - 1 ? at + width : -1,
    ])
      if (next >= 0 && !seen[next] && data[next * 4 + 3] >= 8) {
        seen[next] = 1;
        queue[tail++] = next;
      }
  }
  if (tail > 2000)
    components.push({
      pixels: queue.slice(0, tail),
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      area: tail,
    });
}
components.sort((a, b) => b.area - a.area);
if (components.length !== 8)
  throw new Error(
    "Expected eight isolated rig parts, found " + components.length,
  );
const top = components
  .filter((c) => c.top < 570)
  .sort((a, b) => a.left - b.left);
const bottom = components
  .filter((c) => c.top >= 570)
  .sort((a, b) => a.left - b.left);
const names = [
  "head",
  "torso",
  "sword-arm",
  "free-arm",
  "leg-left",
  "leg-right",
  "scarf-tail",
  "scarf-collar",
];
await mkdir("public/assets/player", { recursive: true });
const regions = {};
for (const [i, c] of [...top, ...bottom].entries()) {
  const pixels = Buffer.alloc(c.width * c.height * 4);
  for (const p of c.pixels) {
    const x = (p % width) - c.left,
      y = Math.floor(p / width) - c.top;
    data.copy(pixels, (y * c.width + x) * 4, p * 4, p * 4 + 4);
  }
  await sharp(pixels, {
    raw: { width: c.width, height: c.height, channels: 4 },
  })
    .webp({ quality: 96, alphaQuality: 100 })
    .toFile("public/assets/player/" + names[i] + ".webp");
  regions[names[i]] = {
    left: c.left,
    top: c.top,
    width: c.width,
    height: c.height,
  };
}
await writeFile(
  "docs/PLAYER_RIG_REGIONS.json",
  JSON.stringify(regions, null, 2) + "\n",
);
console.log(regions);
