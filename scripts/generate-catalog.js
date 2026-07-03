/**
 * Scans images/ for product files, groups by ID prefix + category slug,
 * attaches videos, and writes data/catalog.json for Next.js pages.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "images");
const CONFIG_PATH = path.join(ROOT, "data", "product-config.json");
const OUTPUT_PATH = path.join(ROOT, "data", "catalog.json");

const CATEGORIES = [
  {
    slug: "mini-bags",
    name: "Mini Bags",
    label: "Mini Bag Collection",
    pattern: "minibag",
    defaultPrice: 500,
  },
  {
    slug: "party-bags",
    name: "Party Bags",
    label: "Party Bag Collection",
    pattern: "partybag",
    defaultPrice: 1100,
  },
  {
    slug: "oreo-bags",
    name: "Oreo Signature Bags",
    label: "Oreo Signature Collection",
    pattern: "oreo",
    defaultPrice: 700,
  },
  {
    slug: "side-bags",
    name: "Side Bags",
    label: "Side Bag Collection",
    pattern: "side",
    defaultPrice: 850,
  },
  {
    slug: "handle-bags",
    name: "Handle Bags",
    label: "Handle Bag Collection",
    pattern: "handle",
    defaultPrice: 650,
  },
];

const PRODUCT_FILE = /^(B\d+)_(minibag|partybag|oreo|side|handle)(?:\s*\((\d+)\))?(?:\.png)?\.(jpe?g|png|webp)$/i;
const VIDEO_FILE = /^(B\d+)_.*video\.mp4$/i;

const DEFAULTS = {
  currency: "INR",
  description:
    "Handcrafted crochet bag made with premium yarn. Each piece is lovingly woven by hand for a one-of-a-kind finish.",
  material: "Premium cotton-blend crochet yarn",
  dimensions: "18 × 14 × 8 cm (approx.)",
  care: "Spot clean only. Store in a dry place away from direct sunlight.",
  colors: ["Natural"],
  colorVariants: [],
  sizes: ["One Size"],
  rating: 4.8,
  reviewCount: 24,
  inStock: true,
  deliveryDays: "3–5 business days",
  discountPercent: 0,
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    console.warn("Warning: could not parse product-config.json.");
    return {};
  }
}

function naturalSort(a, b) {
  const numA = a.index ?? 0;
  const numB = b.index ?? 0;
  if (numA !== numB) return numA - numB;
  return a.filename.localeCompare(b.filename);
}

function getCategoryByPattern(pattern) {
  return CATEGORIES.find((c) => c.pattern === pattern.toLowerCase());
}

function mediaPath(filename) {
  return "/images/" + encodeURIComponent(filename);
}

function scanProducts() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error("images/ folder not found.");
    process.exit(1);
  }

  const groups = new Map();
  const videos = [];

  for (const filename of fs.readdirSync(IMAGES_DIR)) {
    const imageMatch = filename.match(PRODUCT_FILE);
    if (imageMatch) {
      const id = imageMatch[1].toUpperCase();
      const pattern = imageMatch[2].toLowerCase();
      const category = getCategoryByPattern(pattern);
      if (!category) continue;

      const key = category.slug + ":" + id;
      const index = imageMatch[3] ? parseInt(imageMatch[3], 10) : 0;

      if (!groups.has(key)) {
        groups.set(key, { id, category, images: [], videos: [] });
      }
      groups.get(key).images.push({ filename, index });
      continue;
    }

    const videoMatch = filename.match(VIDEO_FILE);
    if (videoMatch) {
      videos.push({ id: videoMatch[1].toUpperCase(), filename });
    }
  }

  for (const video of videos) {
    for (const [, group] of groups) {
      if (group.id === video.id) {
        group.videos.push(video);
        break;
      }
    }
  }

  return groups;
}

function buildMedia(group, overrides) {
  const labels = overrides.imageLabels || [
    "Front View",
    "Back View",
    "Side View",
    "Detail View",
    "Top View",
    "Lifestyle",
  ];

  const media = group.images.sort(naturalSort).map((entry, i) => ({
    type: "image",
    src: mediaPath(entry.filename),
    label: labels[i] || "View " + (i + 1),
  }));

  const poster = media.find((item) => item.type === "image")?.src;

  for (const video of group.videos) {
    media.push({
      type: "video",
      src: mediaPath(video.filename),
      label: overrides.videoLabel || "Product Video",
      poster,
    });
  }

  return media;
}

function buildCatalog() {
  const config = loadConfig();
  const groups = scanProducts();
  const products = [];

  for (const [, group] of groups) {
    const overrides = config[group.id] || {};
    const categoryDefault = group.category.defaultPrice;
    const media = buildMedia(group, overrides);

    products.push({
      id: group.id,
      category: group.category.slug,
      collection: overrides.collection || group.category.label,
      name: overrides.name || group.id + " " + group.category.name.replace(/s$/, ""),
      price: overrides.price ?? categoryDefault,
      originalPrice: overrides.originalPrice ?? null,
      discountPercent: overrides.discountPercent ?? DEFAULTS.discountPercent,
      currency: overrides.currency || DEFAULTS.currency,
      description: overrides.description || DEFAULTS.description,
      material: overrides.material || DEFAULTS.material,
      dimensions: overrides.dimensions || DEFAULTS.dimensions,
      care: overrides.care || DEFAULTS.care,
      colors: overrides.colors || DEFAULTS.colors,
      colorVariants: overrides.colorVariants || DEFAULTS.colorVariants,
      sizes: overrides.sizes || DEFAULTS.sizes,
      rating: overrides.rating ?? DEFAULTS.rating,
      reviewCount: overrides.reviewCount ?? DEFAULTS.reviewCount,
      inStock: overrides.inStock ?? DEFAULTS.inStock,
      deliveryDays: overrides.deliveryDays || DEFAULTS.deliveryDays,
      media,
    });
  }

  products.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.id.localeCompare(b.id);
  });

  return {
    generatedAt: new Date().toISOString(),
    categories: CATEGORIES.map(({ slug, name, label }) => ({ slug, name, label })),
    products,
  };
}

function main() {
  const catalog = buildCatalog();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + "\n");

  console.log("Generated " + OUTPUT_PATH);
  console.log("Found " + catalog.products.length + " product(s)");
  catalog.products.forEach((p) => {
    const images = p.media.filter((m) => m.type === "image").length;
    const videos = p.media.filter((m) => m.type === "video").length;
    console.log(
      "  " + p.category + "/" + p.id + " — " + images + " image(s)" + (videos ? ", " + videos + " video(s)" : "")
    );
  });
}

main();
