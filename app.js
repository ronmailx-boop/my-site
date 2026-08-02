const GITHUB_USERNAME = 'ronmailx-boop';

const ICON_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const emptyEl = document.getElementById('empty-message');
const retryBtn = document.getElementById('retry-btn');
const grid = document.getElementById('apps-grid');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function colorForRepo(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ICON_COLORS[hash % ICON_COLORS.length];
}

function iconSizeValue(sizes) {
  if (!sizes) return 0;
  const [width] = sizes.split('x').map(Number);
  return width || 0;
}

async function resolveRepoIcon(pagesUrl) {
  try {
    const htmlRes = await fetch(pagesUrl);
    if (!htmlRes.ok) throw new Error('no pages');

    const html = await htmlRes.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const manifestHref = doc.querySelector('link[rel="manifest"]')?.getAttribute('href');
    if (manifestHref) {
      const manifestUrl = new URL(manifestHref, pagesUrl).href;
      const manifestRes = await fetch(manifestUrl);
      if (manifestRes.ok) {
        const manifest = await manifestRes.json();
        const icons = manifest.icons || [];
        const best = [...icons].sort((a, b) => iconSizeValue(b.sizes) - iconSizeValue(a.sizes))[0];
        if (best?.src) return new URL(best.src, manifestUrl).href;
      }
    }

    const appleIconHref = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
    if (appleIconHref) return new URL(appleIconHref, pagesUrl).href;

    const iconHref = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href');
    if (iconHref) return new URL(iconHref, pagesUrl).href;
  } catch (err) {
    // fall through to the favicon.ico guess below
  }

  return `${pagesUrl}favicon.ico`;
}

function renderRepos(repos) {
  grid.innerHTML = '';
  emptyEl.classList.toggle('hidden', repos.length > 0);

  for (const repo of repos) {
    const pagesUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const letter = repo.name.charAt(0).toUpperCase();
    const color = colorForRepo(repo.name);

    const link = document.createElement('a');
    link.href = pagesUrl;
    link.className = 'flex flex-col items-center gap-1.5 min-w-0';

    link.innerHTML = `
      <span class="relative w-16 h-16 rounded-2xl shadow-lg shrink-0 overflow-hidden">
        <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white" style="background:${color}">${escapeHtml(letter)}</span>
        <img class="app-icon absolute inset-0 w-full h-full object-cover bg-white" loading="lazy" onerror="this.remove()">
      </span>
      <span class="text-xs text-center w-full truncate">${escapeHtml(repo.name)}</span>
    `;

    grid.appendChild(link);

    const imgEl = link.querySelector('.app-icon');
    resolveRepoIcon(pagesUrl).then(iconUrl => {
      imgEl.src = iconUrl;
    });
  }
}

async function loadRepos() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  emptyEl.classList.add('hidden');
  grid.innerHTML = '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.status === 403) {
      throw new Error('חריגה ממכסת הבקשות ל-GitHub. נסו שוב בעוד כמה דקות.');
    }
    if (!res.ok) {
      throw new Error('אירעה שגיאה בטעינת הריפואים מ-GitHub. בדקו את החיבור לאינטרנט ונסו שוב.');
    }

    const repos = await res.json();
    const ownRepos = repos.filter(repo => !repo.fork);

    loadingEl.classList.add('hidden');
    renderRepos(ownRepos);
  } catch (err) {
    clearTimeout(timeoutId);
    loadingEl.classList.add('hidden');
    errorText.textContent = err.name === 'AbortError'
      ? 'הבקשה ל-GitHub נמשכה זמן רב מדי. בדקו את החיבור לרשת ונסו שוב.'
      : (err.message || 'אירעה שגיאה בטעינת הריפואים מ-GitHub. בדקו את החיבור לאינטרנט ונסו שוב.');
    errorEl.classList.remove('hidden');
  }
}

retryBtn.addEventListener('click', loadRepos);

loadRepos();
