/* StudyAI in-app study reminders. No browser/OS notifications are requested. */
(function () {
  if (window.__studyAIRemindersV1) return;
  window.__studyAIRemindersV1 = true;

  const KEY = 'studyai.reminders.settings.v1';
  const HISTORY_KEY = 'studyai.reminders.history.v1';
  const DEFAULTS = ['07:00', '14:00', '19:00', '21:00'];
  const LABELS = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const MESSAGES = [
    '🌞 Good Morning! Aaj ki padhai shuru karein.',
    '📖 Thoda samay nikaalkar aaj ka revision karein.',
    '🎯 Aaj ka Study Goal poora karein.',
    '🌙 Aaj aapne kya seekha? Quick Revision karein.'
  ];
  const css = `
    #saiReminderLauncher{position:fixed;z-index:99990;right:18px;bottom:94px;border:0;border-radius:999px;padding:11px 15px;background:linear-gradient(110deg,#635bff,#9b55e8,#e84b9c);color:#fff;font:800 12px system-ui;box-shadow:0 8px 22px #635bff40;cursor:pointer}
    #saiReminderPanel{position:fixed;z-index:99999;inset:0;display:none;place-items:center;padding:14px;background:#10142b80;backdrop-filter:blur(5px)}
    #saiReminderPanel.open{display:grid}
    #saiReminderPanel .sai-r-card{width:min(440px,100%);max-height:88vh;overflow:auto;border:1px solid #e9e7fb;border-radius:22px;padding:19px;background:linear-gradient(145deg,#fff,#f8f7ff 70%,#fff4fa);color:#202642;box-shadow:0 25px 80px #11152d40;font:14px/1.5 system-ui}
    #saiReminderPanel h2{margin:0;font-size:21px;color:#29234f}
    #saiReminderPanel p{margin:5px 0 14px;color:#68738a;font-size:12px}
    #saiReminderPanel .sai-r-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #ececf5}
    #saiReminderPanel input[type=time]{border:1px solid #deddf2;border-radius:10px;padding:8px;background:#fff;color:#252747;font:700 14px system-ui}
    #saiReminderPanel input:disabled{opacity:.45}
    #saiReminderPanel button{border:0;border-radius:11px;padding:10px 13px;font:800 12px system-ui;cursor:pointer}
    #saiReminderPanel .sai-r-primary{background:linear-gradient(110deg,#635bff,#a855f7,#ec4899);color:#fff}
    #saiReminderPanel .sai-r-secondary{background:#eeedfa;color:#5147b9}
    #saiReminderPanel .sai-r-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:15px;flex-wrap:wrap}
    #saiReminderToast{position:fixed;z-index:100000;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;pointer-events:none;width:min(420px,calc(100% - 28px));padding:14px 16px;border-radius:16px;background:linear-gradient(110deg,#5148ed,#8955ed,#df4c9d);color:#fff;font:700 13px/1.45 system-ui;box-shadow:0 12px 34px #342b8b55;transition:.22s}
    #saiReminderToast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    #saiReminderPanel .sai-r-history{margin-top:15px;padding-top:10px;border-top:1px solid #ececf5}
    #saiReminderPanel .sai-r-history b{font-size:12px}
    #saiReminderPanel .sai-r-history ul{margin:7px 0 0;padding-left:19px;color:#68738a;font-size:11px}
    @media(max-width:600px){#saiReminderLauncher{right:12px;bottom:84px;padding:10px 12px}#saiReminderPanel .sai-r-card{padding:16px}}
  `;
  const style = document.createElement('style');
  style.id = 'saiReminderStyles';
  style.textContent = css;
  document.head.appendChild(style);

  function readSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!value) return { enabled: true, times: DEFAULTS.slice(), customized: false };
      return {
        enabled: value.enabled !== false,
        times: Array.isArray(value.times) && value.times.length === 4
          ? value.times.map((v, i) => /^([01]\\d|2[0-3]):[0-5]\\d$/.test(v) ? v : DEFAULTS[i])
          : DEFAULTS.slice(),
        customized: value.customized === true
      };
    } catch (_) {
      return { enabled: true, times: DEFAULTS.slice(), customized: false };
    }
  }
  let settings = readSettings();

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').slice(0, 20); }
    catch (_) { return []; }
  }
  function saveHistory(item) {
    const history = [item, ...readHistory()].slice(0, 20);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (_) {}
  }
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
  }

  const launcher = document.createElement('button');
  launcher.id = 'saiReminderLauncher';
  launcher.type = 'button';
  launcher.textContent = '⏰ Study Reminders';
  launcher.setAttribute('aria-haspopup', 'dialog');
  document.body.appendChild(launcher);

  const panel = document.createElement('div');
  panel.id = 'saiReminderPanel';
  panel.innerHTML = '<section class="sai-r-card" role="dialog" aria-modal="true" aria-labelledby="saiReminderTitle"><h2 id="saiReminderTitle">⏰ My Study Reminders</h2><p>Reminders sirf StudyAI app ke andar dikhte hain. App band hone par reminder nahi aayega.</p><div class="sai-r-row"><b>Study reminders</b><input id="saiReminderEnabled" type="checkbox" aria-label="Enable study reminders"></div><div id="saiReminderTimes"></div><div class="sai-r-actions"><button class="sai-r-secondary" id="saiReminderReset" type="button">Restore default times</button><button class="sai-r-primary" id="saiReminderSave" type="button">Save settings</button><button class="sai-r-secondary" id="saiReminderClose" type="button">Close</button></div><div class="sai-r-history"><b>🔔 Saved reminder history</b><ul id="saiReminderHistory"></ul></div></section>';
  document.body.appendChild(panel);
  const toast = document.createElement('div');
  toast.id = 'saiReminderToast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  function renderPanel() {
    panel.querySelector('#saiReminderEnabled').checked = settings.enabled;
    const wrap = panel.querySelector('#saiReminderTimes');
    wrap.replaceChildren();
    settings.times.forEach((time, i) => {
      const row = document.createElement('label');
      row.className = 'sai-r-row';
      const name = document.createElement('b');
      name.textContent = LABELS[i];
      const input = document.createElement('input');
      input.type = 'time';
      input.value = time;
      input.disabled = !settings.enabled;
      input.dataset.index = String(i);
      input.setAttribute('aria-label', LABELS[i] + ' reminder time');
      row.append(name, input);
      wrap.appendChild(row);
    });
    const history = panel.querySelector('#saiReminderHistory');
    history.replaceChildren();
    const items = readHistory();
    if (!items.length) {
      const li = document.createElement('li');
      li.textContent = 'Abhi koi reminder nahi aaya.';
      history.appendChild(li);
    } else {
      items.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.message + ' · ' + item.date;
        history.appendChild(li);
      });
    }
  }

  function openPanel() { renderPanel(); panel.classList.add('open'); }
  function closePanel() { panel.classList.remove('open'); }
  launcher.addEventListener('click', openPanel);
  panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
  panel.querySelector('#saiReminderClose').addEventListener('click', closePanel);
  panel.querySelector('#saiReminderEnabled').addEventListener('change', e => {
    settings.enabled = e.target.checked;
    panel.querySelectorAll('#saiReminderTimes input').forEach(input => input.disabled = !settings.enabled);
  });
  panel.querySelector('#saiReminderReset').addEventListener('click', () => {
    settings.times = DEFAULTS.slice();
    settings.customized = false;
    renderPanel();
  });
  panel.querySelector('#saiReminderSave').addEventListener('click', () => {
    const values = Array.from(panel.querySelectorAll('#saiReminderTimes input')).map((input, i) =>
      /^([01]\\d|2[0-3]):[0-5]\\d$/.test(input.value) ? input.value : DEFAULTS[i]
    );
    settings.times = values;
    settings.enabled = panel.querySelector('#saiReminderEnabled').checked;
    settings.customized = true;
    saveSettings();
    closePanel();
    showToast('✅ Study reminder settings saved.');
  });

  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 9000);
  }

  function checkReminders() {
    if (!settings.enabled || document.visibilityState !== 'visible') return;
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    settings.times.forEach((time, i) => {
      if (time !== hhmm) return;
      const key = 'studyai.reminder.last.' + today + '.' + i;
      try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (_) {}
      saveHistory({ message: MESSAGES[i], date: today + ' ' + time });
      showToast(MESSAGES[i]);
    });
  }
  setInterval(checkReminders, 15000);
  document.addEventListener('visibilitychange', checkReminders);

  // Keep the launcher out of the way while the app's own modal/dialog is open.
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
  window.addEventListener('storage', e => {
    if (e.key === KEY) { settings = readSettings(); }
  });
})();