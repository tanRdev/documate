import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve(
    "node_modules",
    "pdfjs-dist",
    "build",
    "pdf.worker.min.js"
);
const targetPath = path.resolve("public", "pdf.worker.min.js");

if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing PDF worker at ${sourcePath}`);
}

fs.copyFileSync(sourcePath, targetPath);
