/* ============================================================
 * 统计聚合（无 DOM 依赖，浏览器和 Node 都能跑）
 * ------------------------------------------------------------
 * 所有图表、百分比、洞察里的数字都从这里算出来，
 * 这样新增一份问卷时不会出现"表格改了、图没改"的问题。
 * ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Aggregate = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function pctOf(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  function orderedLabels(question, counts) {
    var labels = (question.options || []).slice();
    counts.forEach(function (_v, k) {
      if (labels.indexOf(k) === -1) labels.push(k);
    });
    return labels;
  }

  function build(rows, questions, groupMap) {
    var total = rows.length;
    var byKey = {};

    questions.forEach(function (q) {
      var counts = new Map();
      rows.forEach(function (row) {
        var raw = row[q.field];
        if (q.type === "multi") {
          // 同一份问卷里重复提到的选项只算一次（按人数统计）
          var seen = new Set(Array.isArray(raw) ? raw : raw ? [raw] : []);
          seen.forEach(function (v) {
            counts.set(v, (counts.get(v) || 0) + 1);
          });
        } else {
          var v = raw == null ? "（未填）" : String(raw);
          counts.set(v, (counts.get(v) || 0) + 1);
        }
      });

      var labels = orderedLabels(q, counts);
      var items = labels.map(function (label) {
        var value = counts.get(label) || 0;
        return { label: label, value: value, pct: pctOf(value, total) };
      });

      byKey[q.key] = {
        key: q.key,
        title: q.title,
        type: q.type,
        ordered: !!q.ordered,
        total: total,
        items: items,
        mentions: items.reduce(function (sum, it) { return sum + it.value; }, 0)
      };
    });

    var groups = {};
    if (groupMap) {
      Object.keys(groupMap).forEach(function (key) {
        var q = questions.filter(function (x) { return x.key === key; })[0];
        if (!q) return;
        groups[key] = {
          key: key,
          total: total,
          items: groupMap[key].map(function (g) {
            var value = rows.filter(function (row) {
              var list = Array.isArray(row[q.field]) ? row[q.field] : [];
              return list.some(function (v) { return g.members.indexOf(v) !== -1; });
            }).length;
            return { label: g.label, value: value, pct: pctOf(value, total) };
          })
        };
      });
    }

    /* 派生指标 */
    var q2 = byKey.Q2 ? byKey.Q2.items : [];
    var zeroStart = q2.findIndex(function (it) { return /^00:0/.test(it.label); });
    var afterMidnight = zeroStart === -1 ? 0 : q2.slice(zeroStart).reduce(function (s, it) { return s + it.value; }, 0);

    return {
      total: total,
      byKey: byKey,
      groups: groups,
      derived: { afterMidnight: afterMidnight }
    };
  }

  /* 给文案用的取值助手 */
  function helper(stats) {
    function item(key, label) {
      var bucket = stats.byKey[key];
      var found = bucket && bucket.items.filter(function (i) { return i.label === label; })[0];
      return found || { label: label, value: 0, pct: 0 };
    }
    function group(key, label) {
      var bucket = stats.groups[key];
      var found = bucket && bucket.items.filter(function (i) { return i.label === label; })[0];
      return found || { label: label, value: 0, pct: 0 };
    }
    return {
      item: item,
      group: group,
      count: function (key, label) { return item(key, label).value; },
      pct: function (key, label) { return item(key, label).pct + "%"; },
      ratio: function (key, label) { return item(key, label).value + "/" + stats.total; },
      groupCount: function (key, label) { return group(key, label).value; },
      groupPct: function (key, label) { return group(key, label).pct + "%"; },
      groupRatio: function (key, label) { return group(key, label).value + "/" + stats.total; },
      afterMidnightRatio: function () { return stats.derived.afterMidnight + "/" + stats.total; }
    };
  }

  var api = { build: build, helper: helper, pctOf: pctOf };
  api.default = api;
  return api;
});
