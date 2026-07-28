const STORAGE_KEY = 'shopping-list-items';

const addForm = document.getElementById('add-form');
const nameInput = document.getElementById('name-input');
const quantityInput = document.getElementById('quantity-input');
const list = document.getElementById('list');
const emptyMessage = document.getElementById('empty-message');
const clearPurchasedBtn = document.getElementById('clear-purchased-btn');

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let items = loadItems();

function saveAndRender() {
  saveItems(items);
  render();
}

function render() {
  list.innerHTML = '';

  const sorted = [...items].sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
    return a.createdAt - b.createdAt;
  });

  emptyMessage.classList.toggle('hidden', items.length > 0);
  clearPurchasedBtn.classList.toggle('hidden', !items.some(item => item.purchased));

  for (const item of sorted) {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-2 rounded-lg bg-white shadow-sm px-3 py-3';

    li.innerHTML = `
      <button data-action="toggle" data-id="${item.id}"
        class="w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center ${item.purchased ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}">
        ${item.purchased ? '✓' : ''}
      </button>
      <span class="flex-1 min-w-0 truncate text-base ${item.purchased ? 'line-through text-gray-400' : ''}">
        ${escapeHtml(item.name)}
      </span>
      <span class="shrink-0 text-sm text-gray-500">x${item.quantity}</span>
      <button data-action="delete" data-id="${item.id}"
        class="shrink-0 w-8 h-8 flex items-center justify-center text-red-500 active:text-red-700">
        🗑
      </button>
    `;

    list.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const quantity = Math.max(1, parseInt(quantityInput.value, 10) || 1);
  if (!name) return;

  items.push({
    id: crypto.randomUUID(),
    name,
    quantity,
    purchased: false,
    createdAt: Date.now(),
  });

  saveAndRender();

  nameInput.value = '';
  quantityInput.value = '1';
  nameInput.focus();
});

list.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === 'toggle') {
    const item = items.find(i => i.id === id);
    if (item) item.purchased = !item.purchased;
  } else if (action === 'delete') {
    items = items.filter(i => i.id !== id);
  }

  saveAndRender();
});

clearPurchasedBtn.addEventListener('click', () => {
  items = items.filter(item => !item.purchased);
  saveAndRender();
});

render();
