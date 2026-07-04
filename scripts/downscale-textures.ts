import sharp from "sharp";
import { promises as fs } from "fs";
import { join } from "path";

const TEXTURE_DIR = "./chess-assets/source/textures";
const OUTPUT_DIR = "./public/models/textures";
const TARGET_SIZE = 2048;

async function downscaleTextures() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const files = await fs.readdir(TEXTURE_DIR);
    const jpgFiles = files.filter((f) => f.endsWith(".jpg"));

    for (const file of jpgFiles) {
      const inputPath = join(TEXTURE_DIR, file);
      const outputPath = join(OUTPUT_DIR, file);

      console.log(`Processing: ${file}`);
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: "cover",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);

      console.log(`✓ Saved: ${outputPath}`);
    }

    console.log("All textures downscaled successfully!");
  } catch (error) {
    console.error("Error downscaling textures:", error);
    process.exit(1);
  }
}

downscaleTextures();
