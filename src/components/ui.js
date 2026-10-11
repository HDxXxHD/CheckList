/**
 * قطعات رابط کاربری مشترک بین صفحات
 */
(function (App) {
  'use strict';

  var u = App.utils;

  // ثبت صفحات در App.pages انجام می‌شود (فایل‌های src/pages)
  App.pages = App.pages || {};

  App.ui = {
    statusBadge: function (t) {
      if (t.status !== 'closed') return '<span class="badge badge-brand">' + App.icon('clock') + 'باز</span>';
      var r = t.post && t.post.result;
      if (r === 'win') return '<span class="badge badge-success">سود</span>';
      if (r === 'loss') return '<span class="badge badge-error">زیان</span>';
      return '<span class="badge badge-gray">سر به سر</span>';
    },

    directionBadge: function (dir) {
      if (dir === 'buy') return '<span class="dir dir-buy">' + App.icon('trendUp') + 'خرید</span>';
      if (dir === 'sell') return '<span class="dir dir-sell">' + App.icon('trendDown') + 'فروش</span>';
      return '—';
    },

    pnlCell: function (t) {
      if (!App.stats.isClosed(t)) return '<span class="text-muted">—</span>';
      var v = App.stats.pnl(t);
      return '<span class="num ' + (v > 0 ? 'text-success' : v < 0 ? 'text-error' : 'text-muted') + '">' + u.money(v) + '</span>';
    },

    scorePill: function (v) {
      if (v == null) return '<span class="text-muted">—</span>';
      var tone = v >= 85 ? 'success' : v >= 60 ? 'warning' : 'error';
      return '<span class="score score-' + tone + '">' + u.pct(v) + '</span>';
    },

    kpi: function (o) {
      return '<div class="card kpi">' +
        '<div class="kpi-icon tone-' + (o.tone || 'brand') + '">' + App.icon(o.icon) + '</div>' +
        '<div class="kpi-body"><span class="kpi-label">' + u.esc(o.label) + '</span>' +
        '<b class="kpi-value ' + (o.valueClass || '') + '">' + o.value + '</b>' +
        (o.sub ? '<span class="kpi-sub">' + o.sub + '</span>' : '') + '</div></div>';
    },

    empty: function (o) {
      return '<div class="empty"><div class="empty-icon">' + App.icon(o.icon || 'clipboard') + '</div>' +
        '<h3>' + u.esc(o.title) + '</h3><p>' + u.esc(o.text || '') + '</p>' +
        (o.actions ? '<div class="empty-actions">' + o.actions + '</div>' : '') + '</div>';
    },

    tradeActions: function (t) {
      return '<div class="row-actions">' +
        '<a class="icon-btn sm" href="#/trade/' + t.id + '" title="مشاهده">' + App.icon('eye') + '</a>' +
        (t.status !== 'closed' ? '<a class="icon-btn sm tone-brand" href="#/close/' + t.id + '" title="بستن معامله (بعد از خروج)">' + App.icon('lock') + '</a>' : '') +
        '<a class="icon-btn sm" href="#/edit/' + t.id + '" title="ویرایش">' + App.icon('edit') + '</a>' +
        '<button class="icon-btn sm tone-error" type="button" data-delete="' + t.id + '" title="حذف">' + App.icon('trash') + '</button>' +
        '</div>';
    },

    /** حذف معامله با تأیید */
    confirmDelete: function (id, after) {
      var t = App.store.get(id);
      if (!t) return;
      App.modal.confirm({
        title: 'حذف معامله',
        message: 'معامله ' + (t.pre.symbol || '') + ' مورخ ' + u.date(t.pre.openedAt) + ' به‌طور کامل حذف شود؟ این عمل قابل بازگشت نیست.',
        okText: 'حذف شود',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        App.store.remove(id);
        App.toast.show('معامله حذف شد');
        if (after) after();
      });
    }
  };
})(window.App = window.App || {});
