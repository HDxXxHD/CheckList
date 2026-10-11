/**
 * سازنده فرم بر اساس اسکیمای چک‌لیست
 * رندر فیلدها + اتصال رویدادها به شیء draft + اعتبارسنجی
 */
(function (App) {
  'use strict';

  var u = App.utils;

  function attrs(phase, f) {
    return ' data-phase="' + phase + '" data-key="' + f.key + '"';
  }

  function fieldShell(phase, f, inner, extraClass) {
    return '<div class="field ' + (extraClass || '') + (f.col === 1 ? ' field-half' : '') + '" data-field="' + phase + '.' + f.key + '">' +
      '<label class="label">' + u.esc(f.label) + (f.required ? ' <span class="req">*</span>' : '') + '</label>' +
      (f.hint ? '<p class="hint">' + App.icon('info') + u.esc(f.hint) + '</p>' : '') +
      inner +
      '<p class="error-msg" data-error-for="' + phase + '.' + f.key + '"></p>' +
      '</div>';
  }

  var renderers = {
    text: function (phase, f, v) {
      return '<input class="input' + (f.ltr ? ' ltr' : '') + '" type="text" autocomplete="off"' + attrs(phase, f) +
        (f.list ? ' list="dl-' + f.list + '"' : '') +
        ' placeholder="' + u.esc(f.placeholder || '') + '" value="' + u.esc(v) + '"/>';
    },
    number: function (phase, f, v) {
      return '<div class="input-group"><input class="input ltr" type="number" step="any" inputmode="decimal"' + attrs(phase, f) +
        (f.min != null ? ' min="' + f.min + '"' : '') + ' value="' + u.esc(v) + '"/>' +
        (f.suffix ? '<span class="input-addon">' + u.esc(f.suffix) + '</span>' : '') + '</div>';
    },
    datetime: function (phase, f, v) {
      return '<input class="input ltr" type="datetime-local"' + attrs(phase, f) + ' value="' + (v ? u.toLocalInput(v) : '') + '"/>';
    },
    textarea: function (phase, f, v) {
      return '<textarea class="input" rows="3"' + attrs(phase, f) + ' placeholder="' + u.esc(f.placeholder || '') + '">' + u.esc(v) + '</textarea>';
    },
    choice: function (phase, f, v) {
      if (!f.options.length && f.empty) return '<p class="field-empty">' + App.icon('info') + '<span>' + f.empty + '</span></p>';
      return '<div class="chips" role="radiogroup" data-type="choice"' + attrs(phase, f) + '>' +
        f.options.map(function (o) {
          var on = String(v) === String(o.v);
          return '<button type="button" role="radio" aria-checked="' + on + '" class="chip tone-' + (o.tone || 'brand') + (on ? ' is-active' : '') + '" data-value="' + u.esc(o.v) + '">' +
            '<span class="chip-dot"></span>' + u.esc(o.l) + '</button>';
        }).join('') + '</div>';
    },
    duration: function (phase, f, v) {
      var min = v === '' || v == null ? null : +v;
      var d = min == null ? '' : Math.floor(min / 1440);
      var h = min == null ? '' : Math.floor((min % 1440) / 60);
      var m = min == null ? '' : min % 60;
      var part = function (name, val, label) {
        return '<div class="input-group"><input class="input ltr" type="number" min="0" inputmode="numeric" data-part="' + name + '" value="' + val + '"/><span class="input-addon">' + label + '</span></div>';
      };
      return '<div class="duration" data-type="duration"' + attrs(phase, f) + '>' +
        part('d', d === 0 && min != null ? 0 : d, 'روز') + part('h', h, 'ساعت') + part('m', m, 'دقیقه') + '</div>';
    },
    checklist: function (phase, f, v) {
      v = v || [];
      return '<div class="checklist" data-type="checklist"' + attrs(phase, f) + '>' +
        '<div class="checklist-head"><span class="checklist-count"><b data-count>' + u.int(v.length) + '</b> از ' + u.int(f.items.length) + ' مورد تأیید شد</span>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-check-all>' + App.icon('check') + 'انتخاب همه</button></div>' +
        '<div class="progress"><span data-progress style="width:' + (v.length / f.items.length) * 100 + '%"></span></div>' +
        f.items.map(function (it, i) {
          var on = v.indexOf(it.k) !== -1;
          return '<label class="check-row' + (on ? ' is-checked' : '') + '">' +
            '<input type="checkbox" value="' + it.k + '"' + (on ? ' checked' : '') + '/>' +
            '<span class="check-box">' + App.icon('check') + '</span>' +
            '<span class="check-num">' + u.int(i + 1) + '</span>' +
            '<span class="check-label">' + u.esc(it.l) + '</span></label>';
        }).join('') + '</div>';
    }
  };

  App.form = {
    renderField: function (phase, f, value) {
      var r = renderers[f.type] || renderers.text;
      var full = f.type === 'checklist' || f.type === 'textarea' ? ' field-full' : '';
      return fieldShell(phase, f, r(phase, f, value == null ? '' : value), 'field-' + f.type + full);
    },

    renderSection: function (phase, section, data, opts) {
      opts = opts || {};
      return '<section class="card form-section" id="sec-' + section.id + '">' +
        '<div class="card-header"><div class="card-head-icon">' + App.icon(section.icon || 'clipboard') + '</div>' +
        '<div><h3 class="card-title">' + u.esc(section.title) + '</h3>' +
        (section.description ? '<p class="card-sub">' + u.esc(section.description) + '</p>' : '') + '</div>' +
        (opts.badge ? '<span class="badge badge-gray mr-auto">' + u.esc(opts.badge) + '</span>' : '') + '</div>' +
        '<div class="card-body form-grid">' +
        section.fields.map(function (f) { return App.form.renderField(phase, f, data[f.key]); }).join('') +
        '</div></section>';
    },

    datalists: function () {
      var syms = App.store.settings().symbols || [];
      return '<datalist id="dl-symbols">' + syms.map(function (s) { return '<option value="' + u.esc(s) + '">'; }).join('') + '</datalist>';
    },

    /** اتصال رویدادهای فرم به draft */
    bind: function (root, draft, onChange) {
      function set(phase, key, val) {
        draft[phase] = draft[phase] || {};
        draft[phase][key] = val;
        App.form.clearError(root, phase, key);
        if (onChange) onChange(phase, key, val);
      }

      root.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (chip) {
          var g = chip.closest('[data-type="choice"]');
          u.$$('.chip', g).forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-checked', on);
          });
          set(g.dataset.phase, g.dataset.key, chip.dataset.value);
          return;
        }
        var all = e.target.closest('[data-check-all]');
        if (all) {
          var list = all.closest('[data-type="checklist"]');
          var boxes = u.$$('input[type=checkbox]', list);
          var allOn = boxes.every(function (b) { return b.checked; });
          boxes.forEach(function (b) { b.checked = !allOn; });
          syncChecklist(list);
        }
      });

      function syncChecklist(list) {
        var boxes = u.$$('input[type=checkbox]', list);
        var vals = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        boxes.forEach(function (b) { b.closest('.check-row').classList.toggle('is-checked', b.checked); });
        u.$('[data-count]', list).textContent = u.int(vals.length);
        u.$('[data-progress]', list).style.width = (vals.length / boxes.length) * 100 + '%';
        var allBtn = u.$('[data-check-all]', list);
        allBtn.lastChild.textContent = vals.length === boxes.length ? 'برداشتن همه' : 'انتخاب همه';
        set(list.dataset.phase, list.dataset.key, vals);
      }

      function onInput(e) {
        var t = e.target;
        if (t.type === 'checkbox') {
          syncChecklist(t.closest('[data-type="checklist"]'));
          return;
        }
        var dur = t.closest('[data-type="duration"]');
        if (dur) {
          var get = function (p) { var v = u.$('[data-part="' + p + '"]', dur).value; return v === '' ? 0 : Math.max(0, +v); };
          var any = u.$$('input', dur).some(function (i) { return i.value !== ''; });
          set(dur.dataset.phase, dur.dataset.key, any ? get('d') * 1440 + get('h') * 60 + get('m') : '');
          return;
        }
        if (!t.dataset.key) return;
        var val = t.value;
        if (t.type === 'number') val = val === '' ? '' : +val;
        if (t.type === 'datetime-local') val = val ? new Date(val).toISOString() : '';
        if (t.dataset.key === 'symbol') val = val.toUpperCase().trim();
        set(t.dataset.phase, t.dataset.key, val);
      }
      root.addEventListener('input', onInput);
      root.addEventListener('change', function (e) { if (e.target.type === 'checkbox') return; onInput(e); });
    },

    /** اعتبارسنجی فیلدهای اجباری یک یا چند بخش */
    validate: function (phase, sectionIds, data) {
      var errors = [];
      data = data || {};
      sectionIds.forEach(function (sid) {
        App.schema.section(sid).fields.forEach(function (f) {
          if (!f.required) return;
          var v = data[f.key];
          // مقدار سود/زیان برای معامله سر به سر اجباری نیست
          if (phase === 'post' && f.key === 'pnl' && data.result === 'be') return;
          // فیلد انتخابی بدون گزینه (مثلاً هنوز حسابی ثبت نشده) اجباری نیست
          if (f.type === 'choice' && !f.options.length) return;
          if (v === '' || v == null || (Array.isArray(v) && !v.length)) {
            errors.push({ phase: phase, key: f.key, msg: f.type === 'choice' ? 'یک گزینه را انتخاب کنید' : 'این فیلد الزامی است' });
          } else if (f.min != null && +v < f.min) {
            errors.push({ phase: phase, key: f.key, msg: 'مقدار نمی‌تواند منفی باشد' });
          }
        });
      });
      return errors;
    },

    showErrors: function (root, errors) {
      errors.forEach(function (er) {
        var box = u.$('[data-field="' + er.phase + '.' + er.key + '"]', root);
        if (box) box.classList.add('has-error');
        var msg = u.$('[data-error-for="' + er.phase + '.' + er.key + '"]', root);
        if (msg) msg.textContent = er.msg;
      });
      if (errors.length) {
        var first = u.$('[data-field="' + errors[0].phase + '.' + errors[0].key + '"]', root);
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    clearError: function (root, phase, key) {
      var box = u.$('[data-field="' + phase + '.' + key + '"]', root);
      if (box && box.classList.contains('has-error')) {
        box.classList.remove('has-error');
        u.$('.error-msg', box).textContent = '';
      }
    }
  };
})(window.App = window.App || {});
