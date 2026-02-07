const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

// Database setup
const db = new Database(path.join(__dirname, 'data', 'munch.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cuisine TEXT NOT NULL,
    duration INTEGER NOT NULL,
    servings INTEGER DEFAULT 2,
    equipment TEXT,
    image TEXT,
    seasonal TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    source_url TEXT,
    custom INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER UNIQUE NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  );

  CREATE TABLE IF NOT EXISTS shopping_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient TEXT NOT NULL,
    recipe_id INTEGER,
    checked INTEGER DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  );
`);

// Migration: add custom and source_url columns if they don't exist
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN custom INTEGER DEFAULT 0`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN source_url TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN source TEXT DEFAULT 'onegai'`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN comments TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN images TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN highlight_image TEXT`);
} catch (e) { /* column exists */ }

// Set source for existing recipes
db.exec(`UPDATE recipes SET source = 'onegai' WHERE source IS NULL AND custom = 0`);
db.exec(`UPDATE recipes SET source = 'user' WHERE custom = 1 AND source IS NULL`);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Upload images for recipe
app.post('/api/upload', upload.array('images', 10), (req, res) => {
  try {
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ images: imagePaths });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Update recipe images and highlight
app.patch('/api/recipes/:id/images', (req, res) => {
  const { id } = req.params;
  const { images, highlight_image } = req.body;
  
  if (images !== null && images !== undefined && !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images must be an array' });
  }
  
  db.prepare('UPDATE recipes SET images = ?, highlight_image = ? WHERE id = ?')
    .run(images ? JSON.stringify(images) : null, highlight_image || null, id);
  
  res.json({ ok: true });
});

// Get recipes list (minimal data for performance)
app.get('/api/recipes', (req, res) => {
  const { cuisine, maxDuration, equipment, favorites, search, custom } = req.query;
  
  let query = 'SELECT id, name, description, cuisine, duration, servings, equipment, highlight_image, image, custom, source, created_at FROM recipes WHERE 1=1';
  const params = [];

  if (cuisine && cuisine !== 'all') {
    query += ' AND cuisine = ?';
    params.push(cuisine);
  }

  if (maxDuration) {
    query += ' AND duration <= ?';
    params.push(parseInt(maxDuration));
  }

  if (equipment) {
    query += ' AND equipment LIKE ?';
    params.push(`%${equipment}%`);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (custom === 'true') {
    query += ' AND custom = 1';
  } else if (custom === 'false') {
    query += ' AND custom = 0';
  }

  if (req.query.source) {
    query += ' AND source = ?';
    params.push(req.query.source);
  }

  query += ' ORDER BY created_at DESC';

  let recipes = db.prepare(query).all(...params);

  // Get favorites
  const favIds = db.prepare('SELECT recipe_id FROM favorites').all().map(f => f.recipe_id);
  
  recipes = recipes.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    duration: r.duration,
    servings: r.servings,
    equipment: r.equipment ? JSON.parse(r.equipment) : [],
    highlight_image: r.highlight_image,
    image: r.image, // Keep for backward compatibility
    isFavorite: favIds.includes(r.id),
    isCustom: r.custom === 1,
    source: r.source || 'onegai',
    created_at: r.created_at
  }));

  if (favorites === 'true') {
    recipes = recipes.filter(r => r.isFavorite);
  }

  res.json(recipes);
});

// Get single recipe
app.get('/api/recipes/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  const isFavorite = db.prepare('SELECT 1 FROM favorites WHERE recipe_id = ?').get(req.params.id);
  
  res.json({
    ...recipe,
    ingredients: JSON.parse(recipe.ingredients),
    instructions: JSON.parse(recipe.instructions),
    equipment: recipe.equipment ? JSON.parse(recipe.equipment) : [],
    seasonal: recipe.seasonal ? JSON.parse(recipe.seasonal) : [],
    images: recipe.images ? JSON.parse(recipe.images) : [],
    highlight_image: recipe.highlight_image,
    isFavorite: !!isFavorite,
    isCustom: recipe.custom === 1,
    source: recipe.source || 'onegai'
  });
});

// Create a new recipe
app.post('/api/recipes', (req, res) => {
  const { name, description, cuisine, duration, servings, equipment, ingredients, instructions, source_url } = req.body;
  
  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!cuisine || typeof cuisine !== 'string') {
    return res.status(400).json({ error: 'Cuisine is required' });
  }
  if (!duration || typeof duration !== 'number' || duration < 1) {
    return res.status(400).json({ error: 'Duration must be a positive number' });
  }
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'At least one ingredient is required' });
  }
  if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
    return res.status(400).json({ error: 'At least one instruction is required' });
  }

  const result = db.prepare(`
    INSERT INTO recipes (name, description, cuisine, duration, servings, equipment, ingredients, instructions, source_url, custom, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'user')
  `).run(
    name.trim(),
    description?.trim() || '',
    cuisine.trim(),
    duration,
    servings || 2,
    JSON.stringify(equipment || []),
    JSON.stringify(ingredients),
    JSON.stringify(instructions),
    source_url?.trim() || null
  );

  const newRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json({
    ...newRecipe,
    ingredients: JSON.parse(newRecipe.ingredients),
    instructions: JSON.parse(newRecipe.instructions),
    equipment: newRecipe.equipment ? JSON.parse(newRecipe.equipment) : [],
    isCustom: true,
    isFavorite: false
  });
});

// Delete a recipe (only custom)
app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const recipe = db.prepare('SELECT custom FROM recipes WHERE id = ?').get(id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  if (recipe.custom !== 1) {
    return res.status(403).json({ error: 'Can only delete custom recipes' });
  }
  
  db.prepare('DELETE FROM favorites WHERE recipe_id = ?').run(id);
  db.prepare('DELETE FROM shopping_list WHERE recipe_id = ?').run(id);
  db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
  
  res.status(204).send();
});

// Get cuisines
app.get('/api/cuisines', (req, res) => {
  const cuisines = db.prepare('SELECT DISTINCT cuisine FROM recipes ORDER BY cuisine').all();
  res.json(cuisines.map(c => c.cuisine));
});

// Toggle favorite
app.post('/api/favorites/:recipeId', (req, res) => {
  const { recipeId } = req.params;
  const existing = db.prepare('SELECT id FROM favorites WHERE recipe_id = ?').get(recipeId);
  
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE recipe_id = ?').run(recipeId);
    res.json({ isFavorite: false });
  } else {
    db.prepare('INSERT INTO favorites (recipe_id) VALUES (?)').run(recipeId);
    res.json({ isFavorite: true });
  }
});

// Shopping list
app.get('/api/shopping-list', (req, res) => {
  const items = db.prepare(`
    SELECT sl.*, r.name as recipe_name 
    FROM shopping_list sl 
    LEFT JOIN recipes r ON sl.recipe_id = r.id
    ORDER BY sl.checked, sl.ingredient
  `).all();
  res.json(items);
});

app.post('/api/shopping-list', (req, res) => {
  const { ingredient, recipeId } = req.body;
  if (!ingredient) {
    return res.status(400).json({ error: 'Ingredient required' });
  }
  const result = db.prepare('INSERT INTO shopping_list (ingredient, recipe_id) VALUES (?, ?)').run(ingredient, recipeId || null);
  res.status(201).json({ id: result.lastInsertRowid, ingredient, recipe_id: recipeId, checked: 0 });
});

app.post('/api/shopping-list/from-recipe/:recipeId', (req, res) => {
  const { recipeId } = req.params;
  const { servings } = req.body;
  
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const ingredients = JSON.parse(recipe.ingredients);
  const ratio = servings ? servings / recipe.servings : 1;

  const insert = db.prepare('INSERT INTO shopping_list (ingredient, recipe_id) VALUES (?, ?)');
  
  for (const ing of ingredients) {
    // Adjust quantity if ratio differs
    let adjusted = ing;
    if (ratio !== 1) {
      adjusted = ing.replace(/^([\d.\/]+)/, (match) => {
        const num = eval(match); // handles fractions like 1/2
        return Math.round(num * ratio * 10) / 10;
      });
    }
    insert.run(`${adjusted} (${recipe.name})`, recipeId);
  }

  res.json({ added: ingredients.length });
});

app.patch('/api/shopping-list/:id', (req, res) => {
  const { checked } = req.body;
  db.prepare('UPDATE shopping_list SET checked = ? WHERE id = ?').run(checked ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/shopping-list/:id', (req, res) => {
  db.prepare('DELETE FROM shopping_list WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

app.delete('/api/shopping-list', (req, res) => {
  const { checked } = req.query;
  if (checked === 'true') {
    db.prepare('DELETE FROM shopping_list WHERE checked = 1').run();
  } else {
    db.prepare('DELETE FROM shopping_list').run();
  }
  res.status(204).send();
});

// Update recipe comments
app.patch('/api/recipes/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;
  
  if (comments !== null && comments !== undefined && typeof comments !== 'string') {
    return res.status(400).json({ error: 'Comments must be a string' });
  }
  
  db.prepare('UPDATE recipes SET comments = ? WHERE id = ?').run(comments || null, id);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Munch running at http://0.0.0.0:${PORT}`);
  console.log(`Access from network: http://Eliass-Mac-mini.local:${PORT}`);
});
