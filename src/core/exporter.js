/**
 * خروجی گرفتن: Excel (CSV با پشتیبانی فارسی) و پشتیبان JSON
 */
(function (App) {
  'use strict';

  function cell(v) {
    var s = String(v == null ? '' : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function stamp() {
    return App.utils.toDateInput(new Date());
  }

  App.exporter = {
    /** ساخت فایل CSV از لیست معاملات بر اساس اسکیمای چک‌لیست */
    tradesCSV: function (list) {
      var schema = App.schema, S = App.stats, u = App.utils;
      var cols = [
        { h: 'شناسه', f: function (t) { return t.id; } },
        { h: 'وضعیت', f: function (t) { return t.status === 'closed' ? 'بسته' : 'باز'; } }
      ];

      ['pre', 'post'].forEach(function (phase) {
        var title = phase === 'pre' ? 'قبل' : 'بعد';
        schema.fields(phase).forEach(function (field) {
          if (field.type === 'checklist') {
            cols.push({
              h: 'امتیاز روانشناسی ' + title + ' (٪)',
              f: function (t) { var s = S.psychScore(t, phase); return s == null ? '' : Math.round(s); }
            });
            field.items.forEach(function (item) {
              cols.push({
                h: title + ' | ' + item.l,
                f: function (t) {
                  if (!t[phase]) return '';
                  return (t[phase][field.key] || []).indexOf(item.k) !== -1 ? '✓' : '✗';
                }
              });
            });
          } else {
            cols.push({
              h: field.label,
              f: function (t) {
                var v = t[phase] ? t[phase][field.key] : '';
                if (v == null || v === '') return '';
                if (field.type === 'choice') return schema.display(field, v);
                if (field.type === 'datetime') return u.dateTime(v);
                if (field.type === 'duration') return v;
                return v;
              }
            });
          }
        });
      });

      cols.push({ h: 'سود/زیان خالص', f: function (t) { return S.isClosed(t) ? +S.pnl(t).toFixed(2) : ''; } });
      cols.push({ h: 'پیپ (با علامت)', f: function (t) { return S.isClosed(t) ? S.pips(t) : ''; } });

      var lines = [cols.map(function (c) { return cell(c.h); }).join(',')];
      list.forEach(function (t) {
        lines.push(cols.map(function (c) { return cell(c.f(t)); }).join(','));
      });
      // BOM برای نمایش صحیح فارسی در Excel
      return '﻿' + lines.join('\r\n');
    },

    downloadCSV: function (list, name) {
      App.utils.download((name || 'checklist-trades') + '-' + stamp() + '.csv', App.exporter.tradesCSV(list), 'text/csv;charset=utf-8');
    },

    downloadBackup: function () {
      App.store.updateSettings({ lastBackupAt: new Date().toISOString() });
      App.utils.download('checklist-backup-' + stamp() + '.json', JSON.stringify(App.store.exportJSON(), null, 2), 'application/json');
    },

    /**
     * پشتیبان خودکار روزانه: اگر فعال باشد، داده‌ای وجود داشته باشد و امروز هنوز
     * پشتیبانی گرفته نشده، فایل JSON دانلود می‌شود. فقط وقتی پنل باز است اجرا می‌شود.
     */
    autoBackupIfDue: function () {
      var st = App.store.settings();
      if (!st.autoBackup) return false;
      if (!App.store.count() && !App.store.accounts().length) return false;
      if (st.lastBackupAt && App.utils.toDateInput(st.lastBackupAt) === stamp()) return false;
      App.exporter.downloadBackup();
      return true;
    }
  };
})(window.App = window.App || {});
