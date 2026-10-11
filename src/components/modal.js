/**
 * پنجره تأیید (Modal)
 */
(function (App) {
  'use strict';

  App.modal = {
    confirm: function (opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var root = document.getElementById('modal-root');
        var esc = App.utils.esc;
        root.innerHTML =
          '<div class="modal-backdrop" data-close>' +
          '  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
          '    <div class="modal-icon ' + (opts.danger ? 'is-danger' : '') + '">' + App.icon(opts.danger ? 'trash' : 'info') + '</div>' +
          '    <h3 id="modal-title" class="modal-title">' + esc(opts.title || 'آیا مطمئن هستید؟') + '</h3>' +
          '    <p class="modal-text">' + esc(opts.message || '') + '</p>' +
          '    <div class="modal-actions">' +
          '      <button type="button" class="btn btn-outline" data-cancel>' + esc(opts.cancelText || 'انصراف') + '</button>' +
          '      <button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(opts.okText || 'تأیید') + '</button>' +
          '    </div>' +
          '  </div>' +
          '</div>';

        var backdrop = root.firstElementChild;
        requestAnimationFrame(function () { backdrop.classList.add('is-visible'); });

        function close(val) {
          document.removeEventListener('keydown', onKey);
          backdrop.classList.remove('is-visible');
          setTimeout(function () { root.innerHTML = ''; }, 180);
          resolve(val);
        }
        function onKey(e) { if (e.key === 'Escape') close(false); }

        document.addEventListener('keydown', onKey);
        backdrop.addEventListener('click', function (e) {
          if (e.target.hasAttribute('data-close') || e.target.closest('[data-cancel]')) close(false);
          else if (e.target.closest('[data-ok]')) close(true);
        });
        backdrop.querySelector('[data-ok]').focus();
      });
    }
  };
})(window.App = window.App || {});
