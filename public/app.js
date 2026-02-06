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
const sourceFilter = document.getElementById('source-filter');
const searchInput = document.getElementById('search');

const shoppingList = document.getElementById('shopping-list');
const noShopping = document.getElementById('no-shopping');
const noFavorites = document.getElementById('no-favorites');
const addRecipeModal = document.getElementById('add-recipe-modal');
const addRecipeForm = document.getElementById('add-recipe-form');

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

// Emoji map for equipment
const equipmentEmoji = {
  'airfryer': '🍟',
  'wok': '🥘',
  'blender': '🫙',
  'pot': '🍲',
  'pan': '🍳',
  'small pan': '🍳',
  'oven': '♨️'
};

// Source badges
const sourceBadge = {
  'onegai': '🤖 OneGai',
  'user': '📝 Mine',
  'themealdb': '🌐 MealDB'
};

// Helper to get domain from URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

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
  if (sourceFilter.value) params.set('source', sourceFilter.value);

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
      <div class="card-image" ${r.image ? `style="background-image: url('${r.image}'); background-size: cover; background-position: center;"` : ''}>
        ${r.image ? '' : cuisineEmoji[r.cuisine] || '🍽️'}
        <span class="source-badge ${r.source}">${sourceBadge[r.source] || '🍽️'}</span>
        <button class="card-favorite ${r.isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, ${r.id})">
          ${r.isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${r.name}</h3>
        <p class="card-description">${r.description}</p>
        <div class="card-meta">
          <span class="time">⏱️ ${r.duration} min</span>
          <span class="tag cuisine">${r.cuisine}</span>
          ${(r.equipment || []).map(eq => `<span class="tag equipment">${equipmentEmoji[eq] || '🍳'} ${eq}</span>`).join('')}
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
        <span class="tag source-tag ${recipe.source}">${sourceBadge[recipe.source] || '🍽️'}</span>
        ${(recipe.equipment || []).map(e => `<span class="tag equipment">${equipmentEmoji[e] || '🍳'} ${e}</span>`).join('')}
      </div>
      ${recipe.source_url ? `<p class="source-link">Source: <a href="${recipe.source_url}" target="_blank" rel="noopener">${getDomain(recipe.source_url)}</a></p>` : ''}
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
      ${recipe.source === 'user' ? `<button class="btn btn-danger" onclick="deleteRecipe(${recipe.id})">🗑️ Delete</button>` : ''}
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
sourceFilter.addEventListener('change', fetchRecipes);

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchRecipes, 300);
});

// Delete recipe
async function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  
  try {
    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      modal.classList.add('hidden');
      fetchRecipes();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to delete recipe');
    }
  } catch (err) {
    alert('Failed to delete recipe');
  }
}

// Add recipe modal
function openAddRecipeModal() {
  addRecipeForm.reset();
  addRecipeModal.classList.remove('hidden');
}

function closeAddRecipeModal() {
  addRecipeModal.classList.add('hidden');
}

addRecipeModal.addEventListener('click', (e) => {
  if (e.target === addRecipeModal) closeAddRecipeModal();
});

// Submit new recipe
addRecipeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('recipe-name').value;
  const description = document.getElementById('recipe-description').value;
  const cuisine = document.getElementById('recipe-cuisine').value;
  const duration = parseInt(document.getElementById('recipe-duration').value);
  const servings = parseInt(document.getElementById('recipe-servings').value) || 2;
  const source_url = document.getElementById('recipe-source').value;
  
  const equipment = [...document.querySelectorAll('input[name="equipment"]:checked')].map(cb => cb.value);
  const ingredients = document.getElementById('recipe-ingredients').value.split('\n').map(s => s.trim()).filter(s => s);
  const instructions = document.getElementById('recipe-instructions').value.split('\n').map(s => s.trim()).filter(s => s);
  
  if (ingredients.length === 0) {
    alert('Please add at least one ingredient');
    return;
  }
  if (instructions.length === 0) {
    alert('Please add at least one instruction');
    return;
  }
  
  try {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        cuisine,
        duration,
        servings,
        equipment,
        ingredients,
        instructions,
        source_url: source_url || null
      })
    });
    
    if (res.ok) {
      closeAddRecipeModal();
      // Switch to My Recipes tab
      document.querySelector('[data-tab="myrecipes"]').click();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to save recipe');
    }
  } catch (err) {
    alert('Failed to save recipe');
    console.error(err);
  }
});

// Shuffle mode
let shuffleRecipes = [];
let shuffleIndex = 0;
const shuffleOverlay = document.getElementById('shuffle-overlay');
const shuffleCard = document.getElementById('shuffle-card');

function startShuffle() {
  // Use current filtered recipes, shuffle them
  if (recipes.length === 0) {
    alert('No recipes to shuffle!');
    return;
  }
  
  shuffleRecipes = [...recipes].sort(() => Math.random() - 0.5);
  shuffleIndex = 0;
  renderShuffleCard();
  shuffleOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeShuffle() {
  shuffleOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderShuffleCard() {
  if (shuffleIndex >= shuffleRecipes.length) {
    // No more recipes
    closeShuffle();
    alert('No more recipes! Try adjusting your filters.');
    return;
  }
  
  const r = shuffleRecipes[shuffleIndex];
  
  const imageEl = document.getElementById('shuffle-image');
  if (r.image) {
    imageEl.style.backgroundImage = `url('${r.image}')`;
    imageEl.textContent = '';
  } else {
    imageEl.style.backgroundImage = '';
    imageEl.textContent = cuisineEmoji[r.cuisine] || '🍽️';
  }
  
  document.getElementById('shuffle-name').textContent = r.name;
  document.getElementById('shuffle-description').textContent = r.description || '';
  
  // Meta tags including equipment
  const equipmentTags = (r.equipment || []).map(e => 
    `<span class="tag equipment">${equipmentEmoji[e] || '🍳'} ${e}</span>`
  ).join('');
  
  document.getElementById('shuffle-meta').innerHTML = `
    <span class="tag cuisine">${r.cuisine}</span>
    <span class="tag">⏱️ ${r.duration} min</span>
    <span class="tag">👥 ${r.servings} servings</span>
    <span class="tag source-tag ${r.source}">${sourceBadge[r.source] || '🍽️'}</span>
    ${equipmentTags}
  `;
  
  // Ingredients
  document.getElementById('shuffle-ingredients').innerHTML = 
    r.ingredients.map(i => `<li>${i}</li>`).join('');
  
  // Instructions
  document.getElementById('shuffle-instructions').innerHTML = 
    r.instructions.map(s => `<li>${s}</li>`).join('');
  
  // Source
  const sourceEl = document.getElementById('shuffle-source');
  if (r.source_url) {
    sourceEl.innerHTML = `Source: <a href="${r.source_url}" target="_blank" rel="noopener">${getDomain(r.source_url)}</a>`;
    sourceEl.style.display = '';
  } else {
    sourceEl.style.display = 'none';
  }
  
  document.getElementById('shuffle-counter').textContent = `${shuffleIndex + 1} / ${shuffleRecipes.length}`;
  
  // Reset card position and scroll to top
  shuffleCard.classList.remove('swipe-left', 'swipe-right');
  shuffleCard.style.transform = '';
  document.querySelector('.shuffle-container').scrollTop = 0;
}

function shuffleNext() {
  shuffleCard.classList.add('swipe-left');
  setTimeout(() => {
    shuffleIndex++;
    renderShuffleCard();
  }, 300);
}

function shufflePick() {
  const r = shuffleRecipes[shuffleIndex];
  closeShuffle();
  openRecipe(r.id);
}

// Swipe handling
let touchStartX = 0;
let touchCurrentX = 0;
let isDragging = false;

shuffleCard.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  isDragging = true;
  shuffleCard.classList.add('swiping');
});

shuffleCard.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  touchCurrentX = e.touches[0].clientX;
  const diff = touchCurrentX - touchStartX;
  shuffleCard.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
});

shuffleCard.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  shuffleCard.classList.remove('swiping');
  
  const diff = touchCurrentX - touchStartX;
  
  if (diff < -100) {
    // Swiped left - skip
    shuffleNext();
  } else if (diff > 100) {
    // Swiped right - pick
    shuffleCard.classList.add('swipe-right');
    setTimeout(() => shufflePick(), 300);
  } else {
    // Return to center
    shuffleCard.style.transform = '';
  }
  
  touchStartX = 0;
  touchCurrentX = 0;
});

// Mouse drag support
shuffleCard.addEventListener('mousedown', (e) => {
  touchStartX = e.clientX;
  isDragging = true;
  shuffleCard.classList.add('swiping');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  touchCurrentX = e.clientX;
  const diff = touchCurrentX - touchStartX;
  shuffleCard.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  shuffleCard.classList.remove('swiping');
  
  const diff = touchCurrentX - touchStartX;
  
  if (diff < -100) {
    shuffleNext();
  } else if (diff > 100) {
    shuffleCard.classList.add('swipe-right');
    setTimeout(() => shufflePick(), 300);
  } else {
    shuffleCard.style.transform = '';
  }
  
  touchStartX = 0;
  touchCurrentX = 0;
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (shuffleOverlay.classList.contains('hidden')) return;
  
  if (e.key === 'ArrowLeft' || e.key === 'Escape') {
    shuffleNext();
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    shufflePick();
  }
});

// Init
loadCuisines();
fetchRecipes();
