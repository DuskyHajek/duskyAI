const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');

function humanizeAlt(filename) {
    const base = path.basename(filename, path.extname(filename))
        .replace(/ \(\d+\)$/, '')
        .replace(/_2k_\d+$/, '')
        .replace(/^(A_|An_|Type_a_)/i, '')
        .replace(/_/g, ' ')
        .trim();
    if (!base) return 'Gallery image';
    return base.charAt(0).toUpperCase() + base.slice(1);
}

async function resizeInPlace(relPath, options) {
    const abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) {
        console.warn('Skip missing:', relPath);
        return;
    }
    const tmp = abs + '.opt.tmp';
    let pipeline = sharp(abs);
    if (options.width || options.height) {
        pipeline = pipeline.resize({
            width: options.width,
            height: options.height,
            fit: options.fit || 'inside',
            withoutEnlargement: true
        });
    }
    if (options.crop) {
        pipeline = sharp(abs).resize(options.crop.width, options.crop.height, {
            fit: 'cover',
            position: 'attention'
        });
    }
    const ext = path.extname(abs).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
        await pipeline.jpeg({ quality: options.quality ?? 82, mozjpeg: true }).toFile(tmp);
    } else if (ext === '.png') {
        await pipeline.png({ compressionLevel: 9, palette: options.palette }).toFile(tmp);
    } else if (ext === '.webp') {
        await pipeline.webp({ quality: options.quality ?? 82 }).toFile(tmp);
    } else {
        console.warn('Unsupported type:', relPath);
        return;
    }
    fs.renameSync(tmp, abs);
    const stat = fs.statSync(abs);
    console.log(`OK ${relPath} — ${(stat.size / 1024).toFixed(1)} KB`);
}

async function optimizeDuskylab() {
    const dir = path.join(root, 'assets/images/visuals/duskylab');
    const thumbsDir = path.join(dir, 'thumbs');
    fs.mkdirSync(thumbsDir, { recursive: true });

    const files = fs.readdirSync(dir).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    for (const file of files) {
        const rel = `assets/images/visuals/duskylab/${file}`;
        await resizeInPlace(rel, { width: 1600, height: 1600, quality: 82 });

        const abs = path.join(dir, file);
        const thumbOut = path.join(thumbsDir, file.replace(/\.(png|webp)$/i, '.jpg'));
        await sharp(abs)
            .resize(320, 320, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 78, mozjpeg: true })
            .toFile(thumbOut);
        console.log(`Thumb ${path.relative(root, thumbOut)}`);
    }
}

async function main() {
    await resizeInPlace('assets/images/photo.jpg', { width: 360, height: 480, fit: 'cover', quality: 85 });

    const photo = path.join(root, 'assets/images/photo.jpg');
    await sharp(photo)
        .resize(1200, 630, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(root, 'assets/images/og-image.jpg'));
    console.log('OK assets/images/og-image.jpg');

    await resizeInPlace('assets/images/logo.png', { width: 480, palette: true });
    await resizeInPlace('assets/images/general-logo.png', { width: 120, palette: true });
    await resizeInPlace('assets/images/pokerlist-logo.png', { width: 112, palette: true });
    await resizeInPlace('assets/images/projects/urbanista.png', { width: 440, height: 280, fit: 'cover' });
    await resizeInPlace('assets/images/projects/makeaivisible.png', { width: 440, height: 280, fit: 'cover' });
    await resizeInPlace('assets/images/projects/aibookdb.png', { width: 440, height: 280, fit: 'cover' });
    await resizeInPlace('assets/images/projects/pokerartai.png', {
        width: 440,
        height: 280,
        fit: 'cover',
        quality: 75,
        palette: false
    });

    await optimizeDuskylab();

    const shelf = path.join(root, 'assets/images/projects/aibookdb-shelf.png');
    if (fs.existsSync(shelf)) {
        fs.unlinkSync(shelf);
        console.log('Removed aibookdb-shelf.png');
    }

    const faviconSvg = path.join(root, 'assets/favicon/favicon.svg');
    if (fs.existsSync(faviconSvg)) {
        fs.unlinkSync(faviconSvg);
        console.log('Removed favicon.svg');
    }

    console.log('Image optimization complete.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});