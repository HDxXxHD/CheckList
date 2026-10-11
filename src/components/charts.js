/**
 * نمودارهای سبک SVG/HTML بدون کتابخانه خارجی
 * - line   : منحنی تجمعی سود/زیان
 * - donut  : نمودار حلقه‌ای
 * - bars   : میله‌های افقی (درصد)
 * - diverging : میله‌های مثبت/منفی (سود و زیان)
 */
(function (App) {
  'use strict';

  var u = App.utils;

  function empty(msg) {
    return '<div class="chart-empty">' + App.icon('chart') + '<span>' + u.esc(msg || 'داده‌ای برای نمایش وجود ندارد') + '</span></div>';
  }

  App.charts = {
    empty: empty,

    line: function (points, opts) {
      opts = opts || {};
      if (!points || points.length < 2) return empty('برای رسم نمودار حداقل ۲ معامله بسته‌شده لازم است');

      var W = 640, H = opts.height || 260, pl = 54, pr = 14, pt = 16, pb = 30;
      var vals = points.map(function (p) { return p.value; });
      var min = Math.min.apply(null, vals.concat(0));
      var max = Math.max.apply(null, vals.concat(0));
      if (min === max) max = min + 1;
      var pad = (max - min) * 0.1;
      min -= pad; max += pad;

      var x = function (i) { return pl + (i / (points.length - 1)) * (W - pl - pr); };
      var y = function (v) { return pt + ((max - v) / (max - min)) * (H - pt - pb); };

      var line = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1); }).join(' ');
      var area = line + ' L' + x(points.length - 1).toFixed(1) + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z';
      var last = points[points.length - 1].value;
      var tone = last >= 0 ? 'var(--brand-500)' : 'var(--error-500)';

      var grid = '';
      for (var i = 0; i <= 4; i++) {
        var v = min + ((max - min) * i) / 4;
        var gy = y(v);
        grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" class="chart-grid"/>' +
          '<text x="' + (pl - 8) + '" y="' + (gy + 4) + '" class="chart-label" text-anchor="end">' + u.compact(v) + '</text>';
      }
      var zero = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '" class="chart-zero"/>';

      var idx = [0, Math.floor((points.length - 1) / 2), points.length - 1];
      var xl = idx.map(function (i, k) {
        var anchor = k === 0 ? 'start' : k === 2 ? 'end' : 'middle';
        return '<text x="' + x(i) + '" y="' + (H - 8) + '" class="chart-label" text-anchor="' + anchor + '">' + u.shortDate(points[i].date) + '</text>';
      }).join('');

      var dots = points.map(function (p, i) {
        return '<circle cx="' + x(i) + '" cy="' + y(p.value) + '" r="9" class="chart-hit"><title>' +
          u.date(p.date) + ' — ' + u.money(p.value) + '</title></circle>';
      }).join('');

      var gid = 'g' + Math.random().toString(36).slice(2, 7);
      return '<div class="chart-line"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="نمودار سود و زیان تجمعی">' +
        '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + tone + '" stop-opacity=".28"/><stop offset="100%" stop-color="' + tone + '" stop-opacity="0"/></linearGradient></defs>' +
        grid + zero +
        '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
        '<path d="' + line + '" fill="none" stroke="' + tone + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
        '<circle cx="' + x(points.length - 1) + '" cy="' + y(last) + '" r="4.5" fill="' + tone + '" stroke="var(--surface)" stroke-width="2"/>' +
        xl + dots + '</svg></div>';
    },

    donut: function (parts, opts) {
      opts = opts || {};
      var total = parts.reduce(function (s, p) { return s + p.value; }, 0);
      if (!total) return empty();
      var r = 54, C = 2 * Math.PI * r, off = 0;
      var segs = parts.filter(function (p) { return p.value > 0; }).map(function (p) {
        var len = (p.value / total) * C;
        var s = '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + p.color + '" stroke-width="16" stroke-dasharray="' +
          Math.max(len - 2, 0.1) + ' ' + (C - Math.max(len - 2, 0.1)) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"><title>' +
          u.esc(p.label) + ': ' + u.int(p.value) + '</title></circle>';
        off += len;
        return s;
      }).join('');

      var legend = parts.map(function (p) {
        return '<li><span class="dot" style="background:' + p.color + '"></span><span class="legend-label">' + u.esc(p.label) +
          '</span><b>' + u.int(p.value) + '</b><small>' + u.pct((p.value / total) * 100) + '</small></li>';
      }).join('');

      return '<div class="chart-donut"><div class="donut-wrap"><svg viewBox="0 0 140 140" role="img" aria-label="' + u.esc(opts.label || 'نمودار حلقه‌ای') + '">' +
        '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="var(--border-soft)" stroke-width="16"/>' + segs + '</svg>' +
        '<div class="donut-center"><b>' + (opts.center != null ? opts.center : u.int(total)) + '</b><small>' + u.esc(opts.centerLabel || 'مجموع') + '</small></div></div>' +
        '<ul class="chart-legend">' + legend + '</ul></div>';
    },

    /** میله‌های افقی درصدی */
    bars: function (rows, opts) {
      opts = opts || {};
      if (!rows.length) return empty();
      return '<div class="bar-list">' + rows.map(function (r) {
        var w = r.value == null ? 0 : Math.max(0, Math.min(100, r.value));
        return '<div class="bar-row">' +
          '<div class="bar-head"><span class="bar-label">' + u.esc(r.label) + '</span><span class="bar-value">' + (r.display || u.pct(r.value)) + '</span></div>' +
          '<div class="bar-track"><span class="bar-fill tone-' + (r.tone || opts.tone || 'brand') + '" style="width:' + w + '%"></span></div>' +
          '</div>';
      }).join('') + '</div>';
    },

    /** میله‌های واگرا برای مقادیر مثبت و منفی */
    diverging: function (rows) {
      if (!rows.length) return empty();
      var maxAbs = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.value); }).concat(1));
      return '<div class="div-list">' + rows.map(function (r) {
        var w = (Math.abs(r.value) / maxAbs) * 50;
        var pos = r.value >= 0;
        return '<div class="div-row"><span class="div-label">' + u.esc(r.label) + '</span>' +
          '<div class="div-track"><span class="div-axis"></span><span class="div-fill ' + (pos ? 'is-pos' : 'is-neg') + '" style="width:' + w + '%"></span></div>' +
          '<span class="div-value ' + (pos ? 'text-success' : 'text-error') + '">' + u.money(r.value) + '</span></div>';
      }).join('') + '</div>';
    },

    /** حلقه پیشرفت کوچک */
    ring: function (value, opts) {
      opts = opts || {};
      var v = value == null ? 0 : Math.max(0, Math.min(100, value));
      var r = 26, C = 2 * Math.PI * r;
      var tone = opts.tone || (v >= 85 ? 'success' : v >= 60 ? 'warning' : 'error');
      return '<div class="ring ring-' + tone + '" style="--size:' + (opts.size || 72) + 'px">' +
        '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + r + '" class="ring-bg"/>' +
        (v > 0 ? '<circle cx="32" cy="32" r="' + r + '" class="ring-fg" stroke-dasharray="' + (C * v) / 100 + ' ' + C + '" transform="rotate(-90 32 32)"/>' : '') + '</svg>' +
        '<span>' + (value == null ? '—' : u.pct(v)) + '</span></div>';
    }
  };
})(window.App = window.App || {});
