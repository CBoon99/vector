/**
 * Resize + compress header logo for fast LCP. Run: npm run optimize:branding
 * Reads the source PNG once; writes dopple-it-logo.webp + dopple-it-logo.png.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRANDING_DIR = path.join(__dirname, '..', 'public', 'branding');
const SOURCE = path.join(BRANDING_DIR, 'dopple-it-logo.png');
const OUT_WEBP = path.join(BRANDING_DIR, 'dopple-it-logo.webp');
const OUT_PNG = path.join(BRANDING_DIR, 'dopple-it-logo.png');

/** Max width for ~260px CSS display × ~2× DPR */
const MAX_WIDTH = 560;

async function main() {
    if (!fs.existsSync(SOURCE)) {
        console.error('Missing', SOURCE);
        process.exit(1);
    }

    const input = fs.readFileSync(SOURCE);
    const meta = await sharp(input).metadata();

    const resized = sharp(input).resize({
        width: MAX_WIDTH,
        fit: 'inside',
        withoutEnlargement: true
    });

    await resized
        .clone()
        .webp({ quality: 82, effort: 6, smartSubsample: true })
        .toFile(OUT_WEBP);

    await resized
        .clone()
        .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: false
        })
        .toFile(OUT_PNG);

    const wWebp = fs.statSync(OUT_WEBP).size;
    const wPng = fs.statSync(OUT_PNG).size;
    console.log(
        `Branding: ${meta.width}×${meta.height} → max ${MAX_WIDTH}px wide | webp ${(wWebp / 1024).toFixed(1)} KiB | png ${(wPng / 1024).toFixed(1)} KiB`
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
