/* ============================================================
 * 页面渲染：把 data/ 里的数据变成 DOM
 * ------------------------------------------------------------
 * 所有页面共用。页面本身只留空容器 + data-* 标记，
 * 这样加一份访谈、加一张图都不用动 HTML。
 * ============================================================ */
(function () {
  "use strict";

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function stats() {
    var survey = window.SURVEY || { questions: [], rows: [] };
    return window.Aggregate.build(survey.rows, survey.questions, survey.groups);
  }

  function initials(name) {
    // 中文名取姓（首字）做头像缩写，比取中间字自然
    return name ? name.charAt(0) : "?";
  }

  function isUnanswered(text) {
    return !text || /^未回答。?$/.test(text.trim());
  }

  /* ---------- 首页 ---------- */
  function home() {
    var interviews = window.INTERVIEWS || [];
    var rows = (window.SURVEY && window.SURVEY.rows) || [];
    var themes = (window.META && window.META.themes) || [];

    var numbers = [
      { n: String(interviews.length), label: "位受访者 · 深度访谈" },
      { n: String(rows.length), label: "份有效问卷" },
      { n: String(themes.length), label: "组访谈主题" }
    ];
    var mount = $("[data-home-stats]");
    if (mount) {
      numbers.forEach(function (item) {
        var box = make("div", "stat");
        box.appendChild(make("b", "", item.n));
        box.appendChild(make("span", "", item.label));
        mount.appendChild(box);
      });
    }

    var flow = $("[data-home-process]");
    if (flow && window.META) {
      (window.META.process || []).forEach(function (step) {
        var li = make("li");
        li.setAttribute("data-step", step.step);
        li.appendChild(make("h3", "", step.title));
        li.appendChild(make("p", "", step.desc));
        flow.appendChild(li);
      });
    }

    var insightMount = $("[data-home-insights]");
    if (insightMount && window.INSIGHT_CARDS) {
      var cards = window.INSIGHT_CARDS(window.Aggregate.helper(stats()));
      cards.slice(0, 3).forEach(function (card) {
        var art = make("article", "insight reveal");
        art.setAttribute("data-no", card.no);
        art.appendChild(make("h3", "", card.title));
        art.appendChild(make("p", "lead", card.lead));
        insightMount.appendChild(art);
      });
    }

    var teaser = $("[data-home-teasers]");
    if (teaser) {
      var s = stats();
      var h = window.Aggregate.helper(s);
      var facts = [
        { k: h.afterMidnightRatio(), t: "入睡时间在零点之后", href: "survey.html#charts" },
        { k: h.groupRatio("Q6", "短视频 / 剧集"), t: "会因短视频/剧集推迟睡觉", href: "survey.html#charts" },
        { k: h.ratio("Q9", "强制锁定屏幕"), t: "希望被直接强制锁定屏幕", href: "survey.html#charts" }
      ];
      facts.forEach(function (f) {
        var a = make("a", "card iv-card");
        a.href = f.href;
        a.appendChild(make("b", "stat-inline", f.k));
        a.appendChild(make("span", "muted", f.t));
        teaser.appendChild(a);
      });
    }
  }

  /* ---------- 访谈列表 ---------- */
  function interviewList() {
    var mount = $("[data-interview-list]");
    if (!mount) return;
    (window.INTERVIEWS || []).forEach(function (iv, i) {
      var a = make("a", "iv-card reveal");
      a.href = "interview.html?id=" + iv.id;
      a.style.setProperty("--i", i);
      a.setAttribute("aria-label", "查看 " + iv.name + " 的完整访谈");

      var top = make("div", "iv-top");
      var avatar = make("div", "iv-avatar", initials(iv.name));
      avatar.setAttribute("aria-hidden", "true");
      var names = make("div");
      names.appendChild(make("h2", "iv-name", iv.name));
      names.appendChild(make("p", "iv-sub", iv.subtitle));
      top.appendChild(avatar);
      top.appendChild(names);
      a.appendChild(top);

      if (iv.quote) a.appendChild(make("blockquote", "iv-quote", "“" + iv.quote + "”"));
      if (iv.tags && iv.tags.length) {
        var tags = make("div", "pill-row");
        iv.tags.slice(0, 3).forEach(function (t) { tags.appendChild(make("span", "tag", t)); });
        a.appendChild(tags);
      }
      a.appendChild(make("span", "iv-more", "查看完整访谈 →"));
      mount.appendChild(a);
    });
  }

  /* ---------- 访谈详情 ---------- */
  function interviewDetail() {
    var mount = $("[data-interview-detail]");
    if (!mount) return;

    var list = window.INTERVIEWS || [];
    var id = parseInt(new URLSearchParams(location.search).get("id") || "", 10);
    var iv = list.filter(function (x) { return x.id === id; })[0];

    if (!iv) {
      var box = make("div", "card");
      box.appendChild(make("h1", "", "没有找到这一份访谈"));
      box.appendChild(make("p", "muted", "链接里的编号可能不正确。访谈编号为 1–" + list.length + "。"));
      var back = make("a", "btn btn--ghost", "← 返回访谈列表");
      back.href = "interviews.html";
      box.appendChild(back);
      mount.appendChild(box);
      return;
    }

    document.title = iv.name + " 的访谈 · " + (window.META ? window.META.team : "") + " 睡眠调研";

    var crumb = $("[data-crumb-name]");
    if (crumb) crumb.textContent = iv.name;

    /* 头部 */
    var head = make("header", "interview-head");
    head.appendChild(make("p", "kicker", "受访者 " + String(iv.id).padStart(2, "0")));
    head.appendChild(make("h1", "", iv.name));
    if (iv.subtitle) head.appendChild(make("p", "lead", iv.subtitle));
    if (iv.summary) head.appendChild(make("p", "muted", iv.summary));

    if (iv.tags && iv.tags.length) {
      var pills = make("div", "pill-row");
      pills.style.marginTop = "6px";
      iv.tags.forEach(function (t) { pills.appendChild(make("span", "tag", t)); });
      head.appendChild(pills);
    }

    if (iv.profile && iv.profile.length) {
      var dl = make("dl", "profile-grid");
      iv.profile.forEach(function (row) {
        var cell = make("div");
        cell.appendChild(make("dt", "", row.k));
        cell.appendChild(make("dd", "", row.v));
        dl.appendChild(cell);
      });
      head.appendChild(dl);
    }
    mount.appendChild(head);

    /* 目录 */
    var tocMount = $("[data-interview-toc]");
    var tocList = make("ol");
    var sections = [];
    if (iv.warmup && iv.warmup.length) {
      sections.push({ id: "warmup", title: "暖场：你是谁、怎么睡", items: iv.warmup, purpose: "" });
    }
    (iv.sections || []).forEach(function (sec) { sections.push(sec); });
    if (iv.images && iv.images.length) {
      sections.push({ id: "photos", title: "访谈配图", items: null, purpose: "" });
    }

    sections.forEach(function (sec) {
      var li = make("li");
      var a = make("a", "", sec.title);
      a.href = "#" + sec.id;
      li.appendChild(a);
      tocList.appendChild(li);
    });
    if (tocMount) tocMount.appendChild(tocList);

    /* 正文 */
    var body = make("div");
    sections.forEach(function (sec, si) {
      if (sec.id === "photos") {
        var photoSec = make("section", "qa-section");
        photoSec.id = "photos";
        photoSec.appendChild(make("h2", "", "访谈配图"));
        var grid = make("div", "gallery-grid");
        iv.images.forEach(function (img, i) {
          grid.appendChild(galleryButton(img, iv.images, i));
        });
        photoSec.appendChild(grid);
        body.appendChild(photoSec);
        return;
      }

      var section = make("section", "qa-section");
      section.id = sec.id;
      var h2 = make("h2");
      h2.appendChild(make("span", "idx", String(si + 1).padStart(2, "0")));
      h2.appendChild(make("span", "", sec.title));
      section.appendChild(h2);
      if (sec.purpose) section.appendChild(make("p", "purpose", "访谈目的：" + sec.purpose));

      sec.items.forEach(function (item, idx) {
        var qa = make("div", "qa");
        var q = make("p", "qa-q");
        q.appendChild(make("span", "n", String(idx + 1).padStart(2, "0")));
        q.appendChild(make("span", "", item.q));
        qa.appendChild(q);

        var a = make("p", "qa-a", item.a || "未回答。");
        if (isUnanswered(item.a)) a.classList.add("is-empty");
        qa.appendChild(a);

        (item.followups || []).forEach(function (f) {
          var follow = make("div", "follow");
          var fq = make("p", "qa-q");
          fq.appendChild(make("span", "n", "追问"));
          fq.appendChild(make("span", "", f.q));
          follow.appendChild(fq);
          var fa = make("p", "qa-a", f.a || "未回答。");
          if (isUnanswered(f.a)) fa.classList.add("is-empty");
          follow.appendChild(fa);
          qa.appendChild(follow);
        });

        section.appendChild(qa);
      });

      body.appendChild(section);
    });
    mount.appendChild(body);

    /* 上一位 / 下一位 */
    var nav = make("div", "iv-nav");
    var prev = list.filter(function (x) { return x.id === iv.id - 1; })[0];
    var next = list.filter(function (x) { return x.id === iv.id + 1; })[0];
    if (prev) {
      var pa = make("a", "btn btn--ghost", "← " + prev.name);
      pa.href = "interview.html?id=" + prev.id;
      nav.appendChild(pa);
    } else {
      var backAll = make("a", "btn btn--ghost", "← 全部访谈");
      backAll.href = "interviews.html";
      nav.appendChild(backAll);
    }
    if (next) {
      var na = make("a", "btn btn--ghost", next.name + " →");
      na.href = "interview.html?id=" + next.id;
      nav.appendChild(na);
    }
    body.appendChild(nav);
  }

  /* ---------- 问卷：题目设计 ---------- */
  function surveyDesign() {
    var mount = $("[data-survey-design]");
    if (!mount || !window.SURVEY) return;
    window.SURVEY.questions.forEach(function (q) {
      var item = make("div", "q-item");
      item.appendChild(make("span", "code", q.key));
      var box = make("div");
      box.appendChild(make("h3", "", q.title));
      var opts = make("div", "opts");
      (q.options || []).forEach(function (o) { opts.appendChild(make("span", "", o)); });
      if (!q.options || !q.options.length) opts.appendChild(make("span", "", "开放作答"));
      box.appendChild(opts);
      item.appendChild(box);
      mount.appendChild(item);
    });

    var meta = window.SURVEY.meta || {};
    var metaMount = $("[data-survey-meta]");
    if (metaMount) {
      var facts = [
        ["有效样本", meta.sample + " 份"],
        ["执行方式", meta.method + "（" + meta.executor + "）"],
        ["调研对象", meta.scope],
        ["统计口径", "按人数计算百分比，四舍五入到整数"]
      ];
      facts.forEach(function (pair) {
        var row = make("div", "profile-item");
        row.appendChild(make("dt", "", pair[0]));
        row.appendChild(make("dd", "", pair[1]));
        metaMount.appendChild(row);
      });
    }
  }

  /* ---------- 问卷：图表 ---------- */
  function surveyCharts() {
    var mount = $("[data-survey-charts]");
    if (!mount || !window.SURVEY) return;
    var s = stats();
    var order = [
      { key: "Q2", kind: "bar", ordered: true },
      { key: "Q3", kind: "bar", ordered: true, tone: "amber" },
      { key: "Q4", kind: "bar", ordered: true },
      { key: "Q9", kind: "bar", ordered: true, tone: "amber" },
      { key: "Q10", kind: "bar", ordered: true, tone: "teal" },
      { key: "Q5", kind: "bar", multi: true },
      { key: "Q6", kind: "bar", group: true, multi: true },
      { key: "Q8", kind: "bar" },
      { key: "Q1", kind: "donut" },
      { key: "Q7", kind: "donut" }
    ];

    order.forEach(function (item) {
      var q = window.SURVEY.questions.filter(function (x) { return x.key === item.key; })[0];
      if (!q) return;
      var bucket = item.group ? s.groups[item.key] : s.byKey[item.key];
      if (!bucket) return;

      var noteParts = [];
      if (item.multi) noteParts.push("多选题：按提到该项的受访者人数统计，各项之和可超过 " + s.total + "。");
      if (item.group) {
        noteParts.push("已按内容类目归并：短视频/剧集、社交聊天、游戏、资讯阅读、学习/工作事务。");
      } else if (q.groupNote) {
        noteParts.push(q.groupNote);
      }

      var spec = {
        code: q.key,
        title: q.title,
        items: bucket.items,
        total: s.total,
        note: noteParts.join(" "),
        tone: item.tone
      };
      if (item.kind === "donut") window.Charts.donut(mount, spec);
      else window.Charts.bar(mount, spec);
    });
  }

  /* ---------- 问卷：原始数据表 ---------- */
  function surveyTable() {
    var mount = $("[data-survey-table]");
    if (!mount || !window.SURVEY) return;
    var rows = window.SURVEY.rows;

    var table = make("table");
    var thead = make("thead");
    var hr = make("tr");
    ["编号", "身份", "入睡时间", "睡眠拖延", "屏幕时长", "最常设备", "最容易停不下来", "用过工具", "最在意的功能", "接受的提醒", "数据接受度"].forEach(function (h) {
      hr.appendChild(make("th", "", h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = make("tbody");
    rows.forEach(function (r) {
      var tr = make("tr");
      tr.appendChild(make("td", "id", String(r.id).padStart(2, "0")));
      tr.appendChild(make("td", "", r.role));
      tr.appendChild(make("td", "", r.sleepTime));
      tr.appendChild(make("td", "", r.procrastination));
      tr.appendChild(make("td", "", r.screenTime));
      tr.appendChild(make("td", "", (r.devices || []).join("、")));
      tr.appendChild(make("td", "", (r.contents || []).join("、")));
      var tool = make("td", "", r.usedTool);
      if (r.tool) tool.appendChild(make("span", "muted", "（" + r.tool + "）"));
      tr.appendChild(tool);
      tr.appendChild(make("td", "", r.feature));
      tr.appendChild(make("td", "", r.reminder));
      tr.appendChild(make("td", "", r.privacy));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    mount.appendChild(table);
  }

  /* ---------- 洞察 ---------- */
  function insights(mountSel, limit) {
    var mount = $(mountSel || "[data-insights]");
    if (!mount || !window.INSIGHT_CARDS) return;
    var cards = window.INSIGHT_CARDS(window.Aggregate.helper(stats()));
    (limit ? cards.slice(0, limit) : cards).forEach(function (card) {
      var art = make("article", "insight reveal");
      art.setAttribute("data-no", card.no);
      art.appendChild(make("h3", "", card.title));
      art.appendChild(make("p", "lead", card.lead));

      if (card.evidence && card.evidence.length) {
        var ul = make("ul", "evidence");
        card.evidence.forEach(function (e) { ul.appendChild(make("li", "", e)); });
        art.appendChild(ul);
      }

      (card.quotes || []).forEach(function (q) {
        var bq = make("blockquote", "quote");
        bq.appendChild(document.createTextNode("“" + q.text + "”"));
        bq.appendChild(make("cite", "", "— " + q.who));
        art.appendChild(bq);
      });

      if (card.implication) {
        var imp = make("p", "implication");
        var label = make("b", "", "设计含义：");
        imp.appendChild(label);
        imp.appendChild(document.createTextNode(card.implication));
        art.appendChild(imp);
      }
      mount.appendChild(art);
    });
  }

  /* ---------- 图片墙 ---------- */
  function galleryButton(img, list, index) {
    var btn = make("button", "gallery-item");
    btn.type = "button";
    if (/\.svg$/i.test(img.file)) btn.classList.add("gallery-item--art");
    btn.setAttribute("data-lightbox", String(list.indexOf(img)));
    btn.setAttribute("aria-label", "放大查看：" + (img.caption || img.alt));

    var pic = document.createElement("img");
    pic.src = img.file;
    pic.alt = img.alt || "";
    pic.loading = "lazy";
    pic.decoding = "async";
    pic.addEventListener("error", function () {
      var fb = make("div", "img-fallback", "图片未找到：" + img.file);
      if (pic.parentNode) pic.parentNode.replaceChild(fb, pic);
    });
    btn.appendChild(pic);

    var cap = make("span", "cap");
    if (img.tag) cap.appendChild(make("span", "tag", img.tag));
    cap.appendChild(document.createTextNode(img.caption || img.alt));
    btn.appendChild(cap);
    btn.addEventListener("click", function () { openLightbox(list, index); });
    return btn;
  }

  function gallery() {
    var mount = $("[data-gallery]");
    if (!mount) return;
    var list = window.IMAGES || [];
    var empty = $("[data-gallery-empty]");
    if (empty) empty.hidden = list.length > 0;
    list.forEach(function (img, i) { mount.appendChild(galleryButton(img, list, i)); });
    window.__gallery = list;
  }

  /* ---------- 团队 ---------- */
  function members() {
    var mount = $("[data-members]");
    if (!mount || !window.META) return;
    window.META.members.forEach(function (m) {
      var box = make("div", "member");
      var avatar = make("div", "iv-avatar", initials(m.name));
      avatar.setAttribute("aria-hidden", "true");
      box.appendChild(avatar);
      var info = make("div");
      info.appendChild(make("h3", "", m.name));
      var pills = make("div", "pill-row");
      m.roles.forEach(function (r) { pills.appendChild(make("span", "tag", r)); });
      info.appendChild(pills);
      info.appendChild(make("p", "", m.focus));
      box.appendChild(info);
      mount.appendChild(box);
    });
  }

  /* ---------- 灯箱 ---------- */
  var lbIndex = 0;
  var lbList = [];

  function openLightbox(list, index) {
    var dlg = $("#lightbox");
    if (!dlg || !dlg.showModal) return;
    lbList = list;
    lbIndex = index;
    paintLightbox();
    dlg.showModal();
    lastFocus = document.activeElement;
    var closeBtn = $("#lb-close");
    if (closeBtn) closeBtn.focus();
  }

  var lastFocus = null;

  function paintLightbox() {
    var dlg = $("#lightbox");
    if (!dlg) return;
    var img = lbList[lbIndex];
    var pic = $("#lb-img");
    var cap = $("#lb-cap");
    var count = $("#lb-count");
    if (pic) {
      pic.src = img.file;
      pic.alt = img.alt || "";
    }
    if (cap) cap.textContent = img.caption || img.alt;
    if (count) count.textContent = lbIndex + 1 + " / " + lbList.length;
  }

  function stepLightbox(delta) {
    if (!lbList.length) return;
    lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
    paintLightbox();
  }

  function bindLightbox() {
    var dlg = $("#lightbox");
    if (!dlg) return;
    var closeBtn = $("#lb-close");
    var prev = $("#lb-prev");
    var next = $("#lb-next");
    if (closeBtn) closeBtn.addEventListener("click", function () { dlg.close(); });
    if (prev) prev.addEventListener("click", function () { stepLightbox(-1); });
    if (next) next.addEventListener("click", function () { stepLightbox(1); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stepLightbox(1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stepLightbox(-1); e.preventDefault(); }
    });
    dlg.addEventListener("close", function () {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
  }

  window.Render = {
    home: home,
    interviewList: interviewList,
    interviewDetail: interviewDetail,
    surveyDesign: surveyDesign,
    surveyCharts: surveyCharts,
    surveyTable: surveyTable,
    insights: insights,
    gallery: gallery,
    members: members,
    bindLightbox: bindLightbox,
    openLightbox: openLightbox,
    stats: stats
  };
})();
