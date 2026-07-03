/**
 * Watches images/ and regenerates data/minibags.json when files change.
 * Run alongside your local server during development:
 *   npm run watch:minibags
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const IMAGES_DIR = path.join(__dirname, "..", "images");
const GENERATOR = path.join(__dirname, "generate-minibag-catalog.js");

let debounceTimer;

function regenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    try {
      execSync("node \"" + GENERATOR + "\"", { stdio: "inherit" });
    } catch {
      console.error("Catalog generation failed.");
    }
  }, 400);
}

if (!fs.existsSync(IMAGES_DIR)) {
  console.error("images/ folder not found.");
  process.exit(1);
}

regenerate();

fs.watch(IMAGES_DIR, { persistent: true }, function () {
  regenerate();
});

console.log("Watching images/ for mini bag changes…");
