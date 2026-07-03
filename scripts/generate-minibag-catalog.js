/**
 * Scans images/ for *_minibag* files, groups by bag ID prefix (B1, B2, …),
 * and writes data/minibags.json for the mini bag pages to load.
 *
 * Run after adding new mini bag images:
 *   npm run generate:minibags
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "images");
const CONFIG_PATH = path.join(ROOT, "data", "minibag-config.json");
const OUTPUT_PATH = path.join(ROOT, "data", "minibags.json");

const MINIBAG_FILE = /^(B\d+)_minibag(?:\s*\((\d+)\))?\.(png|jpe?g|webp)$/i;

const DEFAULTS = {
  price: 500,
  currency: "INR",
  description:
    "Handcrafted crochet mini bag made with premium yarn. Compact, stylish, and perfect for everyday essentials.",
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    console.warn("Warning: could not parse minibag-config.json, using defaults.");
    return {};
  }
}

function naturalSort(a, b) {
  const numA = a.index ?? 0;
  const numB = b.index ?? 0;
  if (numA !== numB) return numA - numB;
  return a.filename.localeCompare(b.filename);
}

function scanImages() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error("images/ folder not found.");
    process.exit(1);
  }

  const groups = new Map();

  for (const filename of fs.readdirSync(IMAGES_DIR)) {
    const match = filename.match(MINIBAG_FILE);
    if (!match) continue;

    const id = match[1].toUpperCase();
    const index = match[2] ? parseInt(match[2], 10) : 0;

    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push({
      filename,
      index,
      path: "images/" + filename,
    });
  }

  return groups;
}

function buildCatalog() {
  const config = loadConfig();
  const groups = scanImages();
  const products = [];

  for (const id of [...groups.keys()].sort()) {
    const images = groups.get(id).sort(naturalSort).map((entry) => entry.path);
    const overrides = config[id] || {};

    products.push({
      id,
      name: overrides.name || id + " Mini Bag",
      price: overrides.price ?? DEFAULTS.price,
      currency: overrides.currency || DEFAULTS.currency,
      description: overrides.description || DEFAULTS.description,
      images,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    products,
  };
}

function main() {
  const catalog = buildCatalog();

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + "\n");

  console.log("Generated " + OUTPUT_PATH);
  console.log("Found " + catalog.products.length + " mini bag product(s):");
  catalog.products.forEach(function (p) {
    console.log("  " + p.id + " — " + p.images.length + " image(s)");
  });
}

main();
