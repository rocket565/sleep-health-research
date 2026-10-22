# 维护说明

这是「二十二载 · 青年睡眠调研」的静态站点：纯 HTML + CSS + 原生 JavaScript，
没有后端、没有数据库、没有第三方依赖。双击 `index.html` 就能看，也可以直接放到任何静态托管上。

---

## 一、本地预览

```bash
node tools/serve.mjs
# 浏览器打开 http://127.0.0.1:4321/
```

`tools/serve.mjs` 只监听本机，不会对外提供服务。想换端口就 `node tools/serve.mjs 5000`。

## 二、改完先自检

```bash
node tools/check_site.mjs
```

它会检查：本地链接和图片是否都存在、页面内重复 id、每页是否引用完整脚本、
问卷统计是否加起来等于样本数、洞察里的数字是否算得出来，
以及**访谈原文是否逐字来自《作业4》**（这条最重要，防止改错字）。

全部通过会打印 `全部通过 ✅`，否则退出码是 1。

---

## 三、加一张图片（最常用）

**三步：**

1. 把图片放进 `assets/img/gallery/`（比如 `访谈现场-1.jpg`）。
2. 在 `assets/data/images.js` 的数组里加一条：

```js
{
  file: "assets/img/gallery/访谈现场-1.jpg",
  alt: "四位受访者与访谈提纲的合影",
  caption: "第一次访谈结束后的合照，2025-10",
  tag: "访谈"
}
```

3. 刷新页面，图片墙（`gallery.html`）就会出现这张图；点开可以放大，左右方向键切换。

**省事写法**：不想手写条目时，跑一次

```bash
node tools/scan_images.mjs
```

它会把 `assets/img/gallery/` 里还没登记的文件自动补进 `images.js`，
`alt` 和 `caption` 先用文件名占位，你再改成中文说明即可。

**建议**：宽度 ≤ 1600px、jpg/webp、单张 ≤ 500KB；`alt` 必填。
路径一律从站点根目录写起（`assets/img/...`），不要写 `../`。

### 给某一份访谈加配图

打开 `assets/data/interviews.js`，找到对应受访者，在 `images` 数组里加同样的条目：

```js
"images": [
  { "file": "assets/img/gallery/访谈现场-1.jpg", "alt": "访谈现场", "caption": "与林梦依的访谈，宿舍楼下的自习室" }
]
```

访谈详情页底部会自动出现「访谈配图」一节，目录里也会多一项。

---

## 四、改内容

| 想改什么 | 改哪个文件 |
| --- | --- |
| 访谈问答正文 | 不要手改，见下方「访谈原文」 |
| 受访者简介、标签、金句 | `assets/data/interviews.js` 里的 `summary` / `tags` / `quote` / `profile` |
| 问卷题目与选项 | `assets/data/survey.js` → `questions` |
| 问卷每一份的答案 | `assets/data/survey.js` → `rows` |
| 6 条洞察的文案 | `assets/data/insights.js` |
| 分析页的结论、亲和图说明、6 个主题 | `assets/data/analysis.js` |
| 团队、分工、流程、链接 | `assets/data/site.js` |
| 页面上的固定文字 | 对应的 `*.html` |
| 颜色、字号、间距 | `assets/css/style.css` 开头的变量区 |

### 分析页（`analysis.html`）的两个模块

- **问卷分析**：人口统计、四个关键发现（含交叉表）、问卷部分结论。
  其中所有数字都由 `assets/data/survey.js` 的 12 份原始数据现算——
  改问卷数据，图、百分比、交叉表、平均入睡时间会一起变；
  只有 `analysis.js` 里写成句子的结论需要你自己复核。
- **亲和图**：三张过程图 + 6 个顶层主题 + 访谈部分结论。
  图片在 `assets/img/affinity/`，主题名与子主题写在 `analysis.js` 的 `affinity.themes`。

> 亲和图的可编辑源在项目旁边的 `..\亲和图\` 文件夹（`board.html` 可直接打开改，
> `data/notes.js` 是 64 张便利贴）。改完重跑那边的 `node tools/export.mjs`，
> 再把 `out/` 里三张 PNG 覆盖到本站 `assets/img/affinity/` 的同名文件即可。

### 加一份新问卷

在 `assets/data/survey.js` 的 `rows` 里复制一行，改 `id` 和字段值即可。
图表、百分比、洞察里的「x/12」都会自动重算，不用改别的地方。

> 如果新增的选项是文档里没出现过的（比如新的提醒方式），
> 记得把文字补进 `questions` 里对应题目的 `options`，否则它会排在图最后。

### 访谈原文（`interviews.js` 是自动生成的）

正文一个字都不建议手改——它必须和《作业4》docx 一致。正确做法是：

1. 用 Word 打开 `作业4.docx`，把访谈部分另存/导出为纯文本，按现有 `tools/source/hw4_dump.txt` 的格式整理
   （每行形如 `[12] <Normal> 正文`，脚本只取尖括号后面的内容）。
2. 跑 `python tools/build_interviews.py <新的dump路径>` 重新生成 `interviews.js`。
3. 跑 `node tools/check_site.mjs` 确认原文比对通过。

如果只是补配图，直接在生成后的 `images` 数组里加就行，重新生成会覆盖它——所以要么先加图后生成，要么生成后别再跑脚本。

---

## 五、发布到 GitHub Pages（推荐）

1. 在 GitHub 新建一个仓库（例如 `sleep-health-research`），不要勾选 README。
2. 在本目录执行：

```bash
git init -b main
git add .
git commit -m "睡眠调研站"
git remote add origin https://github.com/<你的用户名>/sleep-health-research.git
git push -u origin main
```

3. 仓库 → **Settings → Pages** → Source 选 `Deploy from a branch` → 分支 `main`、目录 `/ (root)` → Save。
4. 一两分钟后访问 `https://<你的用户名>.github.io/sleep-health-research/`。

仓库里的 `.nojekyll` 已经在位，不用额外配置。所有链接都是相对路径，放在子路径下也能正常打开。

> 换别的托管（Netlify / Cloudflare Pages / Vercel / 学校服务器）也一样：
> 把整个目录当根目录上传，不需要构建命令，构建输出目录就是仓库根。

### 临时公网链接（免注册，电脑开着才有效）

只想马上发一个链接给同学看，可以临时打洞：

```bash
node tools/serve.mjs 4321
# 另开一个终端：
cloudflared tunnel --url http://127.0.0.1:4321
```

第二条命令会打印一个 `https://xxxx.trycloudflare.com` 的地址，谁都能打开、只能看不能改。
缺点是电脑关机或命令结束，链接就失效了——要长期可用还是用上面的 GitHub Pages。

---

## 六、目录结构

```
.
├─ index.html            首页：项目速览、研究流程、3 条发现、数据速览
├─ project.html          项目背景与方案
├─ interviews.html       访谈列表（4 张卡片）
├─ interview.html        访谈详情，读 ?id=1..4
├─ survey.html           问卷：设计 / 图表 / 原始数据 三个 Tab + 6 条洞察
├─ analysis.html         分析：问卷分析 / 亲和图 两个 Tab（对应《作业5》）
├─ gallery.html          图片墙（灯箱放大）
├─ about.html            团队、数据来源、隐私说明
├─ 404.html
├─ .nojekyll
├─ assets/
│  ├─ css/style.css      设计系统、夜间/日间主题、打印样式
│  ├─ js/aggregate.js    统计聚合（问卷数据 → 计数/百分比）
│  ├─ js/charts.js       图表渲染（CSS 条形 + SVG 环形）
│  ├─ js/render.js       把 data/ 渲染成页面元素
│  ├─ js/app.js          导航、主题切换、Tab、灯箱、滚动动效
│  ├─ data/              所有内容的唯一来源（survey / interviews / insights / analysis / site / images）
│  └─ img/               affinity/（亲和图三阶段）、gallery/（你放图的地方）
└─ tools/
   ├─ serve.mjs          本地预览服务器
   ├─ check_site.mjs     自检
   ├─ scan_images.mjs    自动登记新图片
   └─ build_interviews.py 从 dump 文本重新生成访谈数据
```

## 七、几个约定

- **不要**直接从 Word 复制粘贴进 `interviews.js`：中文引号、全角空格很容易在复制时变形，自检会报错。
- 图片路径一律以站点根目录为基准。
- 页面用的字体是系统字体（苹方 / 微软雅黑 / 思源黑体），不加载外部字体，所以离线也能正常显示。
- 默认是夜间主题；右上角的 ☀/☾ 可以切到日间主题，选择会记在浏览器里。
- 打印或「另存为 PDF」时，导航和按钮会自动隐藏，访谈全部展开。
