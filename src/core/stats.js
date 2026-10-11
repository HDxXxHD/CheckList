/**
 * محاسبات آماری و تحلیلی برای داشبورد و گزارش‌ها
 */
(function (App) {
  'use strict';

  var S = {
    isClosed: function (t) {
      return t.status === 'closed' && !!t.post;
    },

    sign: function (t) {
      var r = t.post && t.post.result;
      return r === 'win' ? 1 : r === 'loss' ? -1 : 0;
    },

    /** سود/زیان خالص (با احتساب سوآپ) */
    pnl: function (t) {
      if (!S.isClosed(t)) return 0;
      return Math.abs(+t.post.pnl || 0) * S.sign(t) + (+t.post.swap || 0);
    },

    pips: function (t) {
      if (!S.isClosed(t)) return 0;
      return Math.abs(+t.post.pips || 0) * S.sign(t);
    },

    openedAt: function (t) {
      return new Date((t.pre && t.pre.openedAt) || t.createdAt);
    },

    closedAt: function (t) {
      return new Date(t.closedAt || t.updatedAt || t.createdAt);
    },

    /** درصد تیک‌خورده چک‌لیست روانشناسی یک مرحله */
    psychScore: function (t, phase) {
      var f = App.schema.checklistField(phase);
      var data = t[phase];
      if (!f || !data) return null;
      var vals = data[f.key] || [];
      return (vals.length / f.items.length) * 100;
    },

    /** هم‌جهتی جهت معامله با روند تایم‌فریم بالاتر */
    aligned: function (t) {
      var p = t.pre || {};
      if (!p.direction || !p.htfTrend) return null;
      return (p.direction === 'buy' && p.htfTrend === 'up') || (p.direction === 'sell' && p.htfTrend === 'down');
    },

    avg: function (arr) {
      var a = arr.filter(function (v) { return v != null && !isNaN(v); });
      return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null;
    },

    summary: function (list) {
      var closed = list.filter(S.isClosed);
      var wins = closed.filter(function (t) { return t.post.result === 'win'; });
      var losses = closed.filter(function (t) { return t.post.result === 'loss'; });
      var grossWin = wins.reduce(function (s, t) { return s + S.pnl(t); }, 0);
      var grossLoss = Math.abs(losses.reduce(function (s, t) { return s + S.pnl(t); }, 0));
      var net = closed.reduce(function (s, t) { return s + S.pnl(t); }, 0);

      return {
        total: list.length,
        open: list.length - closed.length,
        closed: closed.length,
        wins: wins.length,
        losses: losses.length,
        be: closed.length - wins.length - losses.length,
        winRate: closed.length ? (wins.length / closed.length) * 100 : null,
        net: net,
        grossWin: grossWin,
        grossLoss: grossLoss,
        profitFactor: grossLoss ? grossWin / grossLoss : (grossWin ? Infinity : null),
        avgWin: wins.length ? grossWin / wins.length : null,
        avgLoss: losses.length ? grossLoss / losses.length : null,
        expectancy: closed.length ? net / closed.length : null,
        pips: closed.reduce(function (s, t) { return s + S.pips(t); }, 0),
        volume: closed.reduce(function (s, t) { return s + (+t.post.volume || 0); }, 0),
        avgDuration: S.avg(closed.map(function (t) { return +t.post.duration; })),
        psychPre: S.avg(list.map(function (t) { return S.psychScore(t, 'pre'); })),
        psychPost: S.avg(closed.map(function (t) { return S.psychScore(t, 'post'); })),
        maxDrawdown: S.maxDrawdown(closed)
      };
    },

    /** منحنی سود/زیان تجمعی */
    cumulative: function (list) {
      var closed = list.filter(S.isClosed).sort(function (a, b) { return S.closedAt(a) - S.closedAt(b); });
      var acc = 0;
      return closed.map(function (t) {
        acc += S.pnl(t);
        return { date: S.closedAt(t), value: acc, trade: t };
      });
    },

    maxDrawdown: function (closed) {
      var peak = 0, acc = 0, dd = 0;
      closed.slice().sort(function (a, b) { return S.closedAt(a) - S.closedAt(b); }).forEach(function (t) {
        acc += S.pnl(t);
        peak = Math.max(peak, acc);
        dd = Math.max(dd, peak - acc);
      });
      return dd;
    },

    /** گروه‌بندی معاملات بسته‌شده بر اساس یک کلید دلخواه */
    group: function (list, keyFn, buckets) {
      var map = {};
      (buckets || []).forEach(function (b) { map[b.key] = { key: b.key, label: b.label, tone: b.tone, items: [] }; });
      list.filter(S.isClosed).forEach(function (t) {
        var k = keyFn(t);
        if (k == null || k === '') return;
        if (!map[k]) map[k] = { key: k, label: k, items: [] };
        map[k].items.push(t);
      });
      return Object.keys(map).map(function (k) {
        var g = map[k], s = S.summary(g.items);
        return { key: g.key, label: g.label, tone: g.tone, count: s.closed, wins: s.wins, losses: s.losses, winRate: s.winRate, net: s.net };
      });
    },

    /** عملکرد بر اساس گزینه‌های یک فیلد انتخابی چک‌لیست */
    byField: function (list, phase, field) {
      return S.group(list, function (t) { return t[phase] && t[phase][field.key]; },
        field.options.map(function (o) { return { key: o.v, label: o.l, tone: o.tone }; }));
    },

    /** اثر رعایت هر آیتم روانشناسی بر نتیجه معاملات */
    psychImpact: function (list, phase) {
      var f = App.schema.checklistField(phase);
      var closed = list.filter(function (t) { return S.isClosed(t) && t[phase]; });
      return f.items.map(function (item) {
        var yes = closed.filter(function (t) { return (t[phase][f.key] || []).indexOf(item.k) !== -1; });
        var no = closed.filter(function (t) { return (t[phase][f.key] || []).indexOf(item.k) === -1; });
        var ys = S.summary(yes), ns = S.summary(no);
        return {
          key: item.k,
          label: item.l,
          compliance: closed.length ? (yes.length / closed.length) * 100 : null,
          winRateYes: ys.winRate,
          winRateNo: ns.winRate,
          netYes: ys.net,
          netNo: ns.net,
          countYes: yes.length,
          countNo: no.length
        };
      });
    },

    /** فیلتر بر اساس بازه زمانی، نماد، جهت و ... */
    filter: function (list, f) {
      f = f || {};
      var from = f.from ? new Date(f.from + 'T00:00:00') : null;
      var to = f.to ? new Date(f.to + 'T23:59:59') : null;
      var q = (f.q || '').trim().toLowerCase();
      return list.filter(function (t) {
        var d = S.openedAt(t), p = t.pre || {};
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (f.account && p.account !== f.account) return false;
        if (f.symbol && p.symbol !== f.symbol) return false;
        if (f.direction && p.direction !== f.direction) return false;
        if (f.timeframe && p.timeframe !== f.timeframe) return false;
        if (f.status && t.status !== f.status) return false;
        if (f.result && !(t.post && t.post.result === f.result)) return false;
        if (q && String(p.symbol || '').toLowerCase().indexOf(q) === -1 &&
          String((t.post && t.post.note) || '').toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
    },

    /** وضعیت یک حساب: موجودی فعلی = مبلغ اولیه + سود/زیان خالص معاملات بسته‌شده آن */
    account: function (acc, list) {
      var s = S.summary(list.filter(function (t) { return t.pre && t.pre.account === acc.id; }));
      var initial = +acc.initialBalance || 0;
      return {
        initial: initial,
        net: s.net,
        balance: initial + s.net,
        growth: initial ? (s.net / initial) * 100 : null,
        total: s.total,
        open: s.open,
        closed: s.closed,
        winRate: s.winRate,
        maxDrawdown: s.maxDrawdown
      };
    },

    symbols: function (list) {
      var set = {};
      list.forEach(function (t) { if (t.pre && t.pre.symbol) set[t.pre.symbol] = 1; });
      return Object.keys(set).sort();
    }
  };

  App.stats = S;
})(window.App = window.App || {});
