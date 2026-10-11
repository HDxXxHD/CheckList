/**
 * صفحه گزارش‌ها و تحلیل عملکرد
 * تمام تحلیل‌های «بر اساس آیتم چک‌لیست» به‌طور خودکار از روی اسکیمای چک‌لیست ساخته می‌شوند.
 */
(function (App) {
  'use strict';

  var u = App.utils;
  var PERIODS = [
    { v: '7', l: '۷ روز' }, { v: '30', l: '۳۰ روز' }, { v: '90', l: '۹۰ روز' }, { v: '365', l: 'یک سال' }, { v: 'all', l: 'همه' }
  ];
  var filters = { period: 'all', from: '', to: '', account: '', symbol: '', direction: '', timeframe: '' };

  function applyPeriod() {
    if (filters.period === 'custom') return;
    filters.to = '';
    filters.from = filters.period === 'all' ? '' : u.toDateInput(new Date(Date.now() - (+filters.period - 1) * 86400000));
  }

  function filtered() {
    return App.stats.filter(App.store.all(), filters);
  }

  function periodText() {
    if (!filters.from && !filters.to) return 'کل دوره';
    return (filters.from ? 'از ' + u.date(filters.from + 'T12:00:00') : '') + (filters.to ? ' تا ' + u.date(filters.to + 'T12:00:00') : ' تا امروز');
  }

  /** جدول عملکرد برای یک گروه‌بندی */
  function groupTable(rows) {
    var any = rows.some(function (r) { return r.count; });
    if (!any) return App.charts.empty('معامله بسته‌شده‌ای در این دسته وجود ندارد');
    return '<table class="table table-compact"><thead><tr><th>گزینه</th><th>تعداد</th><th class="w-40">نرخ برد</th><th>خالص</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var wr = r.winRate;
        return '<tr class="' + (r.count ? '' : 'is-muted') + '"><td>' + u.esc(r.label) + '</td><td>' + u.int(r.count) + '</td>' +
          '<td>' + (r.count ? '<div class="mini-bar"><span class="tone-' + (wr >= 55 ? 'success' : wr >= 40 ? 'warning' : 'error') + '" style="width:' + wr + '%"></span></div><small>' + u.pct(wr) + '</small>' : '—') + '</td>' +
          '<td class="num ' + (r.net > 0 ? 'text-success' : r.net < 0 ? 'text-error' : 'text-muted') + '">' + (r.count ? u.money(r.net) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function card(title, sub, body, cls) {
    return '<div class="card ' + (cls || '') + '"><div class="card-header"><div><h3 class="card-title">' + title + '</h3>' +
      (sub ? '<p class="card-sub">' + sub + '</p>' : '') + '</div></div><div class="card-body">' + body + '</div></div>';
  }

  function psychTable(rows) {
    if (!rows.length || rows.every(function (r) { return r.compliance == null; })) return App.charts.empty('معامله بسته‌شده‌ای وجود ندارد');
    return '<div class="table-wrap"><table class="table table-compact"><thead><tr><th>مورد چک‌لیست</th><th class="w-30">درصد رعایت</th>' +
      '<th>نرخ برد (رعایت شده)</th><th>نرخ برد (رعایت نشده)</th><th>اثر</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var diff = r.winRateYes != null && r.winRateNo != null ? r.winRateYes - r.winRateNo : null;
        var effect = diff == null ? '<span class="text-muted">—</span>' :
          '<span class="badge ' + (diff > 0 ? 'badge-success' : diff < 0 ? 'badge-error' : 'badge-gray') + '">' + (diff > 0 ? '+' : diff < 0 ? '−' : '') + u.int(Math.abs(Math.round(diff))) + '٪</span>';
        return '<tr><td>' + u.esc(r.label) + '</td>' +
          '<td><div class="mini-bar"><span class="tone-' + (r.compliance >= 85 ? 'success' : r.compliance >= 60 ? 'warning' : 'error') + '" style="width:' + (r.compliance || 0) + '%"></span></div><small>' + u.pct(r.compliance) + '</small></td>' +
          '<td>' + u.pct(r.winRateYes) + ' <small class="text-muted">(' + u.int(r.countYes) + ')</small></td>' +
          '<td>' + u.pct(r.winRateNo) + ' <small class="text-muted">(' + u.int(r.countNo) + ')</small></td>' +
          '<td>' + effect + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function results() {
    var S = App.stats, list = filtered(), s = S.summary(list);
    if (!list.length) {
      return '<div class="card">' + App.ui.empty({ icon: 'chart', title: 'داده‌ای برای این بازه وجود ندارد', text: 'بازه زمانی یا فیلترها را تغییر دهید.' }) + '</div>';
    }

    var pf = s.profitFactor === Infinity ? '∞' : s.profitFactor == null ? '—' : u.num(+s.profitFactor.toFixed(2));
    var kpis = '<div class="grid kpi-grid">' +
      App.ui.kpi({ icon: 'layers', label: 'تعداد معاملات', value: u.int(s.total), sub: u.int(s.closed) + ' بسته · ' + u.int(s.open) + ' باز' }) +
      App.ui.kpi({ icon: 'target', label: 'نرخ برد', value: u.pct(s.winRate), sub: u.int(s.wins) + ' / ' + u.int(s.losses) + ' / ' + u.int(s.be) + ' (سود/زیان/سربه‌سر)', tone: 'success' }) +
      App.ui.kpi({ icon: 'wallet', label: 'سود/زیان خالص', value: u.money(s.net), valueClass: s.net >= 0 ? 'text-success' : 'text-error', sub: 'امید ریاضی هر معامله: ' + u.money(s.expectancy), tone: 'warning' }) +
      App.ui.kpi({ icon: 'chart', label: 'فاکتور سود', value: pf, sub: 'بیشترین افت سرمایه: ' + u.money(-s.maxDrawdown), tone: 'purple' }) +
      '</div>' +
      '<div class="grid stat-strip card">' +
      stat('میانگین سود', u.money(s.avgWin), 'text-success') +
      stat('میانگین زیان', s.avgLoss == null ? '—' : u.money(-s.avgLoss), 'text-error') +
      stat('مجموع پیپ', u.signed(s.pips)) +
      stat('مجموع حجم', u.num(s.volume) + ' لات') +
      stat('میانگین مدت معامله', u.duration(s.avgDuration)) +
      stat('روانشناسی قبل / بعد', u.pct(s.psychPre) + ' / ' + u.pct(s.psychPost)) +
      '</div>';

    var charts = '<div class="grid grid-12">' +
      card('منحنی سود و زیان تجمعی', periodText(), App.charts.line(S.cumulative(list)), 'col-8') +
      card('توزیع نتایج', u.int(s.closed) + ' معامله بسته', App.charts.donut([
        { label: 'سود', value: s.wins, color: 'var(--success-500)' },
        { label: 'زیان', value: s.losses, color: 'var(--error-500)' },
        { label: 'سر به سر', value: s.be, color: 'var(--gray-400)' }
      ], { center: u.pct(s.winRate), centerLabel: 'نرخ برد' }), 'col-4') +
      '</div>';

    var bySymbol = S.group(list, function (t) { return t.pre.symbol; }).sort(function (a, b) { return b.net - a.net; });
    var aligned = S.group(list, function (t) { var a = S.aligned(t); return a == null ? null : a ? 'yes' : 'no'; },
      [{ key: 'yes', label: 'هم‌جهت با روند تایم‌فریم بالاتر' }, { key: 'no', label: 'خلاف روند تایم‌فریم بالاتر' }]);

    var symbolSection = '<div class="grid grid-12">' +
      card('سود و زیان به تفکیک نماد', 'مقایسه عملکرد ارزهای معامله‌شده',
        App.charts.diverging(bySymbol.map(function (r) { return { label: r.label, value: r.net }; })), 'col-6') +
      card('عملکرد به تفکیک نماد', '', groupTable(bySymbol), 'col-6') +
      '</div>';

    // تحلیل خودکار برای هر آیتم انتخابی چک‌لیست قبل از ورود
    var fieldCards = [card('هم‌جهتی با روند', 'جهت معامله نسبت به روند یک تایم‌فریم بالاتر', groupTable(aligned))]
      .concat(['pre', 'post'].reduce(function (acc, phase) {
        // «نتیجه معامله» خودش معیار است، نه عامل؛ فیلدهای بدون گزینه هم کنار می‌روند
        return acc.concat(App.schema.choiceFields(phase).filter(function (f) { return f.key !== 'result' && f.options.length; }).map(function (f) {
          var sub = f.hint ? u.esc(f.hint) : phase === 'pre' ? 'چک‌لیست قبل از ورود' : 'چک‌لیست بعد از خروج';
          return card(u.esc(f.label), sub, groupTable(S.byField(list, phase, f)));
        }));
      }, []));

    var itemSection = '<h2 class="section-title">' + App.icon('clipboard') + 'تحلیل عملکرد بر اساس آیتم‌های چک‌لیست</h2>' +
      '<div class="grid grid-3 masonry">' + fieldCards.join('') + '</div>';

    var psychSection = '<h2 class="section-title">' + App.icon('smile') + 'تحلیل روانشناسی و انضباط</h2>' +
      '<div class="grid">' +
      card('روانشناسی قبل از ورود', 'ستون «اثر» اختلاف نرخ برد در حالت رعایت نسبت به عدم رعایت هر مورد است', psychTable(S.psychImpact(list, 'pre'))) +
      card('روانشناسی بعد از خروج', 'ارزیابی انضباط و کنترل احساسات در طول معامله', psychTable(S.psychImpact(list, 'post'))) +
      '</div>';

    var tradeRows = list.slice(0, 200).map(function (t) {
      return '<tr><td class="ltr-cell">' + u.esc(t.pre.symbol) + '</td><td class="nowrap">' + u.date(t.pre.openedAt) + '</td><td>' + App.ui.directionBadge(t.pre.direction) + '</td>' +
        '<td>' + u.esc(t.pre.timeframe || '') + '</td><td>' + App.ui.statusBadge(t) + '</td><td>' + App.ui.pnlCell(t) + '</td>' +
        '<td>' + App.ui.scorePill(S.psychScore(t, 'pre')) + '</td><td>' + App.ui.scorePill(t.post ? S.psychScore(t, 'post') : null) + '</td></tr>';
    }).join('');
    var tradesSection = '<div class="card"><div class="card-header"><div><h3 class="card-title">فهرست معاملات این گزارش</h3><p class="card-sub">' + u.int(list.length) + ' مورد</p></div></div>' +
      '<div class="table-wrap"><table class="table table-compact"><thead><tr><th>نماد</th><th>تاریخ</th><th>جهت</th><th>تایم‌فریم</th><th>نتیجه</th><th>سود/زیان</th><th>روانی قبل</th><th>روانی بعد</th></tr></thead><tbody>' +
      tradeRows + '</tbody></table></div></div>';

    return kpis + charts + symbolSection + itemSection + psychSection + tradesSection;
  }

  function stat(label, value, cls) {
    return '<div class="stat"><small>' + label + '</small><b class="' + (cls || '') + '">' + value + '</b></div>';
  }

  function select(name, label, opts) {
    return '<label class="filter-field"><span>' + label + '</span><select class="input" data-f="' + name + '"><option value="">همه</option>' +
      opts.map(function (o) { return '<option value="' + u.esc(o.v) + '"' + (filters[name] === o.v ? ' selected' : '') + '>' + u.esc(o.l) + '</option>'; }).join('') + '</select></label>';
  }

  App.pages.reports = {
    nav: 'reports',
    title: function () { return 'گزارش‌ها و تحلیل'; },

    render: function () {
      var all = App.store.all();
      if (!all.length) {
        return '<div class="card">' + App.ui.empty({ icon: 'pie', title: 'هنوز داده‌ای برای گزارش وجود ندارد', text: 'پس از ثبت چند چک‌لیست، گزارش‌های تحلیلی اینجا نمایش داده می‌شود.',
          actions: '<a href="#/new" class="btn btn-primary">' + App.icon('plus') + 'ثبت چک‌لیست</a>' }) + '</div>';
      }
      applyPeriod();
      var symbols = App.stats.symbols(all).map(function (s) { return { v: s, l: s }; });

      return '<div class="print-only print-head"><h1>گزارش عملکرد چک‌لیست معاملات</h1><p data-print-period>' + periodText() + ' · تاریخ تهیه: ' + u.date(new Date()) + '</p></div>' +
        '<div class="card report-filters no-print">' +
        '<div class="segmented" role="tablist">' + PERIODS.map(function (p) {
          return '<button type="button" class="' + (filters.period === p.v ? 'is-active' : '') + '" data-period="' + p.v + '">' + p.l + '</button>';
        }).join('') + '</div>' +
        '<label class="filter-field"><span>از تاریخ</span><input class="input ltr" type="date" data-f="from" value="' + filters.from + '"/></label>' +
        '<label class="filter-field"><span>تا تاریخ</span><input class="input ltr" type="date" data-f="to" value="' + filters.to + '"/></label>' +
        (App.store.accounts().length ? select('account', 'حساب', App.schema.field('pre', 'account').options) : '') +
        select('symbol', 'نماد', symbols) +
        select('direction', 'جهت', [{ v: 'buy', l: 'خرید' }, { v: 'sell', l: 'فروش' }]) +
        select('timeframe', 'تایم‌فریم', App.schema.field('pre', 'timeframe').options) +
        '<div class="report-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-export>' + App.icon('download') + 'خروجی Excel</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-print>' + App.icon('printer') + 'چاپ / PDF</button></div>' +
        '</div>' +
        '<div class="stack" data-results>' + results() + '</div>';
    },

    mount: function (el) {
      function update() {
        u.$('[data-results]', el).innerHTML = results();
        var pp = u.$('[data-print-period]', el);
        if (pp) pp.textContent = periodText() + ' · تاریخ تهیه: ' + u.date(new Date());
      }

      el.addEventListener('click', function (e) {
        var p = e.target.closest('[data-period]');
        if (p) {
          filters.period = p.dataset.period;
          applyPeriod();
          u.$$('[data-period]', el).forEach(function (b) { b.classList.toggle('is-active', b === p); });
          u.$('[data-f="from"]', el).value = filters.from;
          u.$('[data-f="to"]', el).value = filters.to;
          return update();
        }
        if (e.target.closest('[data-print]')) return window.print();
        if (e.target.closest('[data-export]')) {
          var list = filtered();
          if (!list.length) return App.toast.show('داده‌ای برای خروجی وجود ندارد', 'warning');
          App.exporter.downloadCSV(list, 'checklist-report');
          App.toast.show('فایل Excel گزارش دانلود شد');
        }
      });

      el.addEventListener('change', function (e) {
        var f = e.target.dataset.f;
        if (!f) return;
        filters[f] = e.target.value;
        if (f === 'from' || f === 'to') {
          filters.period = 'custom';
          u.$$('[data-period]', el).forEach(function (b) { b.classList.remove('is-active'); });
        }
        update();
      });
    }
  };
})(window.App = window.App || {});
