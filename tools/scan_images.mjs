/* ============================================================
 * 把 assets/img/gallery/ 里的新图片自动登记进 data/images.js
 * ------------------------------------------------------------
 * 用法：node tools/scan_images.mjs
 * 已登记的条目会保留（alt / caption / tag 不会被覆盖），
 * 只为新文件追加一行占位，之后自己改文案即可。
 * ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IMAGES_JS = path.join(ROOT, "assets", "data", "images.js");
const GALLERY = path.join(ROOT, "assets", "img", "gallery");

const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(IMAGES_JS, "utf8"), ctx);
const existing = ctx.window.IMAGES || [];

const exts = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const files = fs.existsSync(GALLERY)
  ? fs.readdirSync(GALLERY).filter((f) => exts.test(f)).sort()
  : [];

const known = new Set(existing.map((i) => i.file));
const added = [];
for (const file of files) {
  const rel = "assets/img/gallery/" + file;
  if (known.has(rel)) continue;
  const name = file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  added.push({ file: rel, alt: name, caption: name, tag: "图片" });
}

const missing = existing.filter((i) => !fs.existsSync(path.join(ROOT, i.file))).map((i) => i.file);

if (!added.length) {
  console.log("没有新图片。目录：" + GALLERY);
  if (missing.length) console.log("注意：以下登记的文件已不存在 -> " + missing.join(", "));
  process.exit(0);
}

const list = existing.concat(added);
const header = `/* ============================================================
 * 图片清单
 * ------------------------------------------------------------
 * 后续加图的唯一登记处。三步：
 *   1) 把图片放进 assets/img/ 或 assets/img/gallery/
 *   2) 在下面的数组里复制一条，改 file / alt / caption
 *   3) 刷新页面（图片墙、访谈配图都会自动出现）
 *
 * alt 必填：给看不到图的人一句描述。
 * 建议：宽度 ≤ 1600px，jpg/webp，单张 ≤ 500KB。
 * ============================================================ */

`;

fs.writeFileSync(IMAGES_JS, header + "window.IMAGES = " + JSON.stringify(list, null, 2) + ";\n", "utf8");
console.log("已追加 " + added.length + " 张：" + added.map((a) => a.file).join(", "));
if (missing.length) console.log("注意：以下登记的文件已不存在 -> " + missing.join(", "));
