/**
 * Optional build: copies the site into dist/ with light, dependency-free minification.
 *
 *   node build.mjs      (or: npm run build)
 *
 * - HTML: strips comments and collapses whitespace (<pre>, <textarea>, <script>, <style> left alone).
 * - CSS:  local stylesheets linked from the HTML are bundled, in order, into css/styles.css
 *         and minified. The <link> tags are rewritten to point at the bundle.
 * - JS:   strips full-line comments, indentation and blank lines. This is not a real
 *         minifier: avoid multi-line template literals, whose indentation would be lost.
 * - Everything else is copied as-is.
 */
import { readFile, writeFile, mkdir, rm, readdir, copyFile, stat } from 'node:fs/promises';
import { dirname, join, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const CSS_BUNDLE = 'css/styles.css';

// Top-level names that never go into dist/.
const EXCLUDE = new Set([
    '.git', '.gitignore', '.gitattributes', '.editorconfig', '.vscode', '.idea',
    'dist', 'node_modules', 'build.mjs', 'package.json', 'package-lock.json', 'README.md',
]);

const toPosix = (p) => p.split(sep).join('/');

async function walk(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (dir === ROOT && EXCLUDE.has(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...(await walk(full)));
        else files.push(toPosix(relative(ROOT, full)));
    }
    return files;
}

/* Minifiers ---------------------------------------------------------------- */

function minifyCss(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};,])\s*/g, '$1')
        .replace(/:\s+/g, ':') // only *after* a colon: "a :hover" and "a:hover" differ
        .replace(/;}/g, '}')
        .trim();
}

function minifyJs(js) {
    return js
        .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n') + '\n';
}

function minifyHtml(html) {
    const preserved = [];
    const keep = (match) => `\u0000${preserved.push(match) - 1}\u0000`;

    return html
        .replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, keep)
        .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '> <')
        .trim()
        .replace(/\u0000(\d+)\u0000/g, (_, i) => preserved[i]) + '\n';
}

/* CSS bundling ------------------------------------------------------------- */

const STYLESHEET_LINK = /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi;
const isLocal = (href) => !/^([a-z]+:)?\/\//i.test(href);

function localStylesheets(html) {
    return [...html.matchAll(STYLESHEET_LINK)]
        .map((m) => ({ tag: m[0], href: m[0].match(/\bhref=["']([^"']+)["']/i)?.[1] }))
        .filter((link) => link.href && isLocal(link.href));
}

function rewriteStylesheets(html, links) {
    let first = true;
    for (const { tag } of links) {
        html = html.replace(tag, first ? `<link rel="stylesheet" href="${CSS_BUNDLE}">` : '');
        first = false;
    }
    return html;
}

/* Build -------------------------------------------------------------------- */

async function write(path, contents) {
    const out = join(DIST, path);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, contents);
}

async function build() {
    await rm(DIST, { recursive: true, force: true });

    const files = await walk(ROOT);
    const htmlFiles = files.filter((f) => extname(f) === '.html');

    // Collect stylesheets from every page, in first-seen order.
    const bundled = [];
    const pages = new Map();
    for (const file of htmlFiles) {
        const html = await readFile(join(ROOT, file), 'utf8');
        const links = localStylesheets(html);
        for (const { href } of links) {
            const path = toPosix(join(dirname(file), href)).replace(/^\.\//, '');
            if (!bundled.includes(path)) bundled.push(path);
        }
        pages.set(file, rewriteStylesheets(html, links));
    }

    let before = 0;
    let after = 0;
    const report = (label, inSize, outSize) => {
        before += inSize;
        after += outSize;
        console.log(`  ${label.padEnd(24)} ${String(inSize).padStart(7)} -> ${String(outSize).padStart(7)} bytes`);
    };

    if (bundled.length) {
        const sources = await Promise.all(bundled.map((f) => readFile(join(ROOT, f), 'utf8')));
        const css = minifyCss(sources.join('\n'));
        await write(CSS_BUNDLE, css);
        report(CSS_BUNDLE, Buffer.byteLength(sources.join('\n')), Buffer.byteLength(css));
    }

    for (const file of files) {
        if (bundled.includes(file)) continue;
        const ext = extname(file);

        if (ext === '.html') {
            const out = minifyHtml(pages.get(file));
            await write(file, out);
            report(file, (await stat(join(ROOT, file))).size, Buffer.byteLength(out));
        } else if (ext === '.js') {
            const src = await readFile(join(ROOT, file), 'utf8');
            const out = minifyJs(src);
            await write(file, out);
            report(file, Buffer.byteLength(src), Buffer.byteLength(out));
        } else {
            await mkdir(dirname(join(DIST, file)), { recursive: true });
            await copyFile(join(ROOT, file), join(DIST, file));
        }
    }

    console.log(`  ${'total'.padEnd(24)} ${String(before).padStart(7)} -> ${String(after).padStart(7)} bytes`);
    console.log(`Built to ${toPosix(relative(process.cwd(), DIST)) || 'dist'}/`);
}

build().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
