const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'munch.db'));

// Ensure source column exists
try {
  db.exec(`ALTER TABLE recipes ADD COLUMN source TEXT DEFAULT 'onegai'`);
} catch (e) { /* column exists */ }

const MEALDB_LIST_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian';
const MEALDB_LOOKUP_URL = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

// Map MealDB categories/areas to our cuisines
const areaToCuisine = {
  'Japanese': 'Japanese',
  'Chinese': 'Chinese',
  'Indian': 'Indian',
  'Thai': 'Thai',
  'Italian': 'Italian',
  'Mexican': 'Mexican',
  'British': 'International',
  'American': 'International',
  'French': 'International',
  'Spanish': 'Mediterranean',
  'Greek': 'Mediterranean',
  'Turkish': 'Middle Eastern',
  'Moroccan': 'Middle Eastern',
  'Egyptian': 'Middle Eastern',
  'Lebanese': 'Middle Eastern',
  'Vietnamese': 'Asian',
  'Malaysian': 'Asian',
  'Filipino': 'Asian',
  'Jamaican': 'International',
  'Irish': 'International',
  'Canadian': 'International',
  'Russian': 'International',
  'Polish': 'International',
  'Dutch': 'International',
  'Unknown': 'International',
};

function parseIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      const m = measure ? measure.trim() : '';
      ingredients.push(m ? `${m} ${ingredient.trim()}` : ingredient.trim());
    }
  }
  return ingredients;
}

function parseInstructions(meal) {
  const raw = meal.strInstructions || '';
  // Split by newlines or numbered steps
  return raw
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^step\s*\d+$/i));
}

function estimateDuration(instructions) {
  // Rough estimate based on instruction count
  const stepCount = instructions.length;
  if (stepCount <= 3) return 15;
  if (stepCount <= 5) return 20;
  if (stepCount <= 8) return 30;
  return 45;
}

async function fetchMealDBRecipes() {
  console.log('Fetching vegetarian meals from TheMealDB...');
  
  // Get list of vegetarian meals
  const listRes = await fetch(MEALDB_LIST_URL);
  const listData = await listRes.json();
  
  if (!listData.meals) {
    console.log('No meals found');
    return;
  }

  console.log(`Found ${listData.meals.length} vegetarian meals`);

  // Clear existing MealDB recipes
  db.exec(`DELETE FROM recipes WHERE source = 'themealdb'`);

  const insert = db.prepare(`
    INSERT INTO recipes (name, description, cuisine, duration, servings, equipment, ingredients, instructions, source_url, image, custom, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'themealdb')
  `);

  let added = 0;
  
  for (const meal of listData.meals) {
    try {
      // Fetch full details
      const detailRes = await fetch(MEALDB_LOOKUP_URL + meal.idMeal);
      const detailData = await detailRes.json();
      
      if (!detailData.meals || !detailData.meals[0]) continue;
      
      const m = detailData.meals[0];
      const ingredients = parseIngredients(m);
      const instructions = parseInstructions(m);
      
      if (ingredients.length === 0 || instructions.length === 0) continue;
      
      const cuisine = areaToCuisine[m.strArea] || 'International';
      const duration = estimateDuration(instructions);
      const sourceUrl = m.strSource || `https://www.themealdb.com/meal/${m.idMeal}`;
      
      insert.run(
        m.strMeal,
        m.strTags ? m.strTags.split(',').slice(0, 3).join(', ') : '',
        cuisine,
        duration,
        2,
        JSON.stringify([]),
        JSON.stringify(ingredients),
        JSON.stringify(instructions),
        sourceUrl,
        m.strMealThumb
      );
      
      added++;
      process.stdout.write(`\rAdded ${added} recipes...`);
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 100));
      
    } catch (err) {
      console.error(`\nError fetching meal ${meal.idMeal}:`, err.message);
    }
  }

  console.log(`\nDone! Added ${added} recipes from TheMealDB`);
}

fetchMealDBRecipes().catch(console.error);
