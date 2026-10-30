import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const manifest = {};
for (const kind of ["skeleton", "orc", "golem", "bat"]) {
  const { data, info } = await sharp(`docs/artwork/${kind}-rig-source.png`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height),
    queue = new Int32Array(width * height),
    parts = [];
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || data[start * 4 + 3] < 8) continue;
    let head = 0,
      tail = 1;
    queue[0] = start;
    seen[start] = 1;
    let left = width,
      top = height,
      right = 0,
      bottom = 0;
    while (head < tail) {
      const at = queue[head++],
        x = at % width,
        y = Math.floor(at / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
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
    if (tail > 3000)
      parts.push({
        pixels: queue.slice(0, tail),
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1,
      });
  }
  const expected = kind === "bat" ? 3 : 6;
  if (parts.length !== expected)
    throw new Error(
      `${kind}: expected ${expected} alpha components, got ${parts.length}`,
    );
  const ordered =
    kind === "bat"
      ? parts.sort((a, b) => a.left - b.left)
      : [
          ...parts.filter((p) => p.top < 480).sort((a, b) => a.left - b.left),
          ...parts.filter((p) => p.top >= 480).sort((a, b) => a.left - b.left),
        ];
  const names =
    kind === "bat"
      ? ["body", "wing-left", "wing-right"]
      : ["head", "torso", "arm-left", "arm-right", "leg-left", "leg-right"];
  await mkdir(`public/assets/enemies/${kind}`, { recursive: true });
  manifest[kind] = {};
  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i],
      pixels = Buffer.alloc(p.width * p.height * 4);
    for (const at of p.pixels) {
      const x = (at % width) - p.left,
        y = Math.floor(at / width) - p.top;
      data.copy(pixels, (y * p.width + x) * 4, at * 4, at * 4 + 4);
    }
    await sharp(pixels, {
      raw: { width: p.width, height: p.height, channels: 4 },
    })
      .resize({
        width: 384,
        height: 384,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 94, alphaQuality: 100 })
      .toFile(`public/assets/enemies/${kind}/${names[i]}.webp`);
    manifest[kind][names[i]] = {
      left: p.left,
      top: p.top,
      width: p.width,
      height: p.height,
    };
  }
}
await writeFile(
  "docs/ENEMY_RIG_REGIONS.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Extracted 21 original enemy rig layers.");
