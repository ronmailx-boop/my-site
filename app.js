const GITHUB_USERNAME = 'ronmailx-boop';

const ICON_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
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

function renderRepos(repos) {
  grid.innerHTML = '';
  emptyEl.classList.toggle('hidden', repos.length > 0);

  for (const repo of repos) {
    const pagesUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const faviconUrl = `${pagesUrl}favicon.ico`;
    const letter = repo.name.charAt(0).toUpperCase();
    const color = colorForRepo(repo.name);

    const link = document.createElement('a');
    link.href = pagesUrl;
    link.className = 'flex flex-col items-center gap-1.5 min-w-0';

    link.innerHTML = `
      <span class="relative w-16 h-16 rounded-2xl shadow-lg shrink-0 overflow-hidden">
        <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white" style="background:${color}">${escapeHtml(letter)}</span>
        <img src="${faviconUrl}" loading="lazy" class="absolute inset-0 w-full h-full object-cover bg-white" onerror="this.remove()">
      </span>
      <span class="text-xs text-center w-full truncate">${escapeHtml(repo.name)}</span>
    `;

    grid.appendChild(link);
  }
}

async function loadRepos() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  emptyEl.classList.add('hidden');
  grid.innerHTML = '';

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error('GitHub API error');

    const repos = await res.json();
    const ownRepos = repos.filter(repo => !repo.fork);

    loadingEl.classList.add('hidden');
    renderRepos(ownRepos);
  } catch (err) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
}

retryBtn.addEventListener('click', loadRepos);

loadRepos();
