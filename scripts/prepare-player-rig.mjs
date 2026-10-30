import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const linh = process.argv[2] === "linh";
const { data, info } = await sharp(
  `docs/artwork/${linh ? "linh" : "adventurer"}-rig-source.png`,
)
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
if (components.length !== (linh ? 9 : 8))
  throw new Error(
    "Unexpected number of isolated rig parts: " + components.length,
  );
const top = components
  .filter((c) => c.top < 570)
  .sort((a, b) => a.left - b.left);
const bottom = components
  .filter((c) => c.top >= 570)
  .sort((a, b) => a.left - b.left);
const names = [
  ...(linh ? ["portrait"] : []),
  "head",
  "torso",
  "sword-arm",
  "free-arm",
  "leg-left",
  "leg-right",
  "scarf-tail",
  "scarf-collar",
];
const ordered = linh
  ? components.sort((a, b) => {
      const rowA = Math.floor((a.top + a.height / 2) / (height / 3));
      const rowB = Math.floor((b.top + b.height / 2) / (height / 3));
      return rowA - rowB || a.left - b.left;
    })
  : [...top, ...bottom];
const directory = linh ? "public/assets/player/linh" : "public/assets/player";
await mkdir(directory, { recursive: true });
const regions = {};
for (const [i, c] of ordered.entries()) {
  regions[names[i]] = {
    left: c.left,
    top: c.top,
    width: c.width,
    height: c.height,
  };
  // Linh's separated rig was rejected. Only her intact portrait is used;
  // prepare-linh-animation.mjs extracts the replacement whole-body frames.
  if (linh && names[i] !== "portrait") continue;
  const pixels = Buffer.alloc(c.width * c.height * 4);
  for (const p of c.pixels) {
    const x = (p % width) - c.left,
      y = Math.floor(p / width) - c.top;
    data.copy(pixels, (y * c.width + x) * 4, p * 4, p * 4 + 4);
  }
  const output = sharp(pixels, {
    raw: { width: c.width, height: c.height, channels: 4 },
  });
  if (linh)
    output.resize({
      width: names[i] === "portrait" ? 512 : 384,
      height: names[i] === "portrait" ? 512 : 384,
      fit: "inside",
      withoutEnlargement: true,
    });
  await output
    .webp({ quality: 96, alphaQuality: 100 })
    .toFile(
      linh && names[i] === "portrait"
        ? "public/assets/linh.webp"
        : directory + "/" + names[i] + ".webp",
    );
}
await writeFile(
  linh ? "docs/LINH_RIG_REGIONS.json" : "docs/PLAYER_RIG_REGIONS.json",
  JSON.stringify(regions, null, 2) + "\n",
);
console.log(regions);
