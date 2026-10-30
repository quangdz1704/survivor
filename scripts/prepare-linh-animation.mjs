import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Select the four complementary contact/passing drawings. The final two
// generated poses repeat the leading leg, so they are deliberately excluded.
// Translation and uniform downsampling only: never resize individual limbs.
const source = "docs/artwork/linh-walk-source-v2.png";
const frames = [];
const regions = [];
for (let index = 0; index < 4; index++) {
  const region = {
    left: (index % 3) * 512,
    top: Math.floor(index / 3) * 512,
    width: 512,
    height: 512,
  };
  const { data, info } = await sharp(source)
    .extract(region)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sole = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 100) sole = y;
  const offsetY = 496 - sole;
  const cropTop = Math.max(0, -offsetY);
  const aligned = await sharp(data, { raw: info })
    .extract({
      left: 0,
      top: cropTop,
      width: 512,
      height: 512 - Math.abs(offsetY),
    })
    .extend({
      top: Math.max(0, offsetY),
      bottom: Math.max(0, -offsetY),
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const png = await sharp(aligned).resize(256, 256).png().toBuffer();
  frames.push({ input: png, left: index * 256, top: 0 });
  regions.push({ ...region, sole, offsetY });
}
await sharp({
  create: {
    width: 1024,
    height: 256,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(frames)
  .webp({ quality: 96, alphaQuality: 100 })
  .toFile("public/assets/player/linh-walk.webp");
await writeFile(
  "docs/LINH_ANIMATION_REGIONS.json",
  JSON.stringify(
    { source, frameSize: 256, groundY: 248, frames: regions },
    null,
    2,
  ) + "\n",
);
console.log("Prepared four intact poses, with a shared sole baseline.");
