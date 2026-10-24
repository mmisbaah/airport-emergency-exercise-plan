/* Independent of exercise records and the planning dashboard theme. */
(function () {
  'use strict';
  var key = 'nr-ttx-theme';
  var theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (_) {}
  function apply(value) {
    theme = value === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-ttx-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#e8edf3' : '#111c27';
    var button = document.getElementById('ttxThemeToggle');
    if (button) {
      button.textContent = theme === 'light' ? 'Dark theme' : 'Light theme';
      button.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
      button.title = 'Current theme: ' + theme;
    }
  }
  apply(theme);
  document.addEventListener('DOMContentLoaded', function () {
    apply(theme);
    var button = document.getElementById('ttxThemeToggle');
    if (button) button.addEventListener('click', function () {
      apply(theme === 'light' ? 'dark' : 'light');
      try { localStorage.setItem(key, theme); } catch (_) {}
    });
  });
  window.addEventListener('storage', function (event) {
    if (event.key === key) apply(event.newValue);
  });
})();
