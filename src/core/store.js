/**
 * مخزن داده: معاملات، حساب‌ها و تنظیمات
 * ساختار هر معامله:
 * { id, createdAt, updatedAt, closedAt, status: 'open'|'closed', sample?: true, pre: {...}, post: {...}|null }
 * ساختار هر حساب:
 * { id, name, broker, initialBalance, createdAt, updatedAt }
 */
(function (App) {
  'use strict';

  var TRADES_KEY = 'checklist.trades.v1';
  var ACCOUNTS_KEY = 'checklist.accounts.v1';
  var SETTINGS_KEY = 'checklist.settings.v1';

  var defaults = {
    symbols: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
    currency: '$',
    theme: 'system',
    lastAccount: '',
    autoBackup: true,   // دانلود خودکار پشتیبان، روزی یک بار
    lastBackupAt: ''
  };

  var trades = App.storage.get(TRADES_KEY, []);
  var accounts = App.storage.get(ACCOUNTS_KEY, []);
  var settings = Object.assign({}, defaults, App.storage.get(SETTINGS_KEY, {}));

  function persist() { App.storage.set(TRADES_KEY, trades); }
  function persistAccounts() { App.storage.set(ACCOUNTS_KEY, accounts); }
  function persistSettings() { App.storage.set(SETTINGS_KEY, settings); }

  /**
   * معامله نمونه: یا علامت sample دارد، یا (برای داده نمونه نسخه‌های قبلی)
   * شناسه‌اش بلندتر از شناسه عادی است، چون به انتهای آن شماره ردیف اضافه می‌شد.
   */
  function isSample(t) {
    return t.sample === true || String(t.id).length > 14;
  }

  function openedAt(t) {
    return new Date((t.pre && t.pre.openedAt) || t.createdAt).getTime();
  }

  App.store = {
    /** همه معاملات به ترتیب جدیدترین */
    all: function () {
      return trades.slice().sort(function (a, b) { return openedAt(b) - openedAt(a); });
    },

    get: function (id) {
      return trades.find(function (t) { return t.id === id; }) || null;
    },

    save: function (trade) {
      var now = new Date().toISOString();
      trade.updatedAt = now;
      if (!trade.id) {
        trade.id = App.utils.uid();
        trade.createdAt = now;
        trades.push(trade);
      } else {
        var i = trades.findIndex(function (t) { return t.id === trade.id; });
        if (i >= 0) trades[i] = trade; else trades.push(trade);
      }
      var sym = trade.pre && trade.pre.symbol;
      if (sym && settings.symbols.indexOf(sym) === -1) settings.symbols.push(sym);
      if (trade.pre && trade.pre.account) settings.lastAccount = trade.pre.account;
      persistSettings();
      persist();
      return trade;
    },

    remove: function (id) {
      trades = trades.filter(function (t) { return t.id !== id; });
      persist();
    },

    addMany: function (list) {
      trades = trades.concat(list);
      persist();
    },

    clear: function () {
      trades = [];
      persist();
    },

    count: function () { return trades.length; },

    sampleCount: function () { return trades.filter(isSample).length; },

    /** حذف فقط معاملات نمونه؛ معاملات واقعی دست نمی‌خورند */
    clearSamples: function () {
      var before = trades.length;
      trades = trades.filter(function (t) { return !isSample(t); });
      persist();
      return before - trades.length;
    },

    /* ---------- حساب‌ها ---------- */
    accounts: function () {
      return accounts.slice().sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    },

    account: function (id) {
      return accounts.find(function (a) { return a.id === id; }) || null;
    },

    saveAccount: function (acc) {
      var now = new Date().toISOString();
      acc.updatedAt = now;
      if (!acc.id) {
        acc.id = App.utils.uid();
        acc.createdAt = now;
        accounts.push(acc);
      } else {
        var i = accounts.findIndex(function (a) { return a.id === acc.id; });
        if (i >= 0) accounts[i] = acc; else accounts.push(acc);
      }
      persistAccounts();
      return acc;
    },

    /** حذف حساب؛ معاملات متصل باقی می‌مانند ولی اتصالشان به حساب برداشته می‌شود */
    removeAccount: function (id) {
      accounts = accounts.filter(function (a) { return a.id !== id; });
      var touched = false;
      trades.forEach(function (t) {
        if (t.pre && t.pre.account === id) { t.pre.account = ''; touched = true; }
      });
      if (settings.lastAccount === id) { settings.lastAccount = ''; persistSettings(); }
      persistAccounts();
      if (touched) persist();
    },

    accountTrades: function (id) {
      return trades.filter(function (t) { return t.pre && t.pre.account === id; });
    },

    settings: function () { return settings; },

    updateSettings: function (patch) {
      Object.assign(settings, patch);
      persistSettings();
    },

    exportJSON: function () {
      return { app: 'checklist', version: 2, exportedAt: new Date().toISOString(), settings: settings, accounts: accounts, trades: trades };
    },

    importJSON: function (data) {
      if (!data || !Array.isArray(data.trades)) throw new Error('فایل پشتیبان معتبر نیست');
      trades = data.trades;
      // پشتیبان‌های نسخه ۱ حساب نداشتند
      accounts = Array.isArray(data.accounts) ? data.accounts : [];
      if (data.settings) settings = Object.assign({}, defaults, data.settings);
      persist();
      persistAccounts();
      persistSettings();
    }
  };
})(window.App = window.App || {});
