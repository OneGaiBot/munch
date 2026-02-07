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
  // Shuffle recipes for variety
  recipes.sort(() => Math.random() - 0.5);
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

  container.innerHTML = data.map(r => {
    // Use highlight_image or fallback to old image field
    const displayImage = r.highlight_image || r.image;
    
    return `
    <div class="recipe-card" data-id="${r.id}">
      <div class="card-image ${displayImage ? 'has-image' : ''}" data-image="${displayImage || ''}" data-cuisine="${r.cuisine}">
        ${!displayImage ? cuisineEmoji[r.cuisine] || '🍽️' : ''}
        ${displayImage ? `<img data-src="${displayImage}" alt="${r.name}" loading="lazy">` : ''}
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
    `;
  }).join('');

  // Add click handlers and lazy loading
  container.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-favorite')) {
        openRecipe(parseInt(card.dataset.id));
      }
    });
  });

  // Setup lazy loading for images
  setupLazyLoading(container);
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
  // Show loading state
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
      <div style="text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🍳</div>
        <div>Loading recipe...</div>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');

  try {
    const res = await fetch(`/api/recipes/${id}`);
    if (!res.ok) throw new Error('Failed to load recipe');
    
    const recipe = await res.json();
    
    currentServings = recipe.servings;
    baseServings = recipe.servings;

    modalBody.innerHTML = `
    <div class="recipe-header">
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
    
    <div class="recipe-content">
      ${recipe.images && recipe.images.length > 0 ? `
        <div class="modal-section">
          <h3>Images</h3>
          <div class="recipe-images-grid">
            ${recipe.images.map(img => `
              <div class="recipe-image-item" onclick="openImageModal('${img}')">
                <img src="${img}" alt="Recipe image" loading="lazy">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
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
      <div class="modal-section">
        <h3>Notes</h3>
        <textarea id="recipe-comments" placeholder="Add your cooking notes... (e.g., needs more salt, perfect timing, etc.)">${recipe.comments || ''}</textarea>
        <button class="btn btn-secondary save-comments-btn" onclick="saveComments(${recipe.id})" style="margin-top: 0.5rem;">💾 Save Notes</button>
      </div>
    </div>
    
    <div class="recipe-actions">
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
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    modalBody.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--heart); text-align: center;">
        <div>
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>
          <div>Failed to load recipe</div>
          <button class="btn btn-secondary" onclick="closeRecipe()" style="margin-top: 1rem;">Close</button>
        </div>
      </div>
    `;
  }
}

function closeRecipe() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
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

// Save recipe comments
async function saveComments(recipeId) {
  const commentsTextarea = document.getElementById('recipe-comments');
  const comments = commentsTextarea.value.trim();
  
  const res = await fetch(`/api/recipes/${recipeId}/comments`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments: comments || null })
  });
  
  if (res.ok) {
    const btn = document.querySelector('.save-comments-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Saved!';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
  } else {
    alert('Failed to save comments');
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
  document.body.classList.remove('modal-open');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
});

// Prevent background scrolling when touching modal content
const modalContent = document.querySelector('.modal-content');
if (modalContent) {
  modalContent.addEventListener('touchmove', (e) => {
    e.stopPropagation();
  }, { passive: false });
}

// ESC key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
    if (!addRecipeModal.classList.contains('hidden')) {
      closeAddRecipeModal();
    }
    if (!shuffleOverlay.classList.contains('hidden')) {
      closeShuffle();
    }
  }
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
      document.body.classList.remove('modal-open');
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
  document.body.classList.add('modal-open');
}

function closeAddRecipeModal() {
  addRecipeModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  // Clear image state
  selectedImages = [];
  highlightImageIndex = -1;
  const preview = document.getElementById('image-preview');
  if (preview) preview.innerHTML = '';
}

addRecipeModal.addEventListener('click', (e) => {
  if (e.target === addRecipeModal) closeAddRecipeModal();
});

// Prevent background scrolling when touching add recipe modal content
const addRecipeModalContent = addRecipeModal.querySelector('.modal-content');
if (addRecipeModalContent) {
  addRecipeModalContent.addEventListener('touchmove', (e) => {
    e.stopPropagation();
  }, { passive: false });
}

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
    // First upload images if any
    const { images, highlightImage } = await uploadImages();
    
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
      const recipe = await res.json();
      
      // If we have images, update the recipe with them
      if (images.length > 0) {
        await fetch(`/api/recipes/${recipe.id}/images`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images, highlight_image: highlightImage })
        });
      }
      
      closeAddRecipeModal();
      // Clear form state
      selectedImages = [];
      highlightImageIndex = -1;
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

// Image handling for add recipe form
let selectedImages = [];
let highlightImageIndex = -1;

document.getElementById('recipe-images')?.addEventListener('change', handleImageSelection);

function handleImageSelection(e) {
  const files = Array.from(e.target.files);
  const preview = document.getElementById('image-preview');
  
  files.forEach(file => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedImages.push({
          file: file,
          dataUrl: event.target.result,
          uploaded: false,
          path: null
        });
        renderImagePreview();
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderImagePreview() {
  const preview = document.getElementById('image-preview');
  if (!preview) return;
  
  preview.innerHTML = selectedImages.map((img, index) => `
    <div class="image-preview-item ${index === highlightImageIndex ? 'highlight' : ''}">
      <img src="${img.dataUrl}" alt="Preview ${index + 1}">
      <div class="image-preview-controls">
        <button type="button" class="image-btn highlight-btn ${index === highlightImageIndex ? 'active' : ''}" 
                onclick="setHighlightImage(${index})" title="Set as highlight">⭐</button>
        <button type="button" class="image-btn delete-btn" 
                onclick="removeImage(${index})" title="Remove">×</button>
      </div>
    </div>
  `).join('');
}

function setHighlightImage(index) {
  highlightImageIndex = index === highlightImageIndex ? -1 : index;
  renderImagePreview();
}

function removeImage(index) {
  selectedImages.splice(index, 1);
  if (highlightImageIndex === index) {
    highlightImageIndex = -1;
  } else if (highlightImageIndex > index) {
    highlightImageIndex--;
  }
  renderImagePreview();
}

async function uploadImages() {
  if (selectedImages.length === 0) return { images: [], highlightImage: null };
  
  const formData = new FormData();
  selectedImages.forEach(img => {
    if (!img.uploaded) {
      formData.append('images', img.file);
    }
  });
  
  if (formData.has('images')) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      throw new Error('Failed to upload images');
    }
    
    const { images } = await res.json();
    
    // Update selectedImages with uploaded paths
    let uploadIndex = 0;
    selectedImages.forEach(img => {
      if (!img.uploaded) {
        img.path = images[uploadIndex];
        img.uploaded = true;
        uploadIndex++;
      }
    });
  }
  
  const imagePaths = selectedImages.map(img => img.path);
  const highlightImage = highlightImageIndex >= 0 ? selectedImages[highlightImageIndex].path : null;
  
  return { images: imagePaths, highlightImage };
}

// Shuffle mode
let shuffleRecipes = [];
let shuffleIndex = 0;
const shuffleOverlay = document.getElementById('shuffle-overlay');
const shuffleCard = document.getElementById('shuffle-card');

async function startShuffle() {
  // Use current filtered recipes, shuffle them
  if (recipes.length === 0) {
    alert('No recipes to shuffle!');
    return;
  }
  
  shuffleRecipes = [...recipes].sort(() => Math.random() - 0.5);
  shuffleIndex = 0;
  shuffleOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
  await renderShuffleCard();
}

function closeShuffle() {
  shuffleOverlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

async function renderShuffleCard() {
  if (shuffleIndex >= shuffleRecipes.length) {
    // No more recipes
    closeShuffle();
    alert('No more recipes! Try adjusting your filters.');
    return;
  }
  
  const r = shuffleRecipes[shuffleIndex];
  
  // Load full recipe details for shuffle
  try {
    const res = await fetch(`/api/recipes/${r.id}`);
    const fullRecipe = await res.json();
    
    const imageEl = document.getElementById('shuffle-image');
    const displayImage = fullRecipe.highlight_image || fullRecipe.image;
    if (displayImage) {
      imageEl.style.backgroundImage = `url('${displayImage}')`;
      imageEl.textContent = '';
    } else {
      imageEl.style.backgroundImage = '';
      imageEl.textContent = cuisineEmoji[fullRecipe.cuisine] || '🍽️';
    }
    
    document.getElementById('shuffle-name').textContent = fullRecipe.name;
    document.getElementById('shuffle-description').textContent = fullRecipe.description || '';
    
    // Meta tags including equipment
    const equipmentTags = (fullRecipe.equipment || []).map(e => 
      `<span class="tag equipment">${equipmentEmoji[e] || '🍳'} ${e}</span>`
    ).join('');
    
    document.getElementById('shuffle-meta').innerHTML = `
      <span class="tag cuisine">${fullRecipe.cuisine}</span>
      <span class="tag">⏱️ ${fullRecipe.duration} min</span>
      <span class="tag">👥 ${fullRecipe.servings} servings</span>
      <span class="tag source-tag ${fullRecipe.source}">${sourceBadge[fullRecipe.source] || '🍽️'}</span>
      ${equipmentTags}
    `;
    
    // Ingredients
    document.getElementById('shuffle-ingredients').innerHTML = 
      fullRecipe.ingredients.map(i => `<li>${i}</li>`).join('');
    
    // Instructions
    document.getElementById('shuffle-instructions').innerHTML = 
      fullRecipe.instructions.map(s => `<li>${s}</li>`).join('');
    
    // Source
    const sourceEl = document.getElementById('shuffle-source');
    if (fullRecipe.source_url) {
      sourceEl.innerHTML = `Source: <a href="${fullRecipe.source_url}" target="_blank" rel="noopener">${getDomain(fullRecipe.source_url)}</a>`;
      sourceEl.style.display = '';
    } else {
      sourceEl.style.display = 'none';
    }
    
    document.getElementById('shuffle-counter').textContent = `${shuffleIndex + 1} / ${shuffleRecipes.length}`;
    
    // Reset card position and scroll to top
    shuffleCard.classList.remove('swipe-left', 'swipe-right');
    shuffleCard.style.transform = '';
    document.querySelector('.shuffle-container').scrollTop = 0;
    
  } catch (error) {
    console.error('Error loading shuffle recipe:', error);
    // Skip to next recipe if loading fails
    shuffleIndex++;
    renderShuffleCard();
  }
}

function shuffleNext() {
  shuffleCard.classList.add('swipe-left');
  setTimeout(async () => {
    shuffleIndex++;
    await renderShuffleCard();
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

// Handle iOS Safari viewport for modal
function updateModalHeight() {
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--actual-vh', `${height}px`);
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateModalHeight);
}

// Image modal for viewing full size
function openImageModal(imageSrc) {
  const imageModal = document.createElement('div');
  imageModal.className = 'modal';
  imageModal.innerHTML = `
    <div class="modal-content" style="max-width: 90vw; max-height: 90vh; background: transparent; border: none;">
      <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      <img src="${imageSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Recipe image">
    </div>
  `;
  
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      imageModal.remove();
    }
  });
  
  document.body.appendChild(imageModal);
}

// Refresh app data
function refreshApp() {
  const btn = document.querySelector('.refresh-btn');
  
  // Add spinning animation
  btn.classList.add('spinning');
  
  // Refresh all data
  Promise.all([
    loadCuisines(),
    fetchRecipes()
  ]).then(() => {
    // Remove animation after a short delay
    setTimeout(() => {
      btn.classList.remove('spinning');
    }, 800);
  }).catch(() => {
    setTimeout(() => {
      btn.classList.remove('spinning');
    }, 800);
  });
}

// Lazy loading for images
let imageObserver;

function setupLazyLoading(container) {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.onload = () => {
              img.classList.add('loaded');
            };
            img.onerror = () => {
              // Fallback to emoji if image fails to load
              const cardImage = img.closest('.card-image');
              const cuisine = cardImage.getAttribute('data-cuisine');
              cardImage.innerHTML = `
                ${cardImage.innerHTML}
                <span style="position: absolute; font-size: 4rem;">${cuisineEmoji[cuisine] || '🍽️'}</span>
              `;
            };
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });
  }

  container.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateModalHeight();
  loadCuisines();
  fetchRecipes();
});
