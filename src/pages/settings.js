/**
 * صفحه تنظیمات: تم، نمادها، پشتیبان‌گیری و بازیابی
 */
(function (App) {
  'use strict';

  var u = App.utils;

  function symbolChips() {
    return App.store.settings().symbols.map(function (s) {
      return '<span class="tag ltr">' + u.esc(s) + '<button type="button" data-remove-symbol="' + u.esc(s) + '" aria-label="حذف">' + App.icon('x') + '</button></span>';
    }).join('') || '<span class="text-muted">نمادی ثبت نشده است</span>';
  }

  App.pages.settings = {
    nav: 'settings',
    title: function () { return 'تنظیمات و پشتیبان'; },

    render: function () {
      var st = App.store.settings();
      var themes = [{ v: 'light', l: 'روشن', i: 'sun' }, { v: 'dark', l: 'تیره', i: 'moon' }, { v: 'system', l: 'مطابق سیستم', i: 'sidebar' }];

      return '<div class="grid grid-2">' +
        '<div class="stack">' +
        '<div class="card"><div class="card-header"><div><h3 class="card-title">ظاهر پنل</h3><p class="card-sub">تم رنگی رابط کاربری</p></div></div><div class="card-body">' +
        '<div class="theme-options">' + themes.map(function (t) {
          return '<button type="button" class="theme-opt' + (st.theme === t.v ? ' is-active' : '') + '" data-theme-opt="' + t.v + '">' + App.icon(t.i) + '<span>' + t.l + '</span></button>';
        }).join('') + '</div></div></div>' +

        '<div class="card"><div class="card-header"><div><h3 class="card-title">نمادهای معاملاتی</h3><p class="card-sub">پیشنهادهای فیلد «ارز معامله» در فرم ثبت</p></div></div><div class="card-body">' +
        '<div class="tags" data-symbols>' + symbolChips() + '</div>' +
        '<form class="inline-form" data-add-symbol><input class="input ltr" name="symbol" placeholder="مثلاً NAS100" maxlength="20"/><button class="btn btn-primary btn-sm" type="submit">' + App.icon('plus') + 'افزودن</button></form>' +
        '</div></div>' +

        '<div class="card"><div class="card-header"><div><h3 class="card-title">واحد پول</h3><p class="card-sub">نمایش مبالغ سود و زیان</p></div></div><div class="card-body">' +
        '<form class="inline-form" data-currency><input class="input ltr" name="currency" value="' + u.esc(st.currency) + '" maxlength="6"/><button class="btn btn-outline btn-sm" type="submit">ذخیره</button></form>' +
        '</div></div>' +
        '</div>' +

        '<div class="stack">' +
        '<div class="card"><div class="card-header"><div><h3 class="card-title">پشتیبان‌گیری و بازیابی</h3><p class="card-sub">داده‌ها فقط در همین مرورگر ذخیره می‌شوند؛ به‌طور منظم پشتیبان بگیرید.</p></div></div><div class="card-body stack-sm">' +
        '<div class="setting-row"><div><b>دانلود پشتیبان کامل</b><small>فایل JSON شامل همه معاملات و تنظیمات</small></div><button type="button" class="btn btn-primary btn-sm" data-backup>' + App.icon('download') + 'دانلود</button></div>' +
        '<div class="setting-row"><div><b>پشتیبان خودکار روزانه</b><small>روزی یک بار، اولین باری که پنل باز می‌شود، فایل JSON در پوشه دانلودها ذخیره می‌شود. ' +
        'آخرین پشتیبان: ' + (st.lastBackupAt ? u.dateTime(st.lastBackupAt) : 'هنوز گرفته نشده') + '</small></div>' +
        '<label class="switch"><input type="checkbox" data-auto-backup' + (st.autoBackup ? ' checked' : '') + '/><span class="switch-track"></span></label></div>' +
        '<div class="setting-row"><div><b>بازیابی از فایل پشتیبان</b><small>داده‌های فعلی با محتوای فایل جایگزین می‌شود</small></div><label class="btn btn-outline btn-sm">' + App.icon('upload') + 'انتخاب فایل<input type="file" accept=".json,application/json" data-restore hidden/></label></div>' +
        '<div class="setting-row"><div><b>خروجی Excel همه معاملات</b><small>فایل CSV قابل باز شدن در Excel با پشتیبانی فارسی</small></div><button type="button" class="btn btn-outline btn-sm" data-csv>' + App.icon('download') + 'خروجی</button></div>' +
        '</div></div>' +

        '<div class="card"><div class="card-header"><div><h3 class="card-title">داده‌ها</h3><p class="card-sub">' + u.int(App.store.count()) + ' معامله و ' + u.int(App.store.accounts().length) + ' حساب ثبت شده است</p></div></div><div class="card-body stack-sm">' +
        '<div class="setting-row"><div><b>بارگذاری داده نمونه</b><small>۴۸ معامله آزمایشی برای آشنایی با گزارش‌ها اضافه می‌شود</small></div><button type="button" class="btn btn-outline btn-sm" data-sample>' + App.icon('sparkle') + 'بارگذاری</button></div>' +
        '<div class="setting-row"><div><b>پاک کردن داده‌های نمونه</b><small>' + (App.store.sampleCount() ? u.int(App.store.sampleCount()) + ' معامله نمونه وجود دارد؛ معاملات و حساب‌های واقعی شما حذف نمی‌شوند' : 'داده نمونه‌ای وجود ندارد') + '</small></div>' +
        '<button type="button" class="btn btn-outline-danger btn-sm" data-clear-samples' + (App.store.sampleCount() ? '' : ' disabled') + '>' + App.icon('trash') + 'پاک کردن</button></div>' +
        '<div class="setting-row danger"><div><b>حذف همه داده‌ها</b><small>این عمل قابل بازگشت نیست؛ ابتدا پشتیبان بگیرید</small></div><button type="button" class="btn btn-outline-danger btn-sm" data-clear>' + App.icon('trash') + 'حذف همه</button></div>' +
        '</div></div>' +
        '</div>' +
        '</div>';
    },

    mount: function (el) {
      el.addEventListener('click', function (e) {
        var th = e.target.closest('[data-theme-opt]');
        if (th) {
          App.layout.setTheme(th.dataset.themeOpt);
          u.$$('[data-theme-opt]', el).forEach(function (b) { b.classList.toggle('is-active', b === th); });
          return;
        }
        var rm = e.target.closest('[data-remove-symbol]');
        if (rm) {
          var syms = App.store.settings().symbols.filter(function (s) { return s !== rm.dataset.removeSymbol; });
          App.store.updateSettings({ symbols: syms });
          u.$('[data-symbols]', el).innerHTML = symbolChips();
          return;
        }
        if (e.target.closest('[data-backup]')) {
          App.exporter.downloadBackup();
          App.toast.show('فایل پشتیبان دانلود شد');
          return App.refresh();
        }
        if (e.target.closest('[data-csv]')) {
          if (!App.store.count()) return App.toast.show('معامله‌ای ثبت نشده است', 'warning');
          App.exporter.downloadCSV(App.store.all(), 'checklist-all');
          return App.toast.show('فایل Excel دانلود شد');
        }
        if (e.target.closest('[data-sample]')) {
          App.store.addMany(App.sampleData.generate(48));
          App.toast.show('۴۸ معامله نمونه اضافه شد');
          return App.refresh();
        }
        if (e.target.closest('[data-clear-samples]')) {
          var n = App.store.sampleCount();
          App.modal.confirm({ title: 'پاک کردن داده‌های نمونه', message: u.int(n) + ' معامله نمونه حذف می‌شود. معاملات و حساب‌هایی که خودتان ثبت کرده‌اید باقی می‌مانند. ادامه می‌دهید؟', okText: 'پاک کردن', danger: true })
            .then(function (ok) {
              if (!ok) return;
              var removed = App.store.clearSamples();
              App.toast.show(u.int(removed) + ' معامله نمونه حذف شد');
              App.refresh();
            });
          return;
        }
        if (e.target.closest('[data-clear]')) {
          App.modal.confirm({ title: 'حذف همه داده‌ها', message: 'همه معاملات، چک‌لیست‌ها و حساب‌های ثبت‌شده حذف می‌شوند. ادامه می‌دهید؟', okText: 'حذف همه', danger: true })
            .then(function (ok) {
              if (!ok) return;
              App.store.clear();
              App.store.accounts().forEach(function (a) { App.store.removeAccount(a.id); });
              App.toast.show('همه داده‌ها حذف شد');
              App.refresh();
            });
        }
      });

      el.addEventListener('submit', function (e) {
        e.preventDefault();
        var form = e.target;
        if (form.hasAttribute('data-add-symbol')) {
          var v = form.symbol.value.trim().toUpperCase();
          if (!v) return;
          var syms = App.store.settings().symbols;
          if (syms.indexOf(v) === -1) App.store.updateSettings({ symbols: syms.concat(v) });
          form.reset();
          u.$('[data-symbols]', el).innerHTML = symbolChips();
        }
        if (form.hasAttribute('data-currency')) {
          App.store.updateSettings({ currency: form.currency.value.trim() || '$' });
          App.toast.show('واحد پول ذخیره شد');
        }
      });

      el.addEventListener('change', function (e) {
        if (e.target.hasAttribute('data-auto-backup')) {
          App.store.updateSettings({ autoBackup: e.target.checked });
          return App.toast.show(e.target.checked ? 'پشتیبان خودکار روزانه فعال شد' : 'پشتیبان خودکار غیرفعال شد');
        }
        if (!e.target.hasAttribute('data-restore')) return;
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(reader.result);
            App.modal.confirm({ title: 'بازیابی پشتیبان', message: 'تعداد ' + (data.trades ? data.trades.length : 0) + ' معامله در فایل یافت شد. داده‌های فعلی جایگزین شوند؟', okText: 'بازیابی' })
              .then(function (ok) {
                if (!ok) return;
                App.store.importJSON(data);
                App.layout.applyTheme();
                App.toast.show('بازیابی با موفقیت انجام شد');
                App.refresh();
              });
          } catch (err) {
            App.toast.show(err.message || 'فایل نامعتبر است', 'error');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
    }
  };
})(window.App = window.App || {});
