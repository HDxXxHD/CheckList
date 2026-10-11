/**
 * تعریف چک‌لیست (منبع واحد حقیقت)
 * ----------------------------------
 * تمام آیتم‌های فایل «check_list_details.docx» در این فایل تعریف شده‌اند.
 * فرم ثبت، صفحه جزئیات، خروجی Excel و گزارش‌ها همگی از روی همین تعریف ساخته می‌شوند؛
 * بنابراین برای افزودن/ویرایش یک آیتم چک‌لیست فقط کافی است همین فایل را تغییر دهید.
 *
 * انواع فیلد: text | number | datetime | textarea | choice | duration | checklist
 */
(function (App) {
  'use strict';

  var MACD_OPTIONS = [
    { v: 'above0_aboveSig', l: 'بالای خط صفر · بالای خط سیگنال', tone: 'success' },
    { v: 'above0_belowSig', l: 'بالای خط صفر · پایین خط سیگنال', tone: 'warning' },
    { v: 'below0_belowSig', l: 'پایین خط صفر · پایین خط سیگنال', tone: 'error' },
    { v: 'below0_aboveSig', l: 'پایین خط صفر · بالای خط سیگنال', tone: 'warning' }
  ];

  var FIBO_OPTIONS = ['0', '100', '150', '200', '250', '400'].map(function (v) { return { v: v, l: v }; });

  var TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'].map(function (v) { return { v: v, l: v }; });

  var phases = {
    /* ================= قبل از ورود به معامله ================= */
    pre: {
      key: 'pre',
      title: 'قبل از ورود به معامله',
      sections: [
        {
          id: 'pre-market',
          title: 'بررسی قیمتی بازار',
          description: 'تحلیل تکنیکال پیش از ورود به معامله',
          icon: 'chart',
          fields: [
            {
              key: 'account', label: 'حساب معاملاتی', type: 'choice', required: true,
              // گزینه‌ها از حساب‌های ثبت‌شده در صفحه «حساب‌ها» ساخته می‌شوند
              get options() {
                return App.store ? App.store.accounts().map(function (a) { return { v: a.id, l: a.name + ' · ' + a.broker }; }) : [];
              },
              empty: 'هنوز حسابی ثبت نشده است. <a href="#/accounts">ثبت حساب</a>'
            },
            { key: 'openedAt', label: 'تاریخ و زمان ورود', type: 'datetime', required: true, col: 1 },
            { key: 'symbol', label: 'ارز معامله', type: 'text', required: true, list: 'symbols', placeholder: 'مثلاً XAUUSD', ltr: true, col: 1 },
            { key: 'timeframe', label: 'تایم‌فریم تحلیل', type: 'choice', required: true, options: TIMEFRAMES },
            {
              key: 'htfTrend', label: 'روند یک تایم‌فریم بالاتر از تایم‌فریم تحلیل', type: 'choice', required: true,
              hint: 'قیمت بالای EMA240 صعودی و زیر EMA240 نزولی می‌باشد',
              options: [{ v: 'up', l: 'صعودی', tone: 'success' }, { v: 'down', l: 'نزولی', tone: 'error' }]
            },
            {
              key: 'emaRelation', label: 'موقعیت قیمت و EMA60 نسبت به EMA240', type: 'choice', required: true,
              options: [{ v: 'above', l: 'بالای EMA240', tone: 'success' }, { v: 'below', l: 'پایین EMA240', tone: 'error' }]
            },
            {
              key: 'macdFast', label: 'MACD 12.26.9', type: 'choice', required: true,
              hint: 'موقعیت ستون‌های MACD نسبت به خط سیگنال و خط صفر',
              options: MACD_OPTIONS
            },
            {
              key: 'macdSlow', label: 'MACD 48.104.36', type: 'choice', required: true,
              hint: 'موقعیت ستون‌های MACD نسبت به خط سیگنال و خط صفر (جداگانه بررسی شود)',
              options: MACD_OPTIONS
            },
            {
              key: 'pricePos', label: 'موقعیت قیمت نسبت به EMA60 و EMA240', type: 'choice', required: true,
              options: [
                { v: 'penetrated', l: 'نفوذ به EMA240' },
                { v: 'between', l: 'بین EMA240 و EMA60' },
                { v: 'notReached', l: 'نرسیده به EMA60' }
              ]
            },
            {
              key: 'fiboDist', label: 'فاصله فیبوناچی قیمت با آخرین Low یا High', type: 'choice', required: true,
              options: FIBO_OPTIONS
            },
            {
              key: 'news', label: 'چک کردن خبر', type: 'choice', required: true,
              options: [{ v: 'yes', l: 'بله', tone: 'success' }, { v: 'no', l: 'خیر', tone: 'error' }]
            },
            {
              key: 'direction', label: 'خرید یا فروش', type: 'choice', required: true,
              options: [{ v: 'buy', l: 'خرید (Buy)', tone: 'success' }, { v: 'sell', l: 'فروش (Sell)', tone: 'error' }]
            }
          ]
        },
        {
          id: 'pre-psych',
          title: 'بررسی روانشناسی بازار',
          description: 'پیش از ورود، صادقانه وضعیت ذهنی خود را تأیید کنید',
          icon: 'smile',
          fields: [
            {
              key: 'psych', label: 'چک‌لیست روانشناسی قبل از ورود', type: 'checklist',
              items: [
                { k: 'calm', l: 'آرام و متعادل هستم' },
                { k: 'noFomo', l: 'ترس از جا ماندن ندارم' },
                { k: 'noRevenge', l: 'دنبال جبران ضرر نیستم' },
                { k: 'notForced', l: 'از روی اجبار وارد نمی‌شوم' },
                { k: 'noGreed', l: 'طمع ندارم' },
                { k: 'acceptLoss', l: 'ضرر احتمالی را پذیرفته‌ام' },
                { k: 'focused', l: 'تمرکز کامل دارم' }
              ]
            }
          ]
        }
      ]
    },

    /* ================= بعد از خروج از معامله ================= */
    post: {
      key: 'post',
      title: 'بعد از خروج از معامله',
      sections: [
        {
          id: 'post-market',
          title: 'بررسی قیمتی بازار',
          description: 'نتیجه و مشخصات معامله پس از خروج',
          icon: 'wallet',
          fields: [
            { key: 'volume', label: 'حجم معامله', type: 'number', required: true, suffix: 'لات', min: 0, col: 1 },
            {
              key: 'result', label: 'سود، زیان یا سر به سر', type: 'choice', required: true,
              options: [
                { v: 'win', l: 'سود', tone: 'success' },
                { v: 'loss', l: 'زیان', tone: 'error' },
                { v: 'be', l: 'سر به سر', tone: 'gray' }
              ]
            },
            {
              key: 'pnl', label: 'مقدار سود و زیان', type: 'number', required: true, suffix: '$', min: 0, col: 1,
              hint: 'به صورت عدد مثبت وارد شود؛ علامت از روی نتیجه معامله تعیین می‌شود'
            },
            { key: 'swap', label: 'مقدار سوآپ', type: 'number', default: 0, suffix: '$', col: 1, hint: 'پیش‌فرض ۰ — هزینه سوآپ را با علامت منفی وارد کنید' },
            { key: 'fiboMove', label: 'مقدار حرکت قیمت (فیبوناچی)', type: 'choice', required: true, options: FIBO_OPTIONS },
            {
              key: 'fiboRetrace', label: 'بررسی بازگشت اصلاح فیبوناچی', type: 'choice', required: true,
              options: [
                { v: 'below50', l: 'پایین ۵۰ درصد' },
                { v: 'at50', l: '۵۰ درصد' },
                { v: 'above50', l: 'بالای ۵۰ درصد' }
              ]
            },
            { key: 'pips', label: 'مقدار حرکت قیمت (پیپ)', type: 'number', required: true, suffix: 'پیپ', min: 0, col: 1 },
            { key: 'duration', label: 'مدت زمان فعال بودن معامله', type: 'duration', required: true, col: 1 },
            { key: 'note', label: 'یادداشت / درس‌های این معامله', type: 'textarea', placeholder: 'اختیاری' }
          ]
        },
        {
          id: 'post-psych',
          title: 'بررسی روانشناسی بازار',
          description: 'ارزیابی انضباط شخصی پس از خروج از معامله',
          icon: 'smile',
          fields: [
            {
              key: 'psych', label: 'چک‌لیست روانشناسی بعد از خروج', type: 'checklist',
              items: [
                { k: 'waitedConfirm', l: 'برای تأیید کامل صبر کردم' },
                { k: 'followedRules', l: 'تمام قوانین سیستم رعایت شده' },
                { k: 'noRuleBreak', l: 'قانون‌شکنی نکردم' },
                { k: 'noEmotion', l: 'احساسات روی تصمیم‌ها اثر نگذاشت' },
                { k: 'noFearExit', l: 'از ترس خارج نشدم' },
                { k: 'noGreedSlTp', l: 'حد ضرر و سود را از روی طمع تغییر ندادم' },
                { k: 'noFomoDecision', l: 'از ترس جا ماندن تصمیم نگرفتم' },
                { k: 'noRevengeTrade', l: 'معامله انتقامی انجام ندادم' }
              ]
            }
          ]
        }
      ]
    }
  };

  var schema = {
    phases: phases,

    sections: function (phase) {
      return phases[phase].sections;
    },

    section: function (id) {
      var all = phases.pre.sections.concat(phases.post.sections);
      return all.find(function (s) { return s.id === id; });
    },

    fields: function (phase) {
      return phases[phase].sections.reduce(function (acc, s) { return acc.concat(s.fields); }, []);
    },

    field: function (phase, key) {
      return schema.fields(phase).find(function (f) { return f.key === key; });
    },

    checklistField: function (phase) {
      return schema.fields(phase).find(function (f) { return f.type === 'checklist'; });
    },

    choiceFields: function (phase) {
      return schema.fields(phase).filter(function (f) { return f.type === 'choice'; });
    },

    option: function (field, value) {
      return (field.options || []).find(function (o) { return o.v === value; });
    },

    optionLabel: function (phase, key, value) {
      var f = schema.field(phase, key);
      var o = f && schema.option(f, value);
      return o ? o.l : (value == null || value === '' ? '—' : value);
    },

    /** متن قابل نمایش برای هر مقدار فیلد */
    display: function (field, value) {
      var u = App.utils;
      if (value == null || value === '') return '—';
      switch (field.type) {
        case 'choice': {
          var o = schema.option(field, value);
          return o ? o.l : value;
        }
        case 'datetime': return u.dateTime(value);
        case 'duration': return u.duration(value);
        case 'number': return u.num(value) + (field.suffix ? ' ' + field.suffix : '');
        case 'checklist': return u.int((value || []).length) + ' از ' + u.int(field.items.length);
        default: return String(value);
      }
    },

    /** مقادیر پیش‌فرض یک مرحله */
    defaults: function (phase) {
      var out = {};
      schema.fields(phase).forEach(function (f) {
        if (f.type === 'checklist') out[f.key] = [];
        else if (f.type === 'datetime') out[f.key] = new Date().toISOString();
        else if (f.default !== undefined) out[f.key] = f.default;
        else out[f.key] = '';
      });
      return out;
    }
  };

  App.schema = schema;
})(window.App = window.App || {});
