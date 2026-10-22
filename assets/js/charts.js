/* ============================================================
 * 图表渲染（零依赖）
 * ------------------------------------------------------------
 * 条形图用 CSS（响应式最好，窄屏也不会糊），环形图用内联 SVG。
 * 不引任何图表库：离线可用、部署到哪都不会挂。
 *
 * 用法：
 *   Charts.bar(mountEl, {code:"Q2", title:"平均入睡时间", items:[...], total:12})
 *   Charts.donut(mountEl, {code:"Q1", title:"身份", items:[...], total:12})
 * items: [{label, value, pct}]
 * ============================================================ */
(function () {
  "use strict";

  var PALETTE = ["#8ab4ff", "#b79bff", "#6fe3d0", "#ffc978", "#ff9db4", "#9ecbff", "#c9b3ff", "#7fd6b1"];

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function describe(title, items) {
    return (
      title +
      "：" +
      items
        .map(function (it) {
          return it.label + " " + it.value + " 人（" + it.pct + "%）";
        })
        .join("；")
    );
  }

  function bar(mount, spec) {
    var fig = make("figure", "chart-card reveal");
    if (spec.code) fig.id = "chart-" + spec.code.toLowerCase();

    var cap = make("figcaption");
    cap.appendChild(make("span", "q-code", spec.code || ""));
    cap.appendChild(make("span", "", spec.title));
    cap.appendChild(make("span", "n", "n = " + spec.total));
    fig.appendChild(cap);

    var items = spec.items || [];
    var max = items.reduce(function (m, it) { return Math.max(m, it.value); }, 0) || 1;
    var bars = make("div", "bars");
    bars.setAttribute("role", "img");
    bars.setAttribute("aria-label", describe(spec.title, items));

    items.forEach(function (it) {
      var row = make("div", "bar-row");

      var label = make("span", "bar-label", it.label);
      var track = make("div", "bar-track");
      var fill = make("div", "bar-fill");
      var width = it.value > 0 ? Math.max((it.value / max) * 100, 3) : 0;
      fill.style.setProperty("--w", width.toFixed(1) + "%");
      if (spec.tone === "amber") fill.classList.add("bar-fill--amber");
      if (spec.tone === "teal") fill.classList.add("bar-fill--teal");
      track.appendChild(fill);

      var value = make("span", "bar-value");
      value.appendChild(make("b", "", String(it.value)));
      value.appendChild(make("small", "", it.pct + "%"));
      value.title = it.label + "：" + it.value + " 人（" + it.pct + "%）";

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      bars.appendChild(row);
    });

    fig.appendChild(bars);
    if (spec.note) fig.appendChild(make("p", "chart-note", spec.note));
    mount.appendChild(fig);
    return fig;
  }

  function donut(mount, spec) {
    var fig = make("figure", "chart-card reveal");
    if (spec.code) fig.id = "chart-" + spec.code.toLowerCase();

    var cap = make("figcaption");
    cap.appendChild(make("span", "q-code", spec.code || ""));
    cap.appendChild(make("span", "", spec.title));
    cap.appendChild(make("span", "n", "n = " + spec.total));
    fig.appendChild(cap);

    var items = spec.items || [];
    var total = spec.total || items.reduce(function (s, it) { return s + it.value; }, 0) || 1;

    var wrap = make("div", "donut-wrap");
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "donut");
    svg.setAttribute("viewBox", "0 0 132 132");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", describe(spec.title, items));

    var bg = document.createElementNS(svgNS, "circle");
    bg.setAttribute("cx", "66");
    bg.setAttribute("cy", "66");
    bg.setAttribute("r", "52");
    bg.setAttribute("stroke", "rgba(255,255,255,0.07)");
    svg.appendChild(bg);

    var circumference = 2 * Math.PI * 52;
    var offset = 0;
    items.forEach(function (it, i) {
      var seg = document.createElementNS(svgNS, "circle");
      seg.setAttribute("cx", "66");
      seg.setAttribute("cy", "66");
      seg.setAttribute("r", "52");
      seg.setAttribute("stroke", PALETTE[i % PALETTE.length]);
      seg.setAttribute("transform", "rotate(-90 66 66)");
      var len = (it.value / total) * circumference;
      var gap = len > 6 ? 2.5 : 0;
      seg.setAttribute("stroke-dasharray", Math.max(len - gap, 0) + " " + circumference);
      seg.setAttribute("stroke-dashoffset", String(-offset));
      seg.setAttribute("fill", "none");
      svg.appendChild(seg);
      offset += len;
    });

    var centerValue = document.createElementNS(svgNS, "text");
    centerValue.setAttribute("x", "66");
    centerValue.setAttribute("y", "70");
    centerValue.setAttribute("text-anchor", "middle");
    centerValue.setAttribute("fill", "currentColor");
    centerValue.setAttribute("font-size", "22");
    centerValue.setAttribute("font-weight", "650");
    centerValue.textContent = String(total);
    svg.appendChild(centerValue);

    var legend = make("ul", "legend");
    items.forEach(function (it, i) {
      var li = make("li");
      var sw = make("span", "swatch");
      sw.style.background = PALETTE[i % PALETTE.length];
      li.appendChild(sw);
      li.appendChild(make("span", "", it.label));
      li.appendChild(make("b", "", it.value + " 人 · " + it.pct + "%"));
      legend.appendChild(li);
    });

    wrap.appendChild(svg);
    wrap.appendChild(legend);
    fig.appendChild(wrap);
    if (spec.note) fig.appendChild(make("p", "chart-note", spec.note));
    mount.appendChild(fig);
    return fig;
  }

  window.Charts = { bar: bar, donut: donut, palette: PALETTE };
})();
