const Jimp = require('jimp');
const fs = require('fs');

const icons = ['favicon.png', 'icon.png', 'adaptive-icon.png'];

async function processIcons() {
  for (const icon of icons) {
    const path = `assets/images/${icon}`;
    if (fs.existsSync(path)) {
      try {
        const image = await Jimp.read(path);
        image.circle();
        await image.writeAsync(path);
        console.log(`Processed ${icon}`);
      } catch (err) {
        console.error(`Error with ${icon}:`, err.message);
      }
    }
  }
}

processIcons();
