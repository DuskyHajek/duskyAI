const fs = require('fs');
const path = require('path');

const visualsDir = path.join(__dirname, '../assets/images/visuals');
const manifestPath = path.join(visualsDir, 'manifest.json');
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm'];
const skipProjectDirs = new Set(['thumbs']);

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

function thumbRelPath(project, file) {
    const ext = path.extname(file).toLowerCase();
    const thumbName = ext === '.jpg' || ext === '.jpeg' ? file : file.replace(/\.(png|webp|gif)$/i, '.jpg');
    const thumbFs = path.join(visualsDir, project, 'thumbs', thumbName);
    if (fs.existsSync(thumbFs)) {
        return `assets/images/visuals/${project}/thumbs/${thumbName}`;
    }
    return null;
}

function generateManifest() {
    if (!fs.existsSync(visualsDir)) {
        console.error('Visuals directory not found:', visualsDir);
        process.exit(1);
    }

    const result = {};
    const projects = fs.readdirSync(visualsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => !skipProjectDirs.has(name));

    projects.forEach((project) => {
        const projectDir = path.join(visualsDir, project);
        const files = fs.readdirSync(projectDir)
            .filter((file) => {
                const ext = path.extname(file).toLowerCase();
                return allowedExtensions.includes(ext);
            })
            .map((file) => {
                const ext = path.extname(file).toLowerCase();
                const type = ['.mp4', '.mov', '.webm'].includes(ext) ? 'video' : 'image';
                const entry = {
                    file: `assets/images/visuals/${project}/${file}`,
                    type,
                    name: humanizeAlt(file)
                };
                const thumb = thumbRelPath(project, file);
                if (thumb) entry.thumb = thumb;
                return entry;
            });

        if (files.length > 0) {
            result[project] = files;
        }
    });

    fs.writeFileSync(manifestPath, JSON.stringify(result, null, 2));
    console.log(`Manifest generated at: ${manifestPath}`);
    console.log(`Found ${Object.keys(result).length} projects.`);
}

generateManifest();