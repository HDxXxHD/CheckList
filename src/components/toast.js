/**
 * اعلان‌های کوتاه (Toast)
 */
(function (App) {
  'use strict';

  var ICONS = { success: 'check', error: 'alert', warning: 'alert', info: 'info' };

  App.toast = {
    show: function (message, type, ms) {
      type = type || 'success';
      var root = document.getElementById('toast-root');
      if (!root) return;
      var el = document.createElement('div');
      el.className = 'toast toast-' + type;
      el.setAttribute('role', 'status');
      el.innerHTML = '<span class="toast-icon">' + App.icon(ICONS[type] || 'info') + '</span><span>' + App.utils.esc(message) + '</span>';
      root.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('is-visible'); });
      setTimeout(function () {
        el.classList.remove('is-visible');
        setTimeout(function () { el.remove(); }, 300);
      }, ms || 3200);
    }
  };
})(window.App = window.App || {});
