#!/usr/bin/env node
"use strict";

// Optional extras script — run from your prototype project root to add
// example pages and/or documentation to your project:
//
//   node node_modules/nhs-prototype-validation/scripts/setup.js

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const CWD = process.cwd();
const PKG_ROOT = path.join(__dirname, "..");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim().toLowerCase()));
  });
}

function isTruthy(answer) {
  return answer === "y" || answer === "yes";
}

async function copyWithOverwriteGuard(src, dest, label) {
  if (fs.existsSync(dest)) {
    const answer = await ask(`${label} already exists. Overwrite? (y/N) `);
    if (!isTruthy(answer)) {
      console.log(`  Skipped ${label}`);
      return;
    }
  }
  const isDir = fs.statSync(src).isDirectory();
  if (isDir) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  console.log(`✓ Copied to ${path.relative(CWD, dest)}`);
}

async function run() {
  console.log("\nnhs-prototype-validation — optional extras\n");

  // Example pages
  const examplesAnswer = await ask("Copy example validation pages to app/views/validation/? (y/N) ");
  if (isTruthy(examplesAnswer)) {
    await copyWithOverwriteGuard(
      path.join(PKG_ROOT, "examples"),
      path.join(CWD, "app", "views", "validation"),
      "app/views/validation/"
    );
  }

  // Docs
  const docsAnswer = await ask("Copy validation docs to docs/validation.md? (y/N) ");
  if (isTruthy(docsAnswer)) {
    await copyWithOverwriteGuard(
      path.join(PKG_ROOT, "docs", "validation.md"),
      path.join(CWD, "docs", "validation.md"),
      "docs/validation.md"
    );
  }

  console.log("\nDone.\n");
  rl.close();
}

run().catch((err) => {
  console.error("Setup script failed:", err.message);
  rl.close();
  process.exit(1);
});
