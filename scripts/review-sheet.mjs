import sharp from "sharp";
const files = ["01-menu.png", "02-gameplay.png", "03-combat.png"];
const layers = [];
for (let i = 0; i < files.length; i++)
  layers.push({
    input: await sharp("docs/screenshots/" + files[i])
      .resize(390, 844)
      .toBuffer(),
    left: i * 406,
    top: 0,
  });
await sharp({
  create: { width: 1202, height: 844, channels: 4, background: "#0e211e" },
})
  .composite(layers)
  .webp({ quality: 95 })
  .toFile("docs/screenshots/visual-review.webp");
