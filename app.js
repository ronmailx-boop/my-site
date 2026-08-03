const GITHUB_USERNAME = 'ronmailx-boop';
const SELF_REPO = 'my-site';

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
const list = document.getElementById('apps-list');
const viewToggleBtn = document.getElementById('view-toggle');

let currentRepos = [];
let viewMode = 'grid';
let listRendered = false;

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

function stripMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .trim();
}

function extractFirstParagraph(markdown) {
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '' || /^#{1,6}\s/.test(line) || /^!?\[!?\[/.test(line) || /^!\[/.test(line)) {
      i++;
      continue;
    }
    break;
  }

  const paragraphLines = [];
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '' || /^#{1,6}\s/.test(line)) break;
    paragraphLines.push(line);
    i++;
  }

  return stripMarkdown(paragraphLines.join(' '));
}

async function resolveRepoDescription(repo) {
  try {
    const branch = repo.default_branch || 'main';
    const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${branch}/README.md`);
    if (!res.ok) return '';
    return extractFirstParagraph(await res.text());
  } catch (err) {
    return '';
  }
}

function renderReposList(repos) {
  list.innerHTML = '';

  for (const repo of repos) {
    const pagesUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const letter = repo.name.charAt(0).toUpperCase();
    const color = colorForRepo(repo.name);

    const link = document.createElement('a');
    link.href = pagesUrl;
    link.className = 'flex items-start gap-3';

    link.innerHTML = `
      <span class="relative w-14 h-14 rounded-2xl shadow-lg shrink-0 overflow-hidden">
        <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-white" style="background:${color}">${escapeHtml(letter)}</span>
        <img class="app-icon absolute inset-0 w-full h-full object-cover bg-white" loading="lazy" onerror="this.remove()">
      </span>
      <span class="min-w-0 pt-1">
        <span class="block font-bold">${escapeHtml(repo.name)}</span>
        <span class="app-description block text-sm text-gray-400 mt-0.5"></span>
      </span>
    `;

    list.appendChild(link);

    const imgEl = link.querySelector('.app-icon');
    resolveRepoIcon(pagesUrl).then(iconUrl => {
      imgEl.src = iconUrl;
    });

    const descEl = link.querySelector('.app-description');
    resolveRepoDescription(repo).then(description => {
      if (description) descEl.textContent = description;
    });
  }
}

function setViewMode(mode) {
  viewMode = mode;
  grid.classList.toggle('hidden', mode !== 'grid');
  list.classList.toggle('hidden', mode !== 'list');
  viewToggleBtn.textContent = mode === 'grid' ? 'תצוגת רשימה' : 'תצוגת סמלים';

  if (mode === 'list' && !listRendered) {
    listRendered = true;
    renderReposList(currentRepos);
  }
}

viewToggleBtn.addEventListener('click', () => {
  setViewMode(viewMode === 'grid' ? 'list' : 'grid');
});

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
    const ownRepos = repos.filter(repo => !repo.fork && repo.name !== SELF_REPO);

    currentRepos = ownRepos;
    listRendered = false;
    loadingEl.classList.add('hidden');
    viewToggleBtn.classList.toggle('hidden', ownRepos.length === 0);
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
