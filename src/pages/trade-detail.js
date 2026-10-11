/**
 * صفحه جزئیات یک معامله / چک‌لیست
 */
(function (App) {
  'use strict';

  var u = App.utils;

  function sectionCard(phase, section, data) {
    var body;
    var cl = section.fields.find(function (f) { return f.type === 'checklist'; });
    if (cl) {
      var vals = data[cl.key] || [];
      var score = (vals.length / cl.items.length) * 100;
      body = '<div class="detail-score">' + App.charts.ring(score, { size: 64 }) + '<span>' + u.int(vals.length) + ' از ' + u.int(cl.items.length) + ' مورد رعایت شده</span></div>' +
        '<ul class="detail-checks">' + cl.items.map(function (it) {
          var on = vals.indexOf(it.k) !== -1;
          return '<li class="' + (on ? 'is-on' : 'is-off') + '">' + App.icon(on ? 'check' : 'x') + '<span>' + u.esc(it.l) + '</span></li>';
        }).join('') + '</ul>';
    } else {
      body = '<dl class="detail-list">' + section.fields.map(function (f) {
        var v = data[f.key];
        var display = App.schema.display(f, v);
        if (f.type === 'choice' && v) {
          var o = App.schema.option(f, v);
          display = '<span class="badge badge-' + ((o && o.tone) || 'gray') + '">' + u.esc(display) + '</span>';
        } else {
          display = '<span class="' + (f.ltr ? 'ltr' : '') + '">' + u.esc(display) + '</span>';
        }
        return '<div class="' + (f.type === 'textarea' ? 'dl-full' : '') + '"><dt>' + u.esc(f.label) + '</dt><dd>' + display + '</dd></div>';
      }).join('') + '</dl>';
    }
    return '<section class="card"><div class="card-header"><div class="card-head-icon">' + App.icon(section.icon) + '</div><div><h3 class="card-title">' + u.esc(section.title) + '</h3>' +
      '<p class="card-sub">' + u.esc(App.schema.phases[phase].title) + '</p></div></div><div class="card-body">' + body + '</div></section>';
  }

  App.pages.tradeDetail = {
    nav: 'trades',
    title: function (params) {
      var t = App.store.get(params.id);
      return t ? 'معامله ' + t.pre.symbol : 'جزئیات معامله';
    },
    crumbs: function (params) {
      return [{ label: 'لیست معاملات', href: '#/trades' }, 'جزئیات'];
    },

    render: function (params) {
      var t = App.store.get(params.id);
      if (!t) return App.pages.notFound.render();
      var S = App.stats, closed = S.isClosed(t);
      var pnl = S.pnl(t);
      var aligned = S.aligned(t);

      var hero = '<div class="card detail-hero">' +
        '<div class="hero-main"><div class="hero-sym ltr">' + u.esc(t.pre.symbol) + '</div>' +
        '<div class="hero-tags">' + App.ui.directionBadge(t.pre.direction) + App.ui.statusBadge(t) + '<span class="tf">' + u.esc(t.pre.timeframe || '') + '</span>' +
        (aligned != null ? '<span class="badge ' + (aligned ? 'badge-success' : 'badge-warning') + '">' + (aligned ? 'هم‌جهت با روند' : 'خلاف روند') + '</span>' : '') + '</div>' +
        '<p class="text-muted">ورود: ' + u.dateTime(t.pre.openedAt) + (closed ? ' · خروج: ' + u.dateTime(t.closedAt) : '') + '</p></div>' +
        '<div class="hero-stats">' +
        '<div><small>سود/زیان خالص</small><b class="' + (pnl > 0 ? 'text-success' : pnl < 0 ? 'text-error' : '') + '">' + (closed ? u.money(pnl) : '—') + '</b></div>' +
        '<div><small>روانی قبل</small>' + App.ui.scorePill(S.psychScore(t, 'pre')) + '</div>' +
        '<div><small>روانی بعد</small>' + App.ui.scorePill(closed ? S.psychScore(t, 'post') : null) + '</div>' +
        '</div>' +
        '<div class="hero-actions no-print">' +
        (closed ? '' : '<a href="#/close/' + t.id + '" class="btn btn-primary">' + App.icon('lock') + 'ثبت چک‌لیست بعد از خروج</a>') +
        '<a href="#/edit/' + t.id + '" class="btn btn-outline">' + App.icon('edit') + 'ویرایش</a>' +
        '<button type="button" class="btn btn-outline" data-print>' + App.icon('printer') + 'چاپ</button>' +
        '<button type="button" class="btn btn-outline-danger" data-delete="' + t.id + '">' + App.icon('trash') + 'حذف</button>' +
        '</div></div>';

      var pre = App.schema.sections('pre').map(function (s) { return sectionCard('pre', s, t.pre); }).join('');
      var post = closed
        ? App.schema.sections('post').map(function (s) { return sectionCard('post', s, t.post); }).join('')
        : '<div class="card">' + App.ui.empty({
          icon: 'clock', title: 'معامله هنوز باز است',
          text: 'پس از خروج از معامله، چک‌لیست «بعد از خروج» را تکمیل کنید.',
          actions: '<a href="#/close/' + t.id + '" class="btn btn-primary">' + App.icon('lock') + 'ثبت خروج</a>'
        }) + '</div>';

      return hero +
        '<div class="grid grid-2 detail-grid">' +
        '<div class="stack"><h2 class="phase-title"><span class="phase-dot pre"></span>قبل از ورود به معامله</h2>' + pre + '</div>' +
        '<div class="stack"><h2 class="phase-title"><span class="phase-dot post"></span>بعد از خروج از معامله</h2>' + post + '</div>' +
        '</div>';
    },

    mount: function (el) {
      el.addEventListener('click', function (e) {
        var del = e.target.closest('[data-delete]');
        if (del) App.ui.confirmDelete(del.dataset.delete, function () { App.router.go('/trades'); });
        if (e.target.closest('[data-print]')) window.print();
      });
    }
  };
})(window.App = window.App || {});
