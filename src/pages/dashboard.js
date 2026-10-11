/**
 * صفحه داشبورد
 */
(function (App) {
  'use strict';

  var u = App.utils;

  function emptyState() {
    return '<div class="card">' + App.ui.empty({
      icon: 'clipboard',
      title: 'هنوز هیچ چک‌لیستی ثبت نشده است',
      text: 'اولین چک‌لیست قبل از ورود به معامله را ثبت کنید یا برای آشنایی با امکانات پنل، داده نمونه بارگذاری کنید.',
      actions: '<a href="#/new" class="btn btn-primary">' + App.icon('plus') + 'ثبت اولین چک‌لیست</a>' +
        '<button type="button" class="btn btn-outline" data-sample>' + App.icon('sparkle') + 'بارگذاری داده نمونه</button>'
    }) + '</div>';
  }

  App.pages.dashboard = {
    nav: 'dashboard',
    title: function () { return 'داشبورد'; },

    render: function () {
      var all = App.store.all();
      if (!all.length) return emptyState();

      var S = App.stats, s = S.summary(all);
      var openTrades = all.filter(function (t) { return t.status !== 'closed'; });
      var last30 = S.filter(all, { from: u.toDateInput(new Date(Date.now() - 30 * 86400000)) });
      var s30 = S.summary(last30);

      var kpis = [
        App.ui.kpi({ icon: 'layers', label: 'کل معاملات', value: u.int(s.total), sub: u.int(s.open) + ' باز · ' + u.int(s.closed) + ' بسته', tone: 'brand' }),
        App.ui.kpi({ icon: 'target', label: 'نرخ برد', value: u.pct(s.winRate), sub: u.int(s.wins) + ' سود · ' + u.int(s.losses) + ' زیان · ' + u.int(s.be) + ' سر به سر', tone: 'success' }),
        App.ui.kpi({
          icon: 'wallet', label: 'سود/زیان خالص', value: u.money(s.net), valueClass: s.net >= 0 ? 'text-success' : 'text-error',
          sub: '۳۰ روز اخیر: <span class="' + (s30.net >= 0 ? 'text-success' : 'text-error') + '">' + u.money(s30.net) + '</span>', tone: 'warning'
        }),
        App.ui.kpi({ icon: 'smile', label: 'انضباط روانی', value: u.pct(s.psychPre), sub: 'قبل از ورود · بعد از خروج: ' + u.pct(s.psychPost), tone: 'purple' })
      ].join('');

      var recent = all.slice(0, 7).map(function (t) {
        return '<tr><td><a class="sym" href="#/trade/' + t.id + '">' + u.esc(t.pre.symbol) + '</a><small class="d-block text-muted">' + u.dateTime(t.pre.openedAt) + '</small></td>' +
          '<td>' + App.ui.directionBadge(t.pre.direction) + '</td>' +
          '<td class="hide-sm"><span class="tf">' + u.esc(t.pre.timeframe || '—') + '</span></td>' +
          '<td>' + App.ui.statusBadge(t) + '</td>' +
          '<td>' + App.ui.pnlCell(t) + '</td></tr>';
      }).join('');

      var openList = openTrades.length ? openTrades.slice(0, 5).map(function (t) {
        return '<li class="open-item"><div><div class="open-head"><b class="sym">' + u.esc(t.pre.symbol) + '</b>' + App.ui.directionBadge(t.pre.direction) + '</div>' +
          '<small class="d-block text-muted">' + u.dateTime(t.pre.openedAt) + '</small></div>' +
          '<a href="#/close/' + t.id + '" class="btn btn-outline btn-sm">' + App.icon('lock') + 'ثبت خروج</a></li>';
      }).join('') : '<li class="open-empty">' + App.icon('check') + 'معامله بازی وجود ندارد</li>';

      var accs = App.store.accounts();
      var accountsCard = accs.length ? '<div class="card"><div class="card-header"><div><h3 class="card-title">موجودی حساب‌ها</h3><p class="card-sub">مبلغ اولیه + سود/زیان خالص</p></div>' +
        '<a href="#/accounts" class="btn btn-ghost btn-sm mr-auto">مدیریت' + App.icon('arrowLeft') + '</a></div>' +
        '<ul class="open-list">' + accs.map(function (a) {
          var st = S.account(a, all);
          return '<li class="open-item"><div><b>' + u.esc(a.name) + '</b><small class="d-block text-muted">' + u.esc(a.broker) + '</small></div>' +
            '<div class="text-end"><b class="num">' + u.amount(st.balance) + '</b>' +
            '<small class="d-block num ' + (st.net > 0 ? 'text-success' : st.net < 0 ? 'text-error' : 'text-muted') + '">' + u.money(st.net) + '</small></div></li>';
        }).join('') + '</ul></div>' : '';

      var psych = App.stats.psychImpact(all, 'pre').map(function (r) {
        return { label: r.label, value: r.compliance, tone: r.compliance >= 85 ? 'success' : r.compliance >= 60 ? 'warning' : 'error' };
      });

      return '<div class="grid kpi-grid">' + kpis + '</div>' +
        '<div class="grid grid-12">' +
        '  <div class="card col-8"><div class="card-header"><div><h3 class="card-title">منحنی سود و زیان تجمعی</h3><p class="card-sub">بر اساس تاریخ بسته شدن معاملات</p></div>' +
        '    <a href="#/reports" class="btn btn-ghost btn-sm mr-auto">گزارش کامل' + App.icon('arrowLeft') + '</a></div>' +
        '    <div class="card-body">' + App.charts.line(S.cumulative(all)) + '</div></div>' +
        '  <div class="card col-4"><div class="card-header"><div><h3 class="card-title">نتیجه معاملات</h3><p class="card-sub">' + u.int(s.closed) + ' معامله بسته‌شده</p></div></div>' +
        '    <div class="card-body">' + App.charts.donut([
          { label: 'سود', value: s.wins, color: 'var(--success-500)' },
          { label: 'زیان', value: s.losses, color: 'var(--error-500)' },
          { label: 'سر به سر', value: s.be, color: 'var(--gray-400)' }
        ], { center: u.pct(s.winRate), centerLabel: 'نرخ برد' }) + '</div></div>' +
        '</div>' +
        '<div class="grid grid-12">' +
        '  <div class="card col-8"><div class="card-header"><h3 class="card-title">آخرین معاملات</h3><a href="#/trades" class="btn btn-ghost btn-sm mr-auto">مشاهده همه' + App.icon('arrowLeft') + '</a></div>' +
        '    <div class="table-wrap"><table class="table"><thead><tr><th>نماد / تاریخ</th><th>جهت</th><th class="hide-sm">تایم‌فریم</th><th>وضعیت</th><th>سود/زیان</th></tr></thead><tbody>' + recent + '</tbody></table></div></div>' +
        '  <div class="col-4 stack">' + accountsCard +
        '    <div class="card"><div class="card-header"><div><h3 class="card-title">معاملات باز</h3><p class="card-sub">منتظر ثبت چک‌لیست بعد از خروج</p></div><span class="badge badge-brand mr-auto">' + u.int(openTrades.length) + '</span></div>' +
        '      <ul class="open-list">' + openList + '</ul></div>' +
        '    <div class="card"><div class="card-header"><div><h3 class="card-title">رعایت روانشناسی قبل از ورود</h3><p class="card-sub">درصد معاملاتی که هر مورد تأیید شده</p></div></div>' +
        '      <div class="card-body">' + App.charts.bars(psych) + '</div></div>' +
        '  </div>' +
        '</div>';
    },

    mount: function (el) {
      var btn = el.querySelector('[data-sample]');
      if (btn) btn.addEventListener('click', function () {
        App.store.addMany(App.sampleData.generate(48));
        App.toast.show('۴۸ معامله نمونه بارگذاری شد');
        App.refresh();
      });
    }
  };
})(window.App = window.App || {});
