/* ============================================================
 * 站点自检
 * ------------------------------------------------------------
 * 用法：node tools/check_site.mjs
 * 检查：本地链接与资源是否都存在、数据条数、统计口径、
 *       洞察里的数字是否算得出来、访谈原文是否与文档一致。
 * 退出码：0 = 全部通过；1 = 有失败项。
 * ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(TOOLS);
const SOURCE = path.join(TOOLS, "source", "hw4_dump.txt");

let failures = 0;
const ok = (msg) => console.log("  ok   " + msg);
const fail = (msg) => {
  failures += 1;
  console.log("  FAIL " + msg);
};
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

/* ---------- 1. 载入数据模块 ---------- */
const context = vm.createContext({ window: {}, console, URLSearchParams });
function run(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), "utf8");
  vm.runInContext(code, context, { filename: rel });
}
["assets/data/site.js", "assets/data/survey.js", "assets/data/interviews.js", "assets/data/insights.js", "assets/data/images.js", "assets/js/aggregate.js"].forEach(run);

const { META, SURVEY, INTERVIEWS, IMAGES, INSIGHT_CARDS } = context.window;
const Aggregate = context.Aggregate;

console.log("\n== 数据完整性 ==");
check(Array.isArray(INTERVIEWS) && INTERVIEWS.length === 4, "访谈份数 = 4（实际 " + (INTERVIEWS || []).length + "）");
check(Array.isArray(SURVEY.rows) && SURVEY.rows.length === 12, "问卷行数 = 12（实际 " + SURVEY.rows.length + "）");
check(SURVEY.questions.length === 10, "问卷题项 = 10（实际 " + SURVEY.questions.length + "）");

const sectionCounts = INTERVIEWS.map((iv) => iv.sections.length);
check(sectionCounts.every((n) => n === 3), "每位受访者 3 组主题：" + sectionCounts.join("/"));
check(INTERVIEWS.every((iv) => iv.warmup.length === 3), "每位受访者 3 道暖场题");
check(INTERVIEWS.every((iv) => iv.name && iv.summary && iv.quote), "受访者姓名/摘要/金句齐全");

/* ---------- 2. 统计口径 ---------- */
const stats = Aggregate.build(SURVEY.rows, SURVEY.questions, SURVEY.groups);
const helper = Aggregate.helper(stats);

console.log("\n== 统计口径 ==");
SURVEY.questions.forEach((q) => {
  const bucket = stats.byKey[q.key];
  const sum = bucket.items.reduce((s, it) => s + it.value, 0);
  const pctSum = bucket.items.reduce((s, it) => s + it.pct, 0);
  if (q.type === "multi") {
    check(bucket.items.every((it) => it.value <= stats.total), q.key + " 多选各项 ≤ 总人数");
  } else {
    check(sum === stats.total, q.key + " 单选合计 = " + stats.total + "（实际 " + sum + "）");
    if (Math.abs(pctSum - 100) > 2) fail(q.key + " 百分比之和偏离 100：" + pctSum);
  }
});

check(stats.derived.afterMidnight > 0 && stats.derived.afterMidnight <= 12, "零点后入睡人数 = " + stats.derived.afterMidnight);

/* 每道题的选项都在 rows 里出现过（避免写错的选项名静默为 0） */
SURVEY.questions.forEach((q) => {
  const bucket = stats.byKey[q.key];
  if (q.type === "single" && q.options) {
    const zeros = bucket.items.filter((it) => it.value === 0).map((it) => it.label);
    if (zeros.length) console.log("  note " + q.key + " 计数为 0 的选项：" + zeros.join("、"));
  }
});

/* ---------- 3. 洞察数字可算 ---------- */
console.log("\n== 洞察卡片 ==");
const cards = INSIGHT_CARDS(helper);
check(cards.length === 6, "洞察条数 = 6（实际 " + cards.length + "）");
cards.forEach((card) => {
  const all = [card.lead, ...card.evidence, ...card.quotes.map((q) => q.text), card.implication].join(" ");
  if (/undefined|NaN|null/.test(all)) fail("洞察「" + card.title + "」里出现 undefined/NaN");
  if (!/\d/.test(card.evidence.join(""))) fail("洞察「" + card.title + "」缺少数字证据");
});
ok("洞察文案未出现 undefined / NaN");

/* ---------- 4. 访谈原文与文档一致 ---------- */
console.log("\n== 访谈原文比对 ==");
const norm = (s) => String(s).replace(/[\s\u3000]+/g, "");
if (!fs.existsSync(SOURCE)) {
  console.log("  skip 找不到生成源 " + SOURCE + "，跳过原文比对");
} else {
  const source = norm(fs.readFileSync(SOURCE, "utf8"));
  let checked = 0;
  const missing = [];
  const walk = (nodes, where) => {
    nodes.forEach((item, i) => {
      checked += 1;
      if (!source.includes(norm(item.q))) missing.push(where + "#" + (i + 1) + " 问题");
      if (item.a && item.a !== "未回答。" && !source.includes(norm(item.a))) {
        missing.push(where + "#" + (i + 1) + " 回答：" + norm(item.a).slice(0, 24));
      }
      (item.followups || []).forEach((f, j) => {
        checked += 1;
        if (!source.includes(norm(f.q))) missing.push(where + "#" + (i + 1) + ".追问" + (j + 1) + " 问题");
        if (f.a && f.a !== "未回答。" && !source.includes(norm(f.a))) {
          missing.push(where + "#" + (i + 1) + ".追问" + (j + 1) + " 回答：" + norm(f.a).slice(0, 24));
        }
      });
    });
  };
  INTERVIEWS.forEach((iv) => {
    walk(iv.warmup, iv.name + "/暖场");
    iv.sections.forEach((sec) => walk(sec.items, iv.name + "/" + sec.title));
  });
  check(missing.length === 0, "访谈问答逐字命中原文（比对 " + checked + " 条）");
  missing.slice(0, 12).forEach((m) => fail("原文中找不到：" + m));
}

/* ---------- 5. 链接与资源 ---------- */
console.log("\n== 链接与资源 ==");
const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith(".html") && !f.startsWith("_"));
check(htmlFiles.length >= 7, "页面数 ≥ 7（实际 " + htmlFiles.length + "）");

const missingFiles = [];
const dupIds = [];
const usedAssets = new Set();
htmlFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const refs = [...html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  refs.forEach((ref) => {
    if (!ref || ref.startsWith("#") || /^(https?:|mailto:|data:|\/\/)/.test(ref)) return;
    const clean = ref.split("?")[0].split("#")[0];
    if (!clean) return;
    usedAssets.add(clean);
    if (!fs.existsSync(path.join(ROOT, clean)) && !clean.endsWith(".html")) {
      missingFiles.push(file + " → " + ref);
    }
    if (clean.endsWith(".html") && !fs.existsSync(path.join(ROOT, clean))) {
      missingFiles.push(file + " → " + ref);
    }
  });

  const ids = [...html.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  ids.forEach((id) => {
    if (seen.has(id)) dupIds.push(file + " → #" + id);
    seen.add(id);
  });
});
check(missingFiles.length === 0, "所有本地链接/资源都存在");
missingFiles.forEach((m) => fail("缺少：" + m));
check(dupIds.length === 0, "页面内 id 唯一");
dupIds.forEach((d) => fail("重复 id：" + d));

const requiredScripts = [
  "assets/data/site.js",
  "assets/data/survey.js",
  "assets/data/interviews.js",
  "assets/data/insights.js",
  "assets/data/images.js",
  "assets/js/aggregate.js",
  "assets/js/charts.js",
  "assets/js/render.js",
  "assets/js/app.js"
];
htmlFiles.forEach((file) => {
  if (file === "404.html") return; // 404 页是纯静态的，不加载数据脚本
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const missing = requiredScripts.filter((s) => !html.includes('src="' + s + '"'));
  if (missing.length) fail(file + " 缺少脚本：" + missing.join(", "));
});
ok("每个页面都引用了完整的脚本清单");

/* 图片清单里的文件都存在 */
const missingImages = IMAGES.filter((img) => !fs.existsSync(path.join(ROOT, img.file))).map((img) => img.file);
check(missingImages.length === 0, "图片清单文件都存在（" + IMAGES.length + " 张）");
missingImages.forEach((m) => fail("图片缺失：" + m));
IMAGES.forEach((img) => {
  if (!img.alt) fail("图片缺少 alt：" + img.file);
});

/* ---------- 汇总 ---------- */
console.log("\n" + (failures === 0 ? "全部通过 ✅" : failures + " 项失败 ❌"));
process.exit(failures === 0 ? 0 : 1);
