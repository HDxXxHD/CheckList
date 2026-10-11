/**
 * صفحه لیست معاملات با جستجو و فیلتر
 */
(function (App) {
  'use strict';

  var u = App.utils;
  var EMPTY = { q: '', account: '', status: '', result: '', direction: '', symbol: '' };
  var filters = Object.assign({}, EMPTY);

  function rows(list) {
    if (!list.length) {
      return '<tr><td colspan="9">' + App.ui.empty({ icon: 'search', title: 'معامله‌ای یافت نشد', text: 'فیلترها را تغییر دهید یا چک‌لیست جدیدی ثبت کنید.' }) + '</td></tr>';
    }
    return list.map(function (t) {
      return '<tr>' +
        '<td><a class="sym" href="#/trade/' + t.id + '">' + u.esc(t.pre.symbol) + '</a></td>' +
        '<td class="nowrap">' + u.dateTime(t.pre.openedAt) + '</td>' +
        '<td>' + App.ui.directionBadge(t.pre.direction) + '</td>' +
        '<td class="hide-md"><span class="tf">' + u.esc(t.pre.timeframe || '—') + '</span></td>' +
        '<td>' + App.ui.statusBadge(t) + '</td>' +
        '<td>' + App.ui.pnlCell(t) + '</td>' +
        '<td class="hide-md">' + App.ui.scorePill(App.stats.psychScore(t, 'pre')) + '</td>' +
        '<td class="hide-md">' + App.ui.scorePill(t.post ? App.stats.psychScore(t, 'post') : null) + '</td>' +
        '<td>' + App.ui.tradeActions(t) + '</td></tr>';
    }).join('');
  }

  function current() {
    return App.stats.filter(App.store.all(), filters);
  }

  function select(name, label, opts) {
    return '<select class="input" data-filter="' + name + '" aria-label="' + label + '"><option value="">' + label + '</option>' +
      opts.map(function (o) { return '<option value="' + u.esc(o.v) + '"' + (filters[name] === o.v ? ' selected' : '') + '>' + u.esc(o.l) + '</option>'; }).join('') + '</select>';
  }

  App.pages.trades = {
    nav: 'trades',
    title: function () { return 'لیست معاملات'; },

    render: function () {
      var all = App.store.all();
      var list = current();
      var symbols = App.stats.symbols(all).map(function (s) { return { v: s, l: s }; });

      return '<div class="card">' +
        '<div class="card-header wrap"><div><h3 class="card-title">همه چک‌لیست‌های ثبت‌شده</h3><p class="card-sub" data-count>' + u.int(list.length) + ' مورد از ' + u.int(all.length) + '</p></div>' +
        '<div class="header-tools mr-auto">' +
        '<button type="button" class="btn btn-outline btn-sm" data-export>' + App.icon('download') + 'خروجی Excel</button>' +
        '<a href="#/new" class="btn btn-primary btn-sm">' + App.icon('plus') + 'چک‌لیست جدید</a></div></div>' +
        '<div class="filters">' +
        '<div class="search-box">' + App.icon('search') + '<input class="input" type="search" placeholder="جستجوی نماد یا یادداشت…" data-filter="q" value="' + u.esc(filters.q) + '"/></div>' +
        (App.store.accounts().length ? select('account', 'همه حساب‌ها', App.schema.field('pre', 'account').options) : '') +
        select('symbol', 'همه نمادها', symbols) +
        select('status', 'همه وضعیت‌ها', [{ v: 'open', l: 'باز' }, { v: 'closed', l: 'بسته' }]) +
        select('result', 'همه نتایج', [{ v: 'win', l: 'سود' }, { v: 'loss', l: 'زیان' }, { v: 'be', l: 'سر به سر' }]) +
        select('direction', 'خرید و فروش', [{ v: 'buy', l: 'خرید' }, { v: 'sell', l: 'فروش' }]) +
        '<button type="button" class="btn btn-ghost btn-sm" data-reset>' + App.icon('x') + 'حذف فیلترها</button>' +
        '</div>' +
        '<div class="table-wrap"><table class="table table-hover"><thead><tr>' +
        '<th>نماد</th><th>تاریخ ورود</th><th>جهت</th><th class="hide-md">تایم‌فریم</th><th>وضعیت</th><th>سود/زیان</th>' +
        '<th class="hide-md" title="امتیاز روانشناسی قبل از ورود">روانی قبل</th><th class="hide-md" title="امتیاز روانشناسی بعد از خروج">روانی بعد</th><th>عملیات</th>' +
        '</tr></thead><tbody data-rows>' + rows(list) + '</tbody></table></div></div>';
    },

    mount: function (el) {
      function update() {
        var list = current();
        u.$('[data-rows]', el).innerHTML = rows(list);
        u.$('[data-count]', el).textContent = u.int(list.length) + ' مورد از ' + u.int(App.store.count());
      }
      var onSearch = u.debounce(update, 180);

      el.addEventListener('input', function (e) {
        var f = e.target.dataset.filter;
        if (!f) return;
        filters[f] = e.target.value;
        if (f === 'q') onSearch(); else update();
      });
      el.addEventListener('click', function (e) {
        var del = e.target.closest('[data-delete]');
        if (del) return App.ui.confirmDelete(del.dataset.delete, function () { update(); App.layout.updateBadges(); });
        if (e.target.closest('[data-export]')) {
          var list = current();
          if (!list.length) return App.toast.show('معامله‌ای برای خروجی وجود ندارد', 'warning');
          App.exporter.downloadCSV(list, 'checklist-trades');
          App.toast.show('فایل Excel دانلود شد');
        }
        if (e.target.closest('[data-reset]')) {
          filters = Object.assign({}, EMPTY);
          App.refresh();
        }
      });
    }
  };
})(window.App = window.App || {});
