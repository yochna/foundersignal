/**
 * Theme registry. Kept framework-free so both the server layout and the client
 * switcher import the same list.
 *
 * Adding one means adding a matching [data-theme='id'] block in app/globals.css
 * with the full variable set; the id here is what lands on <html data-theme>.
 * `mode` only drives grouping in the switcher.
 */
export const THEMES = [
  {
    id: 'glacier',
    name: 'Glacier',
    tagline: 'Dark glass',
    mode: 'dark',
    description: 'Deep navy glassmorphism with an ice-blue accent.',
    swatch: ['#070b14', '#7dd3fc', '#c8a0f0'],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    tagline: 'Violet haze',
    mode: 'dark',
    description: 'Violet and cyan on deep space purple, heaviest glass of the set.',
    swatch: ['#0c0818', '#a78bfa', '#22d3ee'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    tagline: 'Warm dusk',
    mode: 'dark',
    description: 'Plum background lit by orange and pink, easy on late nights.',
    swatch: ['#180c14', '#fb923c', '#f472b6'],
  },
  {
    id: 'carbon',
    name: 'Carbon',
    tagline: 'Terminal',
    mode: 'dark',
    description: 'Near-black monospace headlines, square corners, amber accent.',
    swatch: ['#0a0a0a', '#f59e0b', '#10b981'],
  },
  {
    id: 'sahara',
    name: 'Sahara',
    tagline: 'Warm linen',
    mode: 'light',
    description: 'Paper-warm editorial light theme with a serif headline face.',
    swatch: ['#faf5ee', '#c2652a', '#8c3c3c'],
  },
  {
    id: 'bento',
    name: 'Bento',
    tagline: 'Slate grid',
    mode: 'light',
    description: 'High-density neutral slate for reading dense tables.',
    swatch: ['#f6f8fb', '#0f172a', '#0ea5e9'],
  },
  {
    id: 'matcha',
    name: 'Matcha',
    tagline: 'Soft sage',
    mode: 'light',
    description: 'Calm sage green on warm paper, low contrast for long sessions.',
    swatch: ['#f4f7f0', '#168054', '#b4781e'],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    tagline: 'Glow light',
    mode: 'light',
    description: 'Soft indigo and pink gradients with rounded geometry.',
    swatch: ['#fdfafd', '#6366f1', '#db2777'],
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEFAULT_THEME = 'sahara';
export const THEME_COOKIE = 'foundersignal-theme';

export function normalizeTheme(value) {
  return THEME_IDS.includes(value) ? value : DEFAULT_THEME;
}

/**
 * Inline script injected before paint. Reconciles the cookie the server used
 * with localStorage, so a theme chosen on another tab still applies on first
 * render without a flash.
 */
export const themeBootstrapScript = `
(function(){
  try {
    var ids = ${JSON.stringify(THEME_IDS)};
    var name = '${THEME_COOKIE}';
    var stored = null;
    try { stored = window.localStorage.getItem(name); } catch (e) {}
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    var cookie = match ? decodeURIComponent(match[1]) : null;
    var theme = ids.indexOf(stored) > -1 ? stored : (ids.indexOf(cookie) > -1 ? cookie : '${DEFAULT_THEME}');
    document.documentElement.setAttribute('data-theme', theme);
    if (stored !== theme) { try { window.localStorage.setItem(name, theme); } catch (e) {} }
    if (cookie !== theme) {
      document.cookie = name + '=' + theme + '; path=/; max-age=31536000; samesite=lax';
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
  }
})();
`;
