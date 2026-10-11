/**
 * نقطه شروع برنامه: تعریف مسیرها و رندر صفحات
 */
(function (App) {
  'use strict';

  App.router
    .add('/', 'dashboard')
    .add('/new', 'checklistForm')
    .add('/edit/:id', 'checklistForm')
    .add('/close/:id', 'checklistForm')
    .add('/trades', 'trades')
    .add('/trade/:id', 'tradeDetail')
    .add('/accounts', 'accounts')
    .add('/reports', 'reports')
    .add('/settings', 'settings');

  function render() {
    var r = App.router.resolve();
    var page = App.pages[r.page] || App.pages.notFound;
    var host = document.getElementById('page');

    // هر بار یک ظرف تازه ساخته می‌شود تا رویدادهای صفحه قبلی باقی نمانند
    var view = document.createElement('div');
    view.className = 'view';
    try {
      view.innerHTML = page.render(r.params, r.path);
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="card">' + App.ui.empty({ icon: 'alert', title: 'خطا در نمایش صفحه', text: String(err.message || err) }) + '</div>';
    }
    host.replaceChildren(view);

    var title = page.title ? page.title(r.params, r.path) : '';
    App.layout.setActive(page.nav, title, page.crumbs ? page.crumbs(r.params, r.path) : null);
    if (page.mount) page.mount(view, r.params, r.path);
  }

  App.refresh = render;

  document.addEventListener('DOMContentLoaded', function () {
    App.layout.render();
    App.layout.applyTheme();
    window.addEventListener('hashchange', function () {
      render();
      window.scrollTo(0, 0);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', App.layout.applyTheme);
    render();

    // پشتیبان خودکار روزانه: هنگام باز شدن پنل و هر ساعت (برای وقتی که پنل از روز قبل باز مانده)
    function autoBackup() {
      if (App.exporter.autoBackupIfDue()) {
        App.toast.show('پشتیبان خودکار امروز در پوشه دانلودها ذخیره شد');
        if (App.router.resolve().page === 'settings') render();
      }
    }
    setTimeout(autoBackup, 1500);
    setInterval(autoBackup, 60 * 60 * 1000);
  });
})(window.App = window.App || {});
