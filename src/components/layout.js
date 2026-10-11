/**
 * چیدمان اصلی: سایدبار و هدر
 */
(function (App) {
  'use strict';

  var u = App.utils;

  var NAV = [
    {
      group: 'منو', items: [
        { id: 'dashboard', label: 'داشبورد', icon: 'grid', href: '#/' },
        { id: 'new', label: 'ثبت چک‌لیست جدید', icon: 'clipboard', href: '#/new' },
        { id: 'trades', label: 'لیست معاملات', icon: 'list', href: '#/trades' },
        { id: 'accounts', label: 'حساب‌ها', icon: 'briefcase', href: '#/accounts' },
        { id: 'reports', label: 'گزارش‌ها و تحلیل', icon: 'pie', href: '#/reports' }
      ]
    },
    {
      group: 'سیستم', items: [
        { id: 'settings', label: 'تنظیمات و پشتیبان', icon: 'cog', href: '#/settings' }
      ]
    }
  ];

  function isDark() { return document.documentElement.classList.contains('dark'); }

  App.layout = {
    render: function () {
      var sb = document.getElementById('sidebar');
      sb.innerHTML =
        '<div class="sidebar-brand"><a href="#/" class="brand"><img src="assets/img/logo.svg" alt="" width="34" height="34"/>' +
        '<span class="brand-text"><b>چک‌لیست</b><small>ژورنال معاملاتی</small></span></a></div>' +
        '<nav class="sidebar-nav">' + NAV.map(function (g) {
          return '<div class="nav-group"><h4 class="nav-title"><span>' + g.group + '</span></h4><ul>' +
            g.items.map(function (it) {
              return '<li><a class="nav-item" href="' + it.href + '" data-nav="' + it.id + '" title="' + it.label + '">' + App.icon(it.icon) +
                '<span class="nav-label">' + it.label + '</span>' +
                (it.id === 'trades' ? '<span class="nav-badge" data-open-count hidden></span>' : '') + '</a></li>';
            }).join('') + '</ul></div>';
        }).join('') + '</nav>' +
        '<div class="sidebar-promo"><div class="promo-icon">' + App.icon('sparkle') + '</div>' +
        '<b>قبل از هر معامله</b><p>چک‌لیست را کامل کنید؛ انضباط، کلید سودآوری پایدار است.</p>' +
        '<a href="#/new" class="btn btn-primary btn-sm btn-block">' + App.icon('plus') + 'ثبت چک‌لیست</a></div>';

      var hd = document.getElementById('header');
      hd.innerHTML =
        '<button class="icon-btn header-toggle" type="button" data-toggle-sidebar aria-label="باز و بسته کردن منو">' + App.icon('menu') + '</button>' +
        '<div class="header-title"><h1 data-page-title></h1><nav class="breadcrumb" data-breadcrumb></nav></div>' +
        '<div class="header-actions">' +
        '<a href="#/new" class="btn btn-primary btn-sm hide-sm">' + App.icon('plus') + 'چک‌لیست جدید</a>' +
        '<button class="icon-btn" type="button" data-toggle-theme aria-label="تغییر تم">' + App.icon(isDark() ? 'sun' : 'moon') + '</button>' +
        '</div>';

      hd.addEventListener('click', function (e) {
        if (e.target.closest('[data-toggle-sidebar]')) App.layout.toggleSidebar();
        if (e.target.closest('[data-toggle-theme]')) App.layout.setTheme(isDark() ? 'light' : 'dark');
      });
      document.getElementById('backdrop').addEventListener('click', function () { App.layout.closeMobile(); });
      sb.addEventListener('click', function (e) { if (e.target.closest('a')) App.layout.closeMobile(); });
    },

    toggleSidebar: function () {
      if (window.innerWidth < 1024) {
        document.body.classList.toggle('sidebar-open');
      } else {
        var c = document.documentElement.classList.toggle('sidebar-collapsed');
        try { localStorage.setItem('checklist.sidebar', c ? 'collapsed' : 'expanded'); } catch (e) {}
      }
    },

    closeMobile: function () { document.body.classList.remove('sidebar-open'); },

    setTheme: function (theme) {
      App.store.updateSettings({ theme: theme });
      App.layout.applyTheme();
    },

    applyTheme: function () {
      var t = App.store.settings().theme;
      var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
      var btn = u.$('[data-toggle-theme]');
      if (btn) btn.innerHTML = App.icon(dark ? 'sun' : 'moon');
    },

    setActive: function (nav, title, crumbs) {
      u.$$('[data-nav]').forEach(function (a) { a.classList.toggle('is-active', a.dataset.nav === nav); });
      u.$('[data-page-title]').textContent = title || '';
      u.$('[data-breadcrumb]').innerHTML = '<a href="#/">خانه</a>' + (crumbs || [title]).map(function (c) {
        return '<span class="sep">/</span>' + (typeof c === 'string' ? '<span>' + u.esc(c) + '</span>' : '<a href="' + c.href + '">' + u.esc(c.label) + '</a>');
      }).join('');
      document.title = (title ? title + ' | ' : '') + 'چک‌لیست معاملات';
      App.layout.updateBadges();
    },

    updateBadges: function () {
      var open = App.store.all().filter(function (t) { return t.status !== 'closed'; }).length;
      var b = u.$('[data-open-count]');
      if (!b) return;
      b.hidden = !open;
      b.textContent = u.int(open) + ' باز';
    }
  };
})(window.App = window.App || {});
