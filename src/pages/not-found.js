/**
 * صفحه ۴۰۴
 */
(function (App) {
  'use strict';

  App.pages.notFound = {
    nav: '',
    title: function () { return 'صفحه یافت نشد'; },
    render: function () {
      return '<div class="card">' + App.ui.empty({
        icon: 'alert',
        title: 'صفحه یا معامله مورد نظر یافت نشد',
        text: 'ممکن است این مورد حذف شده باشد.',
        actions: '<a href="#/" class="btn btn-primary">بازگشت به داشبورد</a>'
      }) + '</div>';
    }
  };
})(window.App = window.App || {});
