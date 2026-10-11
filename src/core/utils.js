/**
 * توابع کمکی عمومی: قالب‌بندی اعداد و تاریخ، امن‌سازی HTML، دانلود فایل
 */
(function (App) {
  'use strict';

  var numFmt = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
  var intFmt = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

  var utils = {
    uid: function () {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    clone: function (o) {
      return JSON.parse(JSON.stringify(o));
    },

    num: function (n) {
      if (n === '' || n == null || isNaN(n)) return '—';
      return numFmt.format(n);
    },

    int: function (n) {
      if (n == null || isNaN(n)) return '—';
      return intFmt.format(n);
    },

    /** عدد با علامت +/− (برای سود و زیان) — داخل LRI/PDI تا در متن راست‌به‌چپ جابه‌جا نشود */
    signed: function (n) {
      if (n == null || isNaN(n)) return '—';
      var s = numFmt.format(Math.abs(n));
      if (n > 0) s = '+' + s;
      else if (n < 0) s = '−' + s;
      return '⁦' + s + '⁩';
    },

    money: function (n) {
      if (n == null || isNaN(n)) return '—';
      var cur = (App.store && App.store.settings().currency) || '$';
      return '⁦' + utils.signed(n) + ' ' + cur + '⁩';
    },

    /** مبلغ بدون علامت + (برای موجودی و مبلغ اولیه) */
    amount: function (n) {
      if (n == null || isNaN(n)) return '—';
      var cur = (App.store && App.store.settings().currency) || '$';
      return '⁦' + (n < 0 ? '−' : '') + numFmt.format(Math.abs(n)) + ' ' + cur + '⁩';
    },

    pct: function (n) {
      if (n == null || isNaN(n)) return '—';
      return intFmt.format(Math.round(n)) + '٪';
    },

    /** فرمت فشرده برای محور نمودار */
    compact: function (n) {
      var a = Math.abs(n);
      if (a >= 1e6) return utils.num(+(n / 1e6).toFixed(1)) + 'M';
      if (a >= 1e3) return utils.num(+(n / 1e3).toFixed(1)) + 'K';
      return utils.num(Math.round(n));
    },

    toDate: function (v) {
      return v instanceof Date ? v : new Date(v);
    },

    /** تاریخ شمسی */
    date: function (v) {
      if (!v) return '—';
      return utils.toDate(v).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },

    dateTime: function (v) {
      if (!v) return '—';
      var d = utils.toDate(v);
      return d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
        ' · ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    },

    shortDate: function (v) {
      return utils.toDate(v).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    },

    /** مقدار مناسب input[type=datetime-local] */
    toLocalInput: function (v) {
      var d = v ? utils.toDate(v) : new Date();
      var p = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    },

    toDateInput: function (v) {
      return utils.toLocalInput(v).slice(0, 10);
    },

    duration: function (min) {
      if (min == null || min === '' || isNaN(min)) return '—';
      min = Math.round(+min);
      var d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
      var parts = [];
      if (d) parts.push(utils.int(d) + ' روز');
      if (h) parts.push(utils.int(h) + ' ساعت');
      if (m || !parts.length) parts.push(utils.int(m) + ' دقیقه');
      return parts.join(' و ');
    },

    debounce: function (fn, ms) {
      var t;
      return function () {
        var args = arguments, self = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
      };
    },

    download: function (filename, content, mime) {
      var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },

    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  };

  App.utils = utils;
})(window.App = window.App || {});
