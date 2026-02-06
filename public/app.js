// State
let recipes = [];
let currentServings = 2;
let baseServings = 2;

// Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const recipeGrid = document.getElementById('recipe-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');

const cuisineFilter = document.getElementById('cuisine-filter');
const timeFilter = document.getElementById('time-filter');
const equipmentFilter = document.getElementById('equipment-filter');
const searchInput = document.getElementById('search');

const shoppingList = document.getElementById('shopping-list');
const noShopping = document.getElementById('no-shopping');
const noFavorites = document.getElementById('no-favorites');

// Emoji map for cuisines
const cuisineEmoji = {
  'Japanese': '🇯🇵',
  'Chinese': '🇨🇳',
  'Indian': '🇮🇳',
  'Thai': '🇹🇭',
  'Italian': '🇮🇹',
  'Middle Eastern': '🧆',
  'Mexican': '🇲🇽',
  'Korean': '🇰🇷',
  'Asian': '🥢',
  'Mediterranean': '🫒',
  'International': '🌍'
};

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    
    if (tab.dataset.tab === 'favorites') loadFavorites();
    if (tab.dataset.tab === 'shopping') loadShoppingList();
  });
});

// Fetch recipes
async function fetchRecipes() {
  const params = new URLSearchParams();
  if (cuisineFilter.value !== 'all') params.set('cuisine', cuisineFilter.value);
  if (timeFilter.value) params.set('maxDuration', timeFilter.value);
  if (equipmentFilter.value) params.set('equipment', equipmentFilter.value);
  if (searchInput.value) params.set('search', searchInput.value);

  const res = await fetch(`/api/recipes?${params}`);
  recipes = await res.json();
  renderRecipes();
}

// Load cuisines
async function loadCuisines() {
  const res = await fetch('/api/cuisines');
  const cuisines = await res.json();
  cuisines.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `${cuisineEmoji[c] || '🍽️'} ${c}`;
    cuisineFilter.appendChild(opt);
  });
}

// Render recipes
function renderRecipes(container = recipeGrid, data = recipes) {
  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <span class="empty-icon">🔍</span>
        <p>No recipes found. Try different filters!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data.map(r => `
    <div class="recipe-card" data-id="${r.id}">
      <div class="card-image">
        ${cuisineEmoji[r.cuisine] || '🍽️'}
        <button class="card-favorite ${r.isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, ${r.id})">
          ${r.isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${r.name}</h3>
        <p class="card-description">${r.description}</p>
        <div class="card-meta">
          <span>⏱️ ${r.duration} min</span>
          <span class="tag cuisine">${r.cuisine}</span>
          ${r.equipment?.includes('airfryer') ? '<span class="tag">🍟 Airfryer</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-favorite')) {
        openRecipe(parseInt(card.dataset.id));
      }
    });
  });
}

// Toggle favorite
async function toggleFavorite(e, id) {
  e.stopPropagation();
  const res = await fetch(`/api/favorites/${id}`, { method: 'POST' });
  const { isFavorite } = await res.json();
  
  const recipe = recipes.find(r => r.id === id);
  if (recipe) recipe.isFavorite = isFavorite;
  
  // Update button
  const btn = e.target.closest('.card-favorite');
  btn.classList.toggle('active', isFavorite);
  btn.textContent = isFavorite ? '❤️' : '🤍';
}

// Open recipe modal
async function openRecipe(id) {
  const res = await fetch(`/api/recipes/${id}`);
  const recipe = await res.json();
  
  currentServings = recipe.servings;
  baseServings = recipe.servings;

  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>${recipe.name}</h2>
      <p>${recipe.description}</p>
      <div class="modal-meta">
        <span class="tag cuisine">${recipe.cuisine}</span>
        <span class="tag">⏱️ ${recipe.duration} min</span>
        ${recipe.equipment?.map(e => `<span class="tag">${e}</span>`).join('') || ''}
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h3>Servings</h3>
        <div class="servings-control">
          <button class="servings-btn" onclick="adjustServings(-1)">−</button>
          <span class="servings-value" id="servings-display">${currentServings} servings</span>
          <button class="servings-btn" onclick="adjustServings(1)">+</button>
        </div>
      </div>
      <div class="modal-section">
        <h3>Ingredients</h3>
        <ul class="ingredient-list" id="ingredient-list">
          ${recipe.ingredients.map(i => `<li><span>•</span> <span class="ing-text">${i}</span></li>`).join('')}
        </ul>
      </div>
      <div class="modal-section">
        <h3>Instructions</h3>
        <ol class="instruction-list">
          ${recipe.instructions.map((s, i) => `
            <li>
              <span class="step-num">${i + 1}</span>
              <span>${s}</span>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-heart ${recipe.isFavorite ? 'active' : ''}" onclick="toggleFavoriteModal(${recipe.id})">
        ${recipe.isFavorite ? '❤️ Saved' : '🤍 Save'}
      </button>
      <button class="btn btn-primary" onclick="addToShoppingList(${recipe.id})">
        🛒 Add to List
      </button>
    </div>
  `;

  // Store base ingredients for scaling
  window.currentRecipe = recipe;
  
  modal.classList.remove('hidden');
}

// Adjust servings
function adjustServings(delta) {
  currentServings = Math.max(1, currentServings + delta);
  document.getElementById('servings-display').textContent = `${currentServings} servings`;
  updateIngredients();
}

// Update ingredients based on servings
function updateIngredients() {
  const ratio = currentServings / baseServings;
  const list = document.getElementById('ingredient-list');
  
  window.currentRecipe.ingredients.forEach((ing, i) => {
    const li = list.children[i];
    const text = li.querySelector('.ing-text');
    
    // Scale numbers in ingredient
    const scaled = ing.replace(/^([\d.\/]+)/, (match) => {
      try {
        const num = eval(match);
        const newNum = Math.round(num * ratio * 10) / 10;
        return newNum % 1 === 0 ? newNum.toString() : newNum.toFixed(1);
      } catch {
        return match;
      }
    });
    
    text.textContent = scaled;
  });
}

// Toggle favorite from modal
async function toggleFavoriteModal(id) {
  const res = await fetch(`/api/favorites/${id}`, { method: 'POST' });
  const { isFavorite } = await res.json();
  
  const btn = document.querySelector('.modal-actions .btn-heart');
  btn.classList.toggle('active', isFavorite);
  btn.innerHTML = isFavorite ? '❤️ Saved' : '🤍 Save';
  
  // Update in main list
  const recipe = recipes.find(r => r.id === id);
  if (recipe) recipe.isFavorite = isFavorite;
}

// Add to shopping list
async function addToShoppingList(recipeId) {
  const res = await fetch(`/api/shopping-list/from-recipe/${recipeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servings: currentServings })
  });
  
  if (res.ok) {
    const { added } = await res.json();
    alert(`Added ${added} ingredients to your shopping list!`);
  }
}

// Load favorites
async function loadFavorites() {
  const res = await fetch('/api/recipes?favorites=true');
  const favorites = await res.json();
  
  if (favorites.length === 0) {
    favoritesGrid.innerHTML = '';
    noFavorites.classList.remove('hidden');
  } else {
    noFavorites.classList.add('hidden');
    renderRecipes(favoritesGrid, favorites);
  }
}

// Shopping list
async function loadShoppingList() {
  const res = await fetch('/api/shopping-list');
  const items = await res.json();
  
  if (items.length === 0) {
    shoppingList.innerHTML = '';
    noShopping.classList.remove('hidden');
    return;
  }
  
  noShopping.classList.add('hidden');
  
  shoppingList.innerHTML = items.map(item => `
    <li class="shopping-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
      <div class="shopping-checkbox" onclick="toggleItem(${item.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="item-text">
        ${item.ingredient}
      </div>
      <button class="item-delete" onclick="deleteItem(${item.id})">✕</button>
    </li>
  `).join('');
}

async function toggleItem(id) {
  const item = document.querySelector(`.shopping-item[data-id="${id}"]`);
  const isChecked = item.classList.contains('checked');
  
  await fetch(`/api/shopping-list/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked: !isChecked })
  });
  
  item.classList.toggle('checked');
}

async function deleteItem(id) {
  await fetch(`/api/shopping-list/${id}`, { method: 'DELETE' });
  loadShoppingList();
}

document.getElementById('clear-checked').addEventListener('click', async () => {
  await fetch('/api/shopping-list?checked=true', { method: 'DELETE' });
  loadShoppingList();
});

document.getElementById('clear-all').addEventListener('click', async () => {
  if (confirm('Clear entire shopping list?')) {
    await fetch('/api/shopping-list', { method: 'DELETE' });
    loadShoppingList();
  }
});

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

// Filters
cuisineFilter.addEventListener('change', fetchRecipes);
timeFilter.addEventListener('change', fetchRecipes);
equipmentFilter.addEventListener('change', fetchRecipes);

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchRecipes, 300);
});

// Init
loadCuisines();
fetchRecipes();
