const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/** Force-install Tailwind oxide native binding on Linux (Railway/npm optional-deps bug). */
function ensureTailwindOxide() {
  if (process.platform !== "linux") return;

  const root = path.join(__dirname, "..");
  const candidates = [
    path.join(root, "node_modules", "@tailwindcss", "oxide-linux-x64-gnu"),
    path.join(root, "node_modules", "@tailwindcss", "oxide-linux-x64-musl"),
  ];

  if (candidates.some((dir) => fs.existsSync(dir))) return;

  let version = "4.3.1";
  try {
    version = require("@tailwindcss/oxide/package.json").version;
  } catch {
    // use pinned fallback
  }

  console.log("Installing Tailwind oxide Linux bindings...");
  for (const pkg of [
    `@tailwindcss/oxide-linux-x64-gnu@${version}`,
    `@tailwindcss/oxide-linux-x64-musl@${version}`,
  ]) {
    try {
      execSync(`npm install ${pkg} --no-save --force`, {
        stdio: "inherit",
        cwd: root,
      });
    } catch {
      // musl may fail on gnu images — that's ok
    }
  }
}

ensureTailwindOxide();
