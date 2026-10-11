/**
 * مسیریاب ساده مبتنی بر hash (بدون نیاز به سرور)
 * مثال: #/trades ، #/trade/abc123 ، #/close/abc123
 */
(function (App) {
  'use strict';

  var routes = [];

  App.router = {
    add: function (pattern, page) {
      var keys = [];
      var re = new RegExp('^' + pattern.replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '/?$');
      routes.push({ re: re, keys: keys, page: page });
      return App.router;
    },

    resolve: function () {
      var path = (location.hash || '#/').replace(/^#/, '').split('?')[0] || '/';
      for (var i = 0; i < routes.length; i++) {
        var m = path.match(routes[i].re);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
          return { page: routes[i].page, params: params, path: path };
        }
      }
      return { page: 'notFound', params: {}, path: path };
    },

    go: function (path) {
      if (location.hash === '#' + path) window.dispatchEvent(new HashChangeEvent('hashchange'));
      else location.hash = path;
    }
  };
})(window.App = window.App || {});
