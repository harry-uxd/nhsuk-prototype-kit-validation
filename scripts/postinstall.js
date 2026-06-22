#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Only run in interactive terminals — npm can suppress isTTY even in a real terminal,
// so we check both stdin and stdout. Users can also run this manually:
//   node node_modules/nhs-prototype-validation/scripts/postinstall.js
if (!process.stdin.isTTY && !process.stdout.isTTY) process.exit(0);

const PKG_ROOT = path.join(__dirname, "..");
const CWD = process.cwd();

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

async function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

async function run() {
  console.log("\nnhs-prototype-validation post-install\n");

  // Question 1: copy example pages
  const examplesAnswer = await ask("Would you like to copy the example validation pages into your prototype? (y/N) ");
  if (isTruthy(examplesAnswer)) {
    const examplesDest = path.join(CWD, "app", "views", "validation");
    const examplesSrc = path.join(PKG_ROOT, "examples");

    if (fs.existsSync(examplesDest)) {
      const overwriteAnswer = await ask("app/views/validation/ already exists. Overwrite? (y/N) ");
      if (!isTruthy(overwriteAnswer)) {
        console.log("Skipped copying example pages.");
      } else {
        await copyDir(examplesSrc, examplesDest);
        console.log("Example pages copied to app/views/validation/");
      }
    } else {
      await copyDir(examplesSrc, examplesDest);
      console.log("Example pages copied to app/views/validation/");
    }
  }

  // Question 2: copy validation docs
  const docsAnswer = await ask("Would you like to copy the validation docs into your project? (y/N) ");
  if (isTruthy(docsAnswer)) {
    const docsDest = path.join(CWD, "docs", "validation.md");
    const docsSrc = path.join(PKG_ROOT, "docs", "validation.md");

    if (fs.existsSync(docsDest)) {
      const overwriteAnswer = await ask("docs/validation.md already exists. Overwrite? (y/N) ");
      if (!isTruthy(overwriteAnswer)) {
        console.log("Skipped copying validation docs.");
      } else {
        fs.mkdirSync(path.join(CWD, "docs"), { recursive: true });
        fs.copyFileSync(docsSrc, docsDest);
        console.log("Validation docs copied to docs/validation.md");
      }
    } else {
      fs.mkdirSync(path.join(CWD, "docs"), { recursive: true });
      fs.copyFileSync(docsSrc, docsDest);
      console.log("Validation docs copied to docs/validation.md");
    }
  }

  rl.close();
}

run().catch((err) => {
  console.error("Post-install script failed:", err.message);
  rl.close();
  process.exit(1);
});
