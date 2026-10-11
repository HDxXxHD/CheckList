/**
 * صفحه حساب‌های معاملاتی: ثبت حساب با مبلغ اولیه و بروکر، و نمایش موجودی هر حساب
 */
(function (App) {
  'use strict';

  var u = App.utils;
  var editing = null; // شناسه حسابی که در حال ویرایش است

  function formCard() {
    var a = (editing && App.store.account(editing)) || { name: '', broker: '', initialBalance: '' };
    var cur = App.store.settings().currency;
    return '<div class="card"><div class="card-header"><div class="card-head-icon">' + App.icon(editing ? 'edit' : 'plus') + '</div>' +
      '<div><h3 class="card-title">' + (editing ? 'ویرایش حساب' : 'ثبت حساب جدید') + '</h3><p class="card-sub">مبلغ اولیه مبنای محاسبه موجودی و رشد حساب است</p></div></div>' +
      '<form class="card-body form-grid" data-account-form novalidate autocomplete="off">' +
      '<div class="field" data-field="name"><label class="label">نام حساب <span class="req">*</span></label>' +
      '<input class="input" name="name" maxlength="40" placeholder="مثلاً حساب اصلی" value="' + u.esc(a.name) + '"/><p class="error-msg"></p></div>' +
      '<div class="field" data-field="broker"><label class="label">بروکر <span class="req">*</span></label>' +
      '<input class="input" name="broker" maxlength="40" placeholder="مثلاً Alpari" value="' + u.esc(a.broker) + '"/><p class="error-msg"></p></div>' +
      '<div class="field" data-field="initialBalance"><label class="label">مبلغ اولیه <span class="req">*</span></label>' +
      '<div class="input-group"><input class="input ltr" name="initialBalance" type="number" step="any" min="0" inputmode="decimal" value="' + u.esc(a.initialBalance) + '"/>' +
      '<span class="input-addon">' + u.esc(cur) + '</span></div><p class="error-msg"></p></div>' +
      '<div class="field form-actions">' +
      (editing ? '<button type="button" class="btn btn-ghost" data-cancel>انصراف</button>' : '') +
      '<button type="submit" class="btn btn-primary">' + App.icon('check') + (editing ? 'ذخیره تغییرات' : 'ثبت حساب') + '</button></div>' +
      '</form></div>';
  }

  function accountCard(a, all) {
    var s = App.stats.account(a, all);
    var tone = s.net > 0 ? 'text-success' : s.net < 0 ? 'text-error' : '';
    return '<div class="card account-card' + (editing === a.id ? ' is-editing' : '') + '">' +
      '<div class="card-header"><div class="card-head-icon">' + App.icon('briefcase') + '</div>' +
      '<div><h3 class="card-title">' + u.esc(a.name) + '</h3><p class="card-sub">بروکر: ' + u.esc(a.broker) + '</p></div>' +
      '<div class="row-actions mr-auto">' +
      '<button class="icon-btn sm" type="button" data-edit-account="' + a.id + '" title="ویرایش">' + App.icon('edit') + '</button>' +
      '<button class="icon-btn sm tone-error" type="button" data-delete-account="' + a.id + '" title="حذف">' + App.icon('trash') + '</button></div></div>' +
      '<div class="card-body">' +
      '<div class="account-balance"><small>موجودی فعلی</small><b class="num">' + u.amount(s.balance) + '</b>' +
      (s.growth != null ? '<span class="badge ' + (s.growth > 0 ? 'badge-success' : s.growth < 0 ? 'badge-error' : 'badge-gray') + '">' + u.signed(+s.growth.toFixed(2)) + '٪</span>' : '') + '</div>' +
      '<div class="account-stats">' +
      '<div><small>مبلغ اولیه</small><b class="num">' + u.amount(s.initial) + '</b></div>' +
      '<div><small>سود/زیان خالص</small><b class="num ' + tone + '">' + u.money(s.net) + '</b></div>' +
      '<div><small>معاملات</small><b>' + u.int(s.total) + (s.open ? ' <span class="text-muted">(' + u.int(s.open) + ' باز)</span>' : '') + '</b></div>' +
      '<div><small>نرخ برد</small><b>' + u.pct(s.winRate) + '</b></div>' +
      '</div></div></div>';
  }

  function listHtml() {
    var accs = App.store.accounts();
    if (!accs.length) {
      return '<div class="card">' + App.ui.empty({ icon: 'briefcase', title: 'هنوز حسابی ثبت نشده است', text: 'با فرم کنار صفحه اولین حساب معاملاتی را با مبلغ اولیه و بروکر ثبت کنید. سپس در فرم چک‌لیست، هر معامله را به حساب خودش متصل کنید.' }) + '</div>';
    }
    var all = App.store.all();
    var totals = accs.reduce(function (acc, a) {
      var s = App.stats.account(a, all);
      acc.initial += s.initial; acc.balance += s.balance; acc.net += s.net;
      return acc;
    }, { initial: 0, balance: 0, net: 0 });
    var unlinked = all.filter(function (t) { return !t.pre || !t.pre.account; }).length;

    return '<div class="grid kpi-grid kpi-grid-3">' +
      App.ui.kpi({ icon: 'briefcase', label: 'مجموع مبلغ اولیه', value: u.amount(totals.initial), sub: u.int(accs.length) + ' حساب', tone: 'brand' }) +
      App.ui.kpi({ icon: 'wallet', label: 'مجموع موجودی', value: u.amount(totals.balance), tone: 'success' }) +
      App.ui.kpi({ icon: 'chart', label: 'سود/زیان خالص حساب‌ها', value: u.money(totals.net), valueClass: totals.net >= 0 ? 'text-success' : 'text-error', tone: 'warning' }) +
      '</div>' +
      (unlinked ? '<div class="alert alert-info">' + App.icon('info') + '<span>' + u.int(unlinked) + ' معامله به هیچ حسابی متصل نیست و در موجودی حساب‌ها حساب نمی‌شود. برای اتصال، آن معامله را ویرایش کنید.</span></div>' : '') +
      '<div class="grid grid-2">' + accs.map(function (a) { return accountCard(a, all); }).join('') + '</div>';
  }

  function showError(form, name, msg) {
    var box = u.$('[data-field="' + name + '"]', form);
    box.classList.toggle('has-error', !!msg);
    u.$('.error-msg', box).textContent = msg || '';
  }

  App.pages.accounts = {
    nav: 'accounts',
    title: function () { return 'حساب‌های معاملاتی'; },

    render: function () {
      if (editing && !App.store.account(editing)) editing = null;
      return '<div class="grid grid-12">' +
        '<div class="col-4" data-form>' + formCard() + '</div>' +
        '<div class="col-8 stack" data-list>' + listHtml() + '</div>' +
        '</div>';
    },

    mount: function (el) {
      function redraw() {
        u.$('[data-form]', el).innerHTML = formCard();
        u.$('[data-list]', el).innerHTML = listHtml();
      }

      el.addEventListener('submit', function (e) {
        var form = e.target.closest('[data-account-form]');
        if (!form) return;
        e.preventDefault();
        var els = form.elements;
        var name = els.namedItem('name').value.trim(), broker = els.namedItem('broker').value.trim(), bal = els.namedItem('initialBalance').value;
        var ok = true;
        showError(form, 'name', name ? '' : (ok = false, 'نام حساب الزامی است'));
        showError(form, 'broker', broker ? '' : (ok = false, 'نام بروکر الزامی است'));
        showError(form, 'initialBalance', bal === '' ? (ok = false, 'مبلغ اولیه الزامی است') : +bal < 0 ? (ok = false, 'مبلغ نمی‌تواند منفی باشد') : '');
        if (!ok) return;

        var acc = editing ? u.clone(App.store.account(editing)) : {};
        acc.name = name;
        acc.broker = broker;
        acc.initialBalance = +bal;
        App.store.saveAccount(acc);
        App.toast.show(editing ? 'تغییرات حساب ذخیره شد' : 'حساب «' + name + '» ثبت شد');
        editing = null;
        redraw();
      });

      el.addEventListener('click', function (e) {
        var ed = e.target.closest('[data-edit-account]');
        if (ed) {
          editing = ed.dataset.editAccount;
          redraw();
          u.$('[data-account-form] input', el).focus();
          return;
        }
        if (e.target.closest('[data-cancel]')) {
          editing = null;
          return redraw();
        }
        var del = e.target.closest('[data-delete-account]');
        if (del) {
          var a = App.store.account(del.dataset.deleteAccount);
          var n = App.store.accountTrades(a.id).length;
          App.modal.confirm({
            title: 'حذف حساب',
            message: 'حساب «' + a.name + '» حذف شود؟' + (n ? ' ' + n + ' معامله متصل به این حساب حذف نمی‌شوند، فقط اتصالشان به حساب برداشته می‌شود.' : ''),
            okText: 'حذف حساب',
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            App.store.removeAccount(a.id);
            if (editing === a.id) editing = null;
            App.toast.show('حساب حذف شد');
            redraw();
          });
        }
      });
    }
  };
})(window.App = window.App || {});
