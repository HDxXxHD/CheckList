/**
 * تولید داده نمونه برای آشنایی با پنل و گزارش‌ها
 */
(function (App) {
  'use strict';

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function chance(p) { return Math.random() < p; }

  App.sampleData = {
    generate: function (count) {
      count = count || 48;
      var schema = App.schema;
      var symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];
      var tfs = ['M15', 'M30', 'H1', 'H4'];
      var macd = schema.field('pre', 'macdFast').options.map(function (o) { return o.v; });
      var fibo = schema.field('pre', 'fiboDist').options.map(function (o) { return o.v; });
      var retrace = schema.field('post', 'fiboRetrace').options.map(function (o) { return o.v; });
      var prePsych = schema.checklistField('pre').items.map(function (i) { return i.k; });
      var postPsych = schema.checklistField('post').items.map(function (i) { return i.k; });
      var now = Date.now();
      var list = [];

      for (var i = 0; i < count; i++) {
        var opened = new Date(now - rand(0.2, 90) * 86400000);
        opened.setSeconds(0, 0);
        var direction = pick(['buy', 'sell']);
        var trend = chance(0.7) ? (direction === 'buy' ? 'up' : 'down') : (direction === 'buy' ? 'down' : 'up');
        var psychPre = prePsych.filter(function () { return chance(0.82); });
        var news = chance(0.8) ? 'yes' : 'no';

        // داده نمونه به هیچ حسابی متصل نمی‌شود تا موجودی حساب‌های واقعی تغییر نکند
        var pre = {
          account: '',
          openedAt: opened.toISOString(),
          symbol: pick(symbols),
          timeframe: pick(tfs),
          htfTrend: trend,
          emaRelation: trend === 'up' ? (chance(0.8) ? 'above' : 'below') : (chance(0.8) ? 'below' : 'above'),
          macdFast: pick(macd),
          macdSlow: pick(macd),
          pricePos: pick(['penetrated', 'between', 'notReached']),
          fiboDist: pick(fibo),
          news: news,
          direction: direction,
          psych: psychPre
        };

        var trade = { id: App.utils.uid() + i, sample: true, createdAt: opened.toISOString(), updatedAt: opened.toISOString(), status: 'open', pre: pre, post: null };

        // چند معامله آخر باز می‌مانند
        if (i >= 3) {
          var aligned = (direction === 'buy') === (trend === 'up');
          var p = 0.3 + (psychPre.length - 4) * 0.05 + (aligned ? 0.15 : 0) + (news === 'yes' ? 0.05 : -0.05);
          var r = Math.random();
          var result = r < p ? 'win' : r < p + 0.08 ? 'be' : 'loss';
          var duration = Math.round(rand(15, 1800));
          var postPsychVals = postPsych.filter(function () { return chance(result === 'win' ? 0.85 : 0.6); });

          trade.post = {
            volume: pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5]),
            result: result,
            pnl: result === 'be' ? 0 : Math.round(result === 'win' ? rand(30, 320) : rand(20, 200)),
            swap: chance(0.3) ? -Math.round(rand(1, 12)) : 0,
            fiboMove: pick(fibo),
            fiboRetrace: pick(retrace),
            pips: result === 'be' ? 0 : Math.round(rand(8, 160)),
            duration: duration,
            note: '',
            psych: postPsychVals
          };
          trade.status = 'closed';
          trade.closedAt = new Date(opened.getTime() + duration * 60000).toISOString();
          trade.updatedAt = trade.closedAt;
        } else {
          // معاملات باز را به روزهای اخیر منتقل کن
          var recent = new Date(now - rand(0.05, 1) * 86400000);
          pre.openedAt = trade.createdAt = trade.updatedAt = recent.toISOString();
        }
        list.push(trade);
      }
      return list;
    }
  };
})(window.App = window.App || {});
