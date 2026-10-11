/**
 * فرم مرحله‌ای ثبت چک‌لیست
 * حالت‌ها: new (ثبت جدید) | edit (ویرایش) | close (ثبت چک‌لیست بعد از خروج)
 */
(function (App) {
  'use strict';

  var u = App.utils;

  var STEPS = [
    { phase: 'pre', sections: ['pre-market'], title: 'بررسی بازار', sub: 'قبل از ورود' },
    { phase: 'pre', sections: ['pre-psych'], title: 'روانشناسی', sub: 'قبل از ورود' },
    { phase: 'post', sections: ['post-market', 'post-psych'], title: 'بعد از خروج', sub: 'نتیجه و ارزیابی' }
  ];

  var state = null;

  function modeOf(params, path) {
    if (/^\/close\//.test(path)) return 'close';
    if (params.id) return 'edit';
    return 'new';
  }

  function stepper() {
    return '<ol class="stepper">' + STEPS.map(function (s, i) {
      var cls = i === state.step ? 'is-current' : i < state.step ? 'is-done' : '';
      return '<li class="' + cls + '"><button type="button" data-go="' + i + '"><span class="step-num">' +
        (i < state.step ? App.icon('check') : u.int(i + 1)) + '</span><span class="step-text"><b>' + s.title + '</b><small>' + s.sub + '</small></span></button></li>';
    }).join('') + '</ol>';
  }

  function footer() {
    var closed = state.draft.status === 'closed';
    var back = state.mode === 'new' ? '#/' : '#/trade/' + state.draft.id;
    var b = [];
    if (state.step === 0) {
      b.push('<a href="' + back + '" class="btn btn-ghost">انصراف</a>');
      b.push('<button type="button" class="btn btn-primary" data-next>مرحله بعد' + App.icon('arrowLeft') + '</button>');
    } else if (state.step === 1) {
      b.push('<button type="button" class="btn btn-ghost" data-prev>' + App.icon('arrowRight') + 'مرحله قبل</button>');
      b.push('<span class="spacer"></span>');
      b.push('<button type="button" class="btn btn-outline" data-save-open>' + App.icon('check') + (closed ? 'ذخیره تغییرات' : 'ثبت معامله (باز)') + '</button>');
      b.push('<button type="button" class="btn btn-primary" data-next>' + (closed ? 'بعد از خروج' : 'ادامه: ثبت خروج') + App.icon('arrowLeft') + '</button>');
    } else {
      b.push('<button type="button" class="btn btn-ghost" data-prev>' + App.icon('arrowRight') + 'مرحله قبل</button>');
      b.push('<span class="spacer"></span>');
      b.push('<button type="button" class="btn btn-success" data-save-close>' + App.icon('lock') + (closed ? 'ذخیره تغییرات' : 'ذخیره و بستن معامله') + '</button>');
    }
    return b.join('');
  }

  function sidePanel() {
    var d = state.draft, pre = d.pre || {}, post = d.post || {};
    var S = App.stats;
    var preScore = S.psychScore(d, 'pre');
    var marketFields = App.schema.section('pre-market').fields.filter(function (f) { return f.required; });
    var filled = marketFields.filter(function (f) { return pre[f.key] !== '' && pre[f.key] != null; }).length;
    var aligned = S.aligned(d);

    function check(ok, text) {
      var cls = ok === true ? 'ok' : ok === false ? 'bad' : 'idle';
      var ic = ok === true ? 'check' : ok === false ? 'alert' : 'clock';
      return '<li class="ready-item is-' + cls + '">' + App.icon(ic) + '<span>' + text + '</span></li>';
    }

    var html = '<div class="card side-card"><div class="card-header"><h3 class="card-title">وضعیت آمادگی ورود</h3></div><div class="card-body">' +
      '<div class="ready-ring">' + App.charts.ring(preScore, { size: 84 }) + '<div><b>روانشناسی قبل از ورود</b><small>' +
      (preScore === 100 ? 'همه موارد تأیید شده است' : 'برای ورود، همه موارد باید تأیید شود') + '</small></div></div>' +
      '<ul class="ready-list">' +
      check(filled === marketFields.length ? true : null, 'تحلیل بازار: ' + u.int(filled) + ' از ' + u.int(marketFields.length) + ' مورد') +
      check(aligned, aligned == null ? 'هم‌جهتی با روند تایم‌فریم بالاتر' : aligned ? 'جهت معامله هم‌جهت با روند بالاتر است' : 'جهت معامله خلاف روند بالاتر است') +
      check(pre.news === 'yes' ? true : pre.news === 'no' ? false : null, pre.news === 'no' ? 'خبر بررسی نشده است' : 'بررسی اخبار اقتصادی') +
      check(preScore === 100 ? true : (pre.psych || []).length ? false : null, 'چک‌لیست روانشناسی کامل') +
      '</ul>';

    if (pre.news === 'no' || (preScore != null && preScore < 100 && (pre.psych || []).length)) {
      html += '<div class="alert alert-warning">' + App.icon('alert') + '<span>تا زمانی که همه موارد چک‌لیست تأیید نشده، ورود به معامله توصیه نمی‌شود.</span></div>';
    }
    html += '</div></div>';

    if (pre.symbol || pre.direction) {
      var acc = App.store.account(pre.account);
      html += '<div class="card side-card"><div class="card-body summary-mini">' +
        (acc ? '<div class="span-2"><small>حساب</small><b>' + u.esc(acc.name) + ' · ' + u.esc(acc.broker) + '</b></div>' : '') +
        '<div><small>نماد</small><b class="ltr">' + u.esc(pre.symbol || '—') + '</b></div>' +
        '<div><small>جهت</small>' + App.ui.directionBadge(pre.direction) + '</div>' +
        '<div><small>تایم‌فریم</small><b>' + u.esc(pre.timeframe || '—') + '</b></div>' +
        '<div><small>تاریخ ورود</small><b>' + u.date(pre.openedAt) + '</b></div></div></div>';
    }

    if (state.step === 2) {
      var postScore = App.stats.psychScore({ post: post }, 'post');
      var sign = post.result === 'win' ? 1 : post.result === 'loss' ? -1 : 0;
      var net = Math.abs(+post.pnl || 0) * sign + (+post.swap || 0);
      html += '<div class="card side-card"><div class="card-header"><h3 class="card-title">ارزیابی بعد از خروج</h3></div><div class="card-body">' +
        '<div class="ready-ring">' + App.charts.ring(postScore, { size: 84 }) + '<div><b>انضباط معاملاتی</b><small>رعایت قوانین و کنترل احساسات</small></div></div>' +
        '<div class="net-preview"><small>سود/زیان خالص (با سوآپ)</small><b class="' + (net > 0 ? 'text-success' : net < 0 ? 'text-error' : '') + '">' + (post.result ? u.money(net) : '—') + '</b></div>' +
        '</div></div>';
    }
    return html;
  }

  function refreshUI(root) {
    u.$('[data-stepper]', root).innerHTML = stepper();
    u.$('[data-footer]', root).innerHTML = footer();
    u.$('[data-side]', root).innerHTML = sidePanel();
    u.$$('.step-panel', root).forEach(function (p) { p.hidden = +p.dataset.step !== state.step; });
  }

  function validateStep(i) {
    var s = STEPS[i];
    return App.form.validate(s.phase, s.sections, state.draft[s.phase]);
  }

  function goTo(root, target) {
    // حرکت به جلو فقط با تکمیل مراحل قبلی
    for (var i = state.step; i < target; i++) {
      var errs = validateStep(i);
      if (errs.length) {
        state.step = i;
        refreshUI(root);
        App.form.showErrors(root, errs);
        App.toast.show('لطفاً موارد الزامی این مرحله را تکمیل کنید', 'warning');
        return;
      }
    }
    state.step = target;
    if (target === 2 && !state.draft.post) state.draft.post = App.schema.defaults('post');
    refreshUI(root);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save(root, close) {
    var d = state.draft;
    var steps = close ? [0, 1, 2] : [0, 1];
    for (var k = 0; k < steps.length; k++) {
      var errs = validateStep(steps[k]);
      if (errs.length) {
        state.step = steps[k];
        refreshUI(root);
        App.form.showErrors(root, errs);
        App.toast.show('لطفاً موارد الزامی را تکمیل کنید', 'warning');
        return;
      }
    }

    if (close) {
      if (d.post.result === 'be') d.post.pnl = +d.post.pnl || 0;
      d.status = 'closed';
      var opened = new Date(d.pre.openedAt).getTime();
      d.closedAt = new Date(opened + (+d.post.duration || 0) * 60000).toISOString();
    } else if (d.status !== 'closed') {
      d.status = 'open';
      d.post = null;
      d.closedAt = null;
    }

    var saved = App.store.save(d);
    App.toast.show(close ? 'چک‌لیست بعد از خروج ثبت و معامله بسته شد' : (state.mode === 'new' ? 'معامله با وضعیت «باز» ثبت شد' : 'تغییرات ذخیره شد'));
    App.router.go('/trade/' + saved.id);
  }

  App.pages.checklistForm = {
    nav: 'new',

    title: function (params, path) {
      var m = modeOf(params, path);
      return m === 'new' ? 'ثبت چک‌لیست جدید' : m === 'close' ? 'ثبت چک‌لیست بعد از خروج' : 'ویرایش چک‌لیست';
    },

    crumbs: function (params, path) {
      var m = modeOf(params, path);
      if (m === 'new') return ['ثبت چک‌لیست جدید'];
      return [{ label: 'لیست معاملات', href: '#/trades' }, m === 'close' ? 'ثبت خروج' : 'ویرایش'];
    },

    render: function (params, path) {
      var mode = modeOf(params, path);
      var draft;
      if (mode === 'new') {
        draft = { status: 'open', pre: App.schema.defaults('pre'), post: null };
        // پیش‌فرض: آخرین حساب استفاده‌شده، یا تنها حساب موجود
        var accs = App.store.accounts();
        var last = App.store.account(App.store.settings().lastAccount);
        draft.pre.account = last ? last.id : accs.length === 1 ? accs[0].id : '';
      } else {
        var t = App.store.get(params.id);
        if (!t) return App.pages.notFound.render();
        draft = u.clone(t);
        if (mode === 'close' && !draft.post) draft.post = App.schema.defaults('post');
      }
      state = { mode: mode, step: mode === 'close' ? 2 : 0, draft: draft };
      var post = draft.post || App.schema.defaults('post');

      return App.form.datalists() +
        '<div class="wizard">' +
        '  <div class="wizard-main">' +
        '    <div class="card stepper-card" data-stepper></div>' +
        '    <form class="wizard-form" novalidate autocomplete="off" onsubmit="return false">' +
        '      <div class="step-panel" data-step="0">' + App.form.renderSection('pre', App.schema.section('pre-market'), draft.pre, { badge: 'قبل از ورود' }) + '</div>' +
        '      <div class="step-panel" data-step="1" hidden>' + App.form.renderSection('pre', App.schema.section('pre-psych'), draft.pre, { badge: 'قبل از ورود' }) + '</div>' +
        '      <div class="step-panel stack" data-step="2" hidden>' +
        App.form.renderSection('post', App.schema.section('post-market'), post, { badge: 'بعد از خروج' }) +
        App.form.renderSection('post', App.schema.section('post-psych'), post, { badge: 'بعد از خروج' }) + '</div>' +
        '    </form>' +
        '    <div class="card wizard-footer" data-footer></div>' +
        '  </div>' +
        '  <aside class="wizard-side" data-side></aside>' +
        '</div>';
    },

    mount: function (el) {
      if (!state || !u.$('.wizard', el)) return;
      var root = u.$('.wizard', el);
      refreshUI(root);

      App.form.bind(u.$('.wizard-form', root), state.draft, function () {
        u.$('[data-side]', root).innerHTML = sidePanel();
      });

      root.addEventListener('click', function (e) {
        var go = e.target.closest('[data-go]');
        if (go) return goTo(root, +go.dataset.go);
        if (e.target.closest('[data-next]')) return goTo(root, state.step + 1);
        if (e.target.closest('[data-prev]')) return goTo(root, state.step - 1);
        if (e.target.closest('[data-save-open]')) return save(root, false);
        if (e.target.closest('[data-save-close]')) return save(root, true);
      });
    }
  };
})(window.App = window.App || {});
