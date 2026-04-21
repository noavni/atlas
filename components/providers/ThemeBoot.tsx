/**
 * Pre-hydration theme boot.
 *
 * Renders a single <script> tag that runs *before* React hydrates. It reads
 * the persisted Zustand state from localStorage and stamps `data-theme` +
 * `dir` on <html> synchronously. Eliminates the light→dark and LTR→RTL
 * flash on first paint.
 *
 * If nothing is stored, it honours `prefers-color-scheme` so the dark-mode
 * user lands on dark.
 */

const SCRIPT = `(() => {
  try {
    var raw = localStorage.getItem('atlas-ui');
    var theme = null;
    var dir = null;
    if (raw) {
      var parsed = JSON.parse(raw);
      theme = parsed && parsed.state && parsed.state.theme;
      dir = parsed && parsed.state && parsed.state.dir;
    }
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (!dir) dir = 'ltr';
    var html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('dir', dir);
  } catch (e) {}
})();`;

export function ThemeBoot() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
