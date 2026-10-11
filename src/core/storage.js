/**
 * لایه ذخیره‌سازی (localStorage) با مدیریت خطا
 */
(function (App) {
  'use strict';

  App.storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        if (App.toast) App.toast.show('ذخیره‌سازی در مرورگر انجام نشد', 'error');
        return false;
      }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };
})(window.App = window.App || {});
