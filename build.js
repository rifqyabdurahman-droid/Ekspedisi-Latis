// build.js — dijalankan otomatis oleh Vercel saat deploy.
// Tugas: menyalin isi repo ke folder "public" dan mengunduh library AR ke public/assets/libs.
// Tidak memakai npm, jadi tidak ada paket yang perlu dipasang.
const fs = require("fs");
const path = require("path");

const OUT = "public";
const SKIP = new Set(["node_modules", OUT, "package.json", "package-lock.json", "vercel.json", "build.js"]);

const LIBS = [
  { file: "aframe.min.js", urls: [
    "https://cdn.jsdelivr.net/npm/aframe@1.5.0/dist/aframe.min.js",
    "https://unpkg.com/aframe@1.5.0/dist/aframe.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/aframe/1.5.0/aframe.min.js" ] },
  { file: "mindar-image-aframe.prod.js", urls: [
    "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
    "https://unpkg.com/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js" ] }
];

async function download(file, urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200000) throw new Error("file terlalu kecil (" + buf.length + " byte)");
      console.log("OK     " + file + " <- " + url + " (" + buf.length + " byte)");
      return buf;
    } catch (e) { console.log("GAGAL  " + url + " : " + e.message); }
  }
  throw new Error("Semua sumber gagal untuk " + file);
}

function list(dir, prefix = "") {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n), st = fs.statSync(p);
    if (st.isDirectory()) { console.log(prefix + n + "/"); list(p, prefix + "  "); }
    else console.log(prefix + n + "  (" + st.size + " byte)");
  }
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const name of fs.readdirSync(".")) {
    if (name.startsWith(".") || SKIP.has(name)) continue;
    fs.cpSync(name, path.join(OUT, name), { recursive: true });
  }

  const libDir = path.join(OUT, "assets", "libs");
  fs.mkdirSync(libDir, { recursive: true });
  for (const lib of LIBS) fs.writeFileSync(path.join(libDir, lib.file), await download(lib.file, lib.urls));

  console.log("\nIsi hasil build:");
  list(OUT);
})().catch(e => { console.error("BUILD GAGAL: " + e.message); process.exit(1); });
