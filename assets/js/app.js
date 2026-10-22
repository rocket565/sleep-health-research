/* ============================================================
 * 交互行为：导航、滚动动效、Tab、灯箱、回到顶部
 * ------------------------------------------------------------
 * 按 <body data-page="..."> 决定初始化哪些模块。
 * 没有 JS 时页面骨架和文字仍在，只是数据区为空（见各页 noscript）。
 * ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---------- 顶部导航 ---------- */
  function header() {
    var el = $(".site-header");
    if (!el) return;
    var onScroll = function () {
      el.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 滚动出现 ---------- */
  function reveal() {
    var nodes = $$(".reveal");
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (n) { io.observe(n); });

    /* 已经在视口内的（首屏）立即显示，避免闪烁 */
    requestAnimationFrame(function () {
      nodes.forEach(function (n) {
        var rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) n.classList.add("is-in");
      });
    });
  }

  /* ---------- Tab ---------- */
  function tabs() {
    var list = $('[role="tablist"]');
    if (!list) return;
    var tabEls = $$('[role="tab"]', list);
    if (!tabEls.length) return;

    function panelOf(tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    }

    function select(tab, focus) {
      tabEls.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = panelOf(t);
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      var id = tab.id.replace(/^tab-/, "");
      if (id && history.replaceState) history.replaceState(null, "", "#" + id);
    }

    tabEls.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabEls[(i + 1) % tabEls.length];
        if (e.key === "ArrowLeft") next = tabEls[(i - 1 + tabEls.length) % tabEls.length];
        if (e.key === "Home") next = tabEls[0];
        if (e.key === "End") next = tabEls[tabEls.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    /* 支持 survey.html#charts 这类深链 */
    var hash = (location.hash || "").replace("#", "");
    var preset = tabEls.filter(function (t) { return t.id === "tab-" + hash; })[0];
    select(preset || tabEls[0], false);
  }

  /* ---------- 目录高亮 ---------- */
  function scrollSpy() {
    var links = $$(".toc a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").replace("#", "");
      var target = document.getElementById(id);
      if (target) map[id] = a;
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- 回到顶部 ---------- */
  function backTop() {
    var btn = document.createElement("button");
    btn.className = "back-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "回到顶部");
    btn.textContent = "↑";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    document.body.appendChild(btn);
    var onScroll = function () {
      btn.classList.toggle("is-on", window.scrollY > 640);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 明暗主题 ---------- */
  function theme() {
    var root = document.documentElement;
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    function paint() {
      var light = root.getAttribute("data-theme") === "light";
      btn.textContent = light ? "☾" : "☀";
      btn.setAttribute("aria-pressed", light ? "true" : "false");
      var label = light ? "切换到夜间主题" : "切换到日间主题";
      btn.setAttribute("aria-label", label);
      btn.title = label;
    }

    btn.addEventListener("click", function () {
      var light = root.getAttribute("data-theme") === "light";
      if (light) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "light");
      try {
        localStorage.setItem("theme", light ? "dark" : "light");
      } catch (e) {
        /* 隐私模式下写不进去也不影响本次切换 */
      }
      paint();
    });

    paint();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    var page = document.body.getAttribute("data-page");
    var R = window.Render;

    if (R) {
      if (page === "home") {
        R.home();
        if ($("[data-insights]")) R.insights("[data-insights]", 3);
      }
      if (page === "interviews") R.interviewList();
      if (page === "interview") R.interviewDetail();
      if (page === "survey") {
        R.surveyDesign();
        R.surveyCharts();
        R.surveyTable();
        if ($("[data-insights]")) R.insights("[data-insights]");
      }
      if (page === "gallery") {
        R.gallery();
        R.bindLightbox();
      }
      if (page === "about") R.members();
      if (page === "analysis") R.analysis();
      if (page === "project" && $("[data-insights]")) R.insights("[data-insights]");
    }

    if (page === "survey" || page === "analysis") tabs();
    if (page === "interview") {
      scrollSpy();
      if (window.Render) window.Render.bindLightbox();
    }
    if (page === "gallery") scrollSpy();

    header();
    theme();
    reveal();
    backTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
