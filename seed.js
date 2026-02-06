const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'munch.db'));

// Create tables if they don't exist
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Clear existing recipes
db.exec('DELETE FROM recipes');

const recipes = [
  // Japanese
  {
    name: "Miso Soup with Tofu",
    description: "Classic Japanese comfort soup, light yet satisfying",
    cuisine: "Japanese",
    duration: 15,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["all"],
    ingredients: [
      "750ml water",
      "3 tbsp white miso paste",
      "150g silken tofu, cubed",
      "2 spring onions, sliced",
      "50g wakame seaweed (dried)",
      "1 tsp dashi powder (vegetarian)"
    ],
    instructions: [
      "Bring water to a simmer with dashi powder",
      "Add wakame and let rehydrate for 2 minutes",
      "Add tofu cubes gently",
      "Remove from heat, stir in miso paste (don't boil)",
      "Serve topped with spring onions"
    ]
  },
  {
    name: "Vegetable Yakisoba",
    description: "Stir-fried Japanese noodles with savory sauce",
    cuisine: "Japanese",
    duration: 20,
    servings: 2,
    equipment: ["wok", "pot"],
    seasonal: ["all"],
    ingredients: [
      "200g yakisoba noodles",
      "1 carrot, julienned",
      "100g cabbage, shredded",
      "1 bell pepper, sliced",
      "100g mushrooms, sliced",
      "3 tbsp yakisoba sauce",
      "1 tbsp vegetable oil",
      "Pickled ginger to serve",
      "Nori flakes to serve"
    ],
    instructions: [
      "Cook noodles according to package, drain",
      "Heat oil in wok over high heat",
      "Stir-fry vegetables for 3-4 minutes",
      "Add noodles and sauce, toss well",
      "Serve with pickled ginger and nori"
    ]
  },
  {
    name: "Teriyaki Tofu Rice Bowl",
    description: "Sweet and savory glazed tofu over fluffy rice",
    cuisine: "Japanese",
    duration: 25,
    servings: 2,
    equipment: ["pan", "pot"],
    seasonal: ["all"],
    ingredients: [
      "200g firm tofu, cubed",
      "200g rice",
      "3 tbsp soy sauce",
      "2 tbsp mirin",
      "1 tbsp sugar",
      "1 tsp sesame oil",
      "Steamed broccoli",
      "Sesame seeds",
      "Spring onion"
    ],
    instructions: [
      "Cook rice according to package",
      "Press tofu, cut into cubes",
      "Mix soy sauce, mirin, and sugar for sauce",
      "Pan-fry tofu until golden on all sides",
      "Add sauce, coat tofu, let caramelize",
      "Serve over rice with broccoli, sesame, spring onion"
    ]
  },
  {
    name: "Japanese Curry Rice",
    description: "Rich, mildly spiced comfort food curry",
    cuisine: "Japanese",
    duration: 35,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["autumn", "winter"],
    ingredients: [
      "1 block Japanese curry roux (S&B Golden)",
      "2 potatoes, cubed",
      "1 carrot, sliced",
      "1 onion, diced",
      "500ml vegetable stock",
      "200g rice",
      "Pickled vegetables to serve"
    ],
    instructions: [
      "Cook rice",
      "Sauté onion until soft",
      "Add carrot and potato, cook 2 min",
      "Add stock, simmer until vegetables tender (15 min)",
      "Break in curry roux, stir until thickened",
      "Serve over rice"
    ]
  },

  // Chinese
  {
    name: "Vegetable Fried Rice",
    description: "Quick wok-tossed rice with crispy vegetables",
    cuisine: "Chinese",
    duration: 15,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "400g cooked rice (day-old best)",
      "2 eggs, beaten",
      "100g peas",
      "1 carrot, diced small",
      "3 spring onions, chopped",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "2 tbsp vegetable oil"
    ],
    instructions: [
      "Heat wok until smoking, add oil",
      "Scramble eggs, set aside",
      "Stir-fry carrot and peas 2 min",
      "Add rice, toss on high heat",
      "Add soy sauce, sesame oil, eggs",
      "Finish with spring onions"
    ]
  },
  {
    name: "Mapo Tofu",
    description: "Spicy Sichuan tofu in savory sauce",
    cuisine: "Chinese",
    duration: 20,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "400g silken tofu, cubed",
      "2 tbsp doubanjiang (chili bean paste)",
      "1 tbsp soy sauce",
      "200ml vegetable stock",
      "1 tsp Sichuan peppercorns, ground",
      "2 cloves garlic, minced",
      "1 tbsp cornstarch + 2 tbsp water",
      "Spring onions, chopped",
      "Rice to serve"
    ],
    instructions: [
      "Gently blanch tofu in salted water, drain",
      "Fry doubanjiang and garlic until fragrant",
      "Add stock and soy sauce, bring to simmer",
      "Slide in tofu, simmer 5 min",
      "Thicken with cornstarch slurry",
      "Top with Sichuan pepper and spring onions"
    ]
  },
  {
    name: "Chinese Tomato Egg",
    description: "Simple homestyle comfort dish, ready in minutes",
    cuisine: "Chinese",
    duration: 15,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["summer"],
    ingredients: [
      "4 eggs, beaten",
      "3 tomatoes, wedged",
      "2 tbsp ketchup",
      "1 tbsp sugar",
      "1/2 tsp salt",
      "2 spring onions",
      "2 tbsp vegetable oil",
      "Rice to serve"
    ],
    instructions: [
      "Beat eggs with pinch of salt",
      "Scramble eggs until just set, remove",
      "Sauté tomatoes until breaking down",
      "Add ketchup, sugar, stir",
      "Return eggs, fold gently",
      "Garnish with spring onions, serve with rice"
    ]
  },
  {
    name: "Dan Dan Noodles",
    description: "Spicy, nutty Sichuan street food classic",
    cuisine: "Chinese",
    duration: 20,
    servings: 2,
    equipment: ["pot", "wok"],
    seasonal: ["all"],
    ingredients: [
      "200g wheat noodles",
      "3 tbsp peanut butter",
      "2 tbsp soy sauce",
      "1 tbsp chili oil",
      "1 tbsp rice vinegar",
      "1 tsp sugar",
      "100g mushrooms, minced",
      "2 cloves garlic",
      "Chopped peanuts, spring onion"
    ],
    instructions: [
      "Cook noodles, reserve 100ml pasta water",
      "Mix peanut butter, soy, chili oil, vinegar, sugar",
      "Fry mushrooms with garlic until crispy",
      "Toss noodles with sauce, add pasta water to loosen",
      "Top with mushrooms, peanuts, spring onion"
    ]
  },

  // Indian
  {
    name: "Chana Masala",
    description: "Spiced chickpea curry, a North Indian staple",
    cuisine: "Indian",
    duration: 25,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["all"],
    ingredients: [
      "400g canned chickpeas, drained",
      "400g canned tomatoes",
      "1 onion, diced",
      "3 cloves garlic",
      "1 inch ginger, grated",
      "1 tsp cumin",
      "1 tsp coriander",
      "1 tsp garam masala",
      "1/2 tsp turmeric",
      "Fresh coriander",
      "Rice or naan to serve"
    ],
    instructions: [
      "Sauté onion until golden",
      "Add garlic, ginger, spices, fry 1 min",
      "Add tomatoes, simmer 10 min",
      "Add chickpeas, simmer 10 min more",
      "Finish with garam masala and fresh coriander"
    ]
  },
  {
    name: "Palak Paneer",
    description: "Creamy spinach curry with soft cheese cubes",
    cuisine: "Indian",
    duration: 30,
    servings: 2,
    equipment: ["pot", "blender"],
    seasonal: ["all"],
    ingredients: [
      "200g paneer, cubed",
      "300g spinach",
      "1 onion, diced",
      "2 tomatoes, chopped",
      "3 cloves garlic",
      "1 inch ginger",
      "1 tsp cumin seeds",
      "1 tsp garam masala",
      "100ml cream",
      "Naan or rice"
    ],
    instructions: [
      "Blanch spinach, blend to puree",
      "Fry paneer until golden, set aside",
      "Sauté cumin, onion, garlic, ginger",
      "Add tomatoes, cook down",
      "Add spinach puree, simmer",
      "Stir in cream, add paneer, finish with garam masala"
    ]
  },
  {
    name: "Aloo Gobi",
    description: "Dry-spiced potato and cauliflower",
    cuisine: "Indian",
    duration: 30,
    servings: 2,
    equipment: ["pan"],
    seasonal: ["autumn", "winter"],
    ingredients: [
      "2 potatoes, cubed",
      "1/2 cauliflower, florets",
      "1 onion, sliced",
      "1 tsp cumin seeds",
      "1 tsp turmeric",
      "1 tsp coriander powder",
      "1/2 tsp chili powder",
      "Fresh coriander",
      "2 tbsp oil"
    ],
    instructions: [
      "Parboil potatoes 5 min, drain",
      "Fry cumin seeds until popping",
      "Add onion, cook until soft",
      "Add spices, potatoes, cauliflower",
      "Cover and cook 15 min, stirring occasionally",
      "Finish with fresh coriander"
    ]
  },
  {
    name: "Dal Tadka",
    description: "Comforting lentil soup with tempered spices",
    cuisine: "Indian",
    duration: 30,
    servings: 2,
    equipment: ["pot", "small pan"],
    seasonal: ["all"],
    ingredients: [
      "150g red lentils",
      "600ml water",
      "1 tsp turmeric",
      "1 onion, diced",
      "2 cloves garlic, sliced",
      "1 tsp cumin seeds",
      "2 dried chilies",
      "2 tbsp ghee or oil",
      "Fresh coriander",
      "Rice to serve"
    ],
    instructions: [
      "Simmer lentils with turmeric until soft (20 min)",
      "Mash slightly for creamy texture",
      "In small pan, heat ghee, add cumin and chilies",
      "Add garlic, fry until golden",
      "Pour tadka over dal",
      "Serve with rice and coriander"
    ]
  },

  // Thai
  {
    name: "Pad Thai",
    description: "Sweet, sour, savory rice noodles",
    cuisine: "Thai",
    duration: 25,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "200g flat rice noodles",
      "2 eggs",
      "100g tofu, cubed",
      "2 tbsp tamarind paste",
      "2 tbsp soy sauce",
      "1 tbsp sugar",
      "100g bean sprouts",
      "Crushed peanuts",
      "Lime wedges",
      "Spring onions"
    ],
    instructions: [
      "Soak noodles in warm water until pliable",
      "Mix tamarind, soy sauce, sugar for sauce",
      "Fry tofu until crispy, set aside",
      "Scramble eggs in wok",
      "Add noodles and sauce, toss",
      "Add tofu, bean sprouts, serve with peanuts and lime"
    ]
  },
  {
    name: "Green Curry",
    description: "Creamy coconut curry with Thai basil",
    cuisine: "Thai",
    duration: 25,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "2 tbsp green curry paste",
      "400ml coconut milk",
      "200g tofu or vegetables",
      "100g Thai eggplant or regular",
      "1 tbsp soy sauce",
      "1 tsp sugar",
      "Thai basil leaves",
      "Jasmine rice"
    ],
    instructions: [
      "Fry curry paste in coconut cream (thick part)",
      "Add remaining coconut milk",
      "Add eggplant, simmer 10 min",
      "Add tofu, soy sauce, sugar",
      "Finish with Thai basil, serve with rice"
    ]
  },
  {
    name: "Tom Yum Soup",
    description: "Hot and sour soup with mushrooms",
    cuisine: "Thai",
    duration: 20,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["all"],
    ingredients: [
      "750ml vegetable stock",
      "2 stalks lemongrass, bruised",
      "4 kaffir lime leaves",
      "3 slices galangal",
      "200g mushrooms, halved",
      "2 tbsp lime juice",
      "1 tbsp soy sauce",
      "1 tsp chili paste",
      "Fresh coriander"
    ],
    instructions: [
      "Simmer stock with lemongrass, lime leaves, galangal",
      "Add mushrooms, cook 5 min",
      "Remove from heat",
      "Stir in lime juice, soy sauce, chili paste",
      "Serve with fresh coriander"
    ]
  },

  // Italian
  {
    name: "Pasta Aglio e Olio",
    description: "Simple garlic and olive oil pasta",
    cuisine: "Italian",
    duration: 15,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["all"],
    ingredients: [
      "200g spaghetti",
      "6 cloves garlic, sliced thin",
      "80ml extra virgin olive oil",
      "1/2 tsp chili flakes",
      "Fresh parsley, chopped",
      "Parmesan to serve"
    ],
    instructions: [
      "Cook pasta in salted water, reserve 100ml pasta water",
      "Slowly fry garlic in oil until golden (not brown!)",
      "Add chili flakes",
      "Toss pasta with garlic oil and pasta water",
      "Finish with parsley and parmesan"
    ]
  },
  {
    name: "Caprese Salad",
    description: "Fresh tomatoes, mozzarella, and basil",
    cuisine: "Italian",
    duration: 10,
    servings: 2,
    equipment: [],
    seasonal: ["summer"],
    ingredients: [
      "3 ripe tomatoes, sliced",
      "200g fresh mozzarella, sliced",
      "Fresh basil leaves",
      "Extra virgin olive oil",
      "Balsamic glaze",
      "Salt and pepper"
    ],
    instructions: [
      "Arrange tomato and mozzarella slices alternating",
      "Tuck basil leaves between",
      "Drizzle with olive oil and balsamic",
      "Season with salt and pepper"
    ]
  },
  {
    name: "Mushroom Risotto",
    description: "Creamy Italian rice with earthy mushrooms",
    cuisine: "Italian",
    duration: 35,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["autumn", "winter"],
    ingredients: [
      "200g arborio rice",
      "300g mixed mushrooms, sliced",
      "750ml vegetable stock, warm",
      "1 onion, diced fine",
      "100ml white wine",
      "50g parmesan, grated",
      "2 tbsp butter",
      "Fresh thyme"
    ],
    instructions: [
      "Sauté mushrooms until golden, set aside",
      "Sauté onion in butter until soft",
      "Toast rice 1 min, add wine",
      "Add stock one ladle at a time, stirring",
      "When creamy (18-20 min), fold in mushrooms",
      "Finish with parmesan, butter, thyme"
    ]
  },
  {
    name: "Pasta Primavera",
    description: "Colorful spring vegetable pasta",
    cuisine: "Italian",
    duration: 25,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["spring", "summer"],
    ingredients: [
      "200g penne or fusilli",
      "1 zucchini, sliced",
      "1 bell pepper, diced",
      "100g cherry tomatoes, halved",
      "100g asparagus, cut",
      "2 cloves garlic",
      "3 tbsp olive oil",
      "Basil, parmesan"
    ],
    instructions: [
      "Cook pasta, reserve pasta water",
      "Sauté garlic in oil",
      "Add firm vegetables first, then softer ones",
      "Toss with pasta and splash of pasta water",
      "Finish with basil and parmesan"
    ]
  },

  // Middle Eastern
  {
    name: "Falafel Wrap",
    description: "Crispy chickpea fritters in warm pita",
    cuisine: "Middle Eastern",
    duration: 30,
    servings: 2,
    equipment: ["blender", "pan"],
    seasonal: ["all"],
    ingredients: [
      "400g canned chickpeas, very well drained",
      "1 onion, quartered",
      "4 cloves garlic",
      "Handful parsley and coriander",
      "1 tsp cumin",
      "1 tsp coriander powder",
      "4 tbsp flour",
      "Pita bread, tahini, salad"
    ],
    instructions: [
      "Blend chickpeas, onion, garlic, herbs, spices (don't puree, keep texture)",
      "Mix in flour, rest 15 min",
      "Form patties, shallow fry until golden",
      "Serve in warm pita with tahini, salad, pickles"
    ]
  },
  {
    name: "Shakshuka",
    description: "Eggs poached in spiced tomato sauce",
    cuisine: "Middle Eastern",
    duration: 25,
    servings: 2,
    equipment: ["pan"],
    seasonal: ["all"],
    ingredients: [
      "400g canned tomatoes",
      "4 eggs",
      "1 onion, diced",
      "1 bell pepper, diced",
      "3 cloves garlic",
      "1 tsp cumin",
      "1 tsp paprika",
      "Pinch cayenne",
      "Fresh parsley, crusty bread"
    ],
    instructions: [
      "Sauté onion and pepper until soft",
      "Add garlic and spices, fry 1 min",
      "Add tomatoes, simmer 10 min",
      "Make wells, crack in eggs",
      "Cover, cook until whites set",
      "Serve with parsley and bread for dipping"
    ]
  },
  {
    name: "Hummus Bowl",
    description: "Creamy hummus with toppings and warm pita",
    cuisine: "Middle Eastern",
    duration: 15,
    servings: 2,
    equipment: ["blender"],
    seasonal: ["all"],
    ingredients: [
      "400g canned chickpeas",
      "3 tbsp tahini",
      "2 cloves garlic",
      "Juice of 1 lemon",
      "3 tbsp olive oil",
      "Paprika, pine nuts",
      "Pita bread, vegetables"
    ],
    instructions: [
      "Blend chickpeas (save some for topping)",
      "Add tahini, garlic, lemon, 2 tbsp oil, blend smooth",
      "Add chickpea water if too thick",
      "Serve drizzled with oil, paprika, whole chickpeas, pine nuts"
    ]
  },

  // Mexican
  {
    name: "Black Bean Tacos",
    description: "Spiced black beans with fresh toppings",
    cuisine: "Mexican",
    duration: 20,
    servings: 2,
    equipment: ["pan"],
    seasonal: ["all"],
    ingredients: [
      "400g canned black beans",
      "1 tsp cumin",
      "1 tsp smoked paprika",
      "8 small tortillas",
      "1 avocado, sliced",
      "Sour cream",
      "Fresh salsa",
      "Coriander, lime"
    ],
    instructions: [
      "Heat beans with cumin and paprika, mash slightly",
      "Warm tortillas",
      "Fill with beans, avocado, salsa, sour cream",
      "Top with coriander and lime"
    ]
  },
  {
    name: "Vegetarian Burrito Bowl",
    description: "Loaded bowl with rice, beans, and all the fixings",
    cuisine: "Mexican",
    duration: 25,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["all"],
    ingredients: [
      "200g rice",
      "400g black beans",
      "1 bell pepper, sliced",
      "1 cup corn",
      "1 avocado",
      "Sour cream",
      "Salsa",
      "Lime, coriander",
      "1 tsp cumin"
    ],
    instructions: [
      "Cook rice with lime juice and coriander",
      "Heat beans with cumin",
      "Sauté pepper and corn",
      "Assemble bowls: rice, beans, veg, avocado",
      "Top with sour cream, salsa, coriander"
    ]
  },
  {
    name: "Quesadillas",
    description: "Crispy cheese-filled tortillas",
    cuisine: "Mexican",
    duration: 15,
    servings: 2,
    equipment: ["pan"],
    seasonal: ["all"],
    ingredients: [
      "4 large flour tortillas",
      "200g cheese, grated",
      "1 bell pepper, diced",
      "1/2 onion, diced",
      "Jalapeños (optional)",
      "Sour cream, guacamole, salsa"
    ],
    instructions: [
      "Sauté pepper and onion",
      "Place tortilla in dry pan, add cheese and veg to half",
      "Fold, cook until golden on both sides",
      "Cut into wedges, serve with dips"
    ]
  },

  // Korean
  {
    name: "Bibimbap",
    description: "Mixed rice bowl with vegetables and gochujang",
    cuisine: "Korean",
    duration: 30,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["all"],
    ingredients: [
      "200g rice",
      "100g spinach, blanched",
      "1 carrot, julienned",
      "100g bean sprouts",
      "1 zucchini, sliced",
      "2 eggs",
      "2 tbsp gochujang",
      "1 tbsp sesame oil",
      "Sesame seeds"
    ],
    instructions: [
      "Cook rice",
      "Sauté each vegetable separately with sesame oil",
      "Fry eggs sunny-side up",
      "Arrange vegetables on rice",
      "Top with egg, gochujang, sesame seeds",
      "Mix everything before eating"
    ]
  },
  {
    name: "Kimchi Fried Rice",
    description: "Tangy, spicy fried rice with kimchi",
    cuisine: "Korean",
    duration: 15,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "400g cooked rice",
      "150g kimchi, chopped",
      "2 tbsp kimchi juice",
      "1 tbsp gochujang",
      "1 tbsp soy sauce",
      "2 eggs",
      "1 tbsp sesame oil",
      "Spring onions, sesame seeds"
    ],
    instructions: [
      "Fry kimchi in sesame oil 2 min",
      "Add rice, stir-fry on high",
      "Add gochujang, soy sauce, kimchi juice",
      "Fry eggs, place on top",
      "Garnish with spring onions and sesame"
    ]
  },

  // Airfryer specials
  {
    name: "Airfryer Crispy Tofu",
    description: "Perfectly crispy tofu without deep frying",
    cuisine: "Asian",
    duration: 25,
    servings: 2,
    equipment: ["airfryer"],
    seasonal: ["all"],
    ingredients: [
      "400g firm tofu",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tbsp cornstarch",
      "Sweet chili sauce",
      "Rice and vegetables"
    ],
    instructions: [
      "Press tofu 15 min, cube",
      "Toss with soy sauce and sesame oil",
      "Coat with cornstarch",
      "Airfry 180°C for 15 min, shake halfway",
      "Serve with sweet chili, rice, and veg"
    ]
  },
  {
    name: "Airfryer Falafel",
    description: "Crispy falafel with much less oil",
    cuisine: "Middle Eastern",
    duration: 25,
    servings: 2,
    equipment: ["airfryer", "blender"],
    seasonal: ["all"],
    ingredients: [
      "400g canned chickpeas, well drained",
      "1/2 onion",
      "3 cloves garlic",
      "Handful parsley",
      "1 tsp cumin",
      "3 tbsp flour",
      "Spray oil",
      "Pita, tahini, salad"
    ],
    instructions: [
      "Blend all ingredients except oil (keep texture)",
      "Form into balls, refrigerate 15 min",
      "Spray with oil",
      "Airfry 180°C for 12 min, flip halfway",
      "Serve in pita with tahini"
    ]
  },
  {
    name: "Airfryer Vegetable Pakora",
    description: "Crispy Indian vegetable fritters",
    cuisine: "Indian",
    duration: 25,
    servings: 2,
    equipment: ["airfryer"],
    seasonal: ["all"],
    ingredients: [
      "1 potato, thinly sliced",
      "1 onion, sliced",
      "100g cauliflower florets",
      "100g chickpea flour (besan)",
      "1 tsp cumin",
      "1/2 tsp turmeric",
      "1/2 tsp chili powder",
      "Water, spray oil",
      "Mint chutney"
    ],
    instructions: [
      "Mix chickpea flour with spices and water to make batter",
      "Coat vegetables in batter",
      "Spray airfryer basket, arrange pakoras",
      "Airfry 180°C for 15 min, flip halfway",
      "Serve with mint chutney"
    ]
  },
  {
    name: "Airfryer Stuffed Peppers",
    description: "Bell peppers stuffed with rice and cheese",
    cuisine: "Mediterranean",
    duration: 30,
    servings: 2,
    equipment: ["airfryer"],
    seasonal: ["summer", "autumn"],
    ingredients: [
      "4 bell peppers",
      "200g cooked rice",
      "100g black beans",
      "100g corn",
      "100g cheese, grated",
      "1 tsp cumin",
      "Salsa, sour cream"
    ],
    instructions: [
      "Cut tops off peppers, remove seeds",
      "Mix rice, beans, corn, half the cheese, cumin",
      "Stuff peppers, top with remaining cheese",
      "Airfry 180°C for 15 min",
      "Serve with salsa and sour cream"
    ]
  },

  // Quick soups
  {
    name: "Carrot Ginger Soup",
    description: "Silky smooth soup with warming ginger",
    cuisine: "International",
    duration: 25,
    servings: 2,
    equipment: ["pot", "blender"],
    seasonal: ["autumn", "winter"],
    ingredients: [
      "500g carrots, chopped",
      "1 onion, diced",
      "2 inch ginger, grated",
      "600ml vegetable stock",
      "100ml coconut cream",
      "1 tbsp oil",
      "Crusty bread"
    ],
    instructions: [
      "Sauté onion and ginger",
      "Add carrots and stock, simmer 15 min",
      "Blend until smooth",
      "Stir in coconut cream",
      "Serve with crusty bread"
    ]
  },
  {
    name: "Thai Coconut Soup",
    description: "Creamy coconut soup with vegetables",
    cuisine: "Thai",
    duration: 20,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["all"],
    ingredients: [
      "400ml coconut milk",
      "300ml vegetable stock",
      "200g tofu, cubed",
      "100g mushrooms",
      "1 tbsp red curry paste",
      "1 tbsp soy sauce",
      "Lime juice, coriander"
    ],
    instructions: [
      "Fry curry paste 1 min",
      "Add coconut milk and stock",
      "Add mushrooms and tofu, simmer 10 min",
      "Season with soy sauce and lime",
      "Serve with fresh coriander"
    ]
  },
  {
    name: "Minestrone",
    description: "Hearty Italian vegetable soup",
    cuisine: "Italian",
    duration: 30,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["autumn", "winter"],
    ingredients: [
      "400g canned tomatoes",
      "400g canned cannellini beans",
      "1 zucchini, diced",
      "1 carrot, diced",
      "1 celery stalk, diced",
      "100g small pasta",
      "500ml vegetable stock",
      "Parmesan, basil"
    ],
    instructions: [
      "Sauté carrot, celery, zucchini",
      "Add tomatoes and stock, simmer 10 min",
      "Add pasta and beans, cook until pasta done",
      "Serve with parmesan and basil"
    ]
  },

  // Noodle dishes
  {
    name: "Peanut Noodles",
    description: "Cold noodles in creamy peanut sauce",
    cuisine: "Asian",
    duration: 15,
    servings: 2,
    equipment: ["pot"],
    seasonal: ["summer"],
    ingredients: [
      "200g noodles (soba or wheat)",
      "3 tbsp peanut butter",
      "2 tbsp soy sauce",
      "1 tbsp rice vinegar",
      "1 tbsp sesame oil",
      "1 tsp chili flakes",
      "Cucumber, spring onion, peanuts"
    ],
    instructions: [
      "Cook noodles, rinse under cold water",
      "Whisk peanut butter, soy, vinegar, sesame oil, chili",
      "Toss noodles with sauce",
      "Top with cucumber, spring onion, crushed peanuts"
    ]
  },
  {
    name: "Singapore Noodles",
    description: "Curry-spiced rice vermicelli",
    cuisine: "Asian",
    duration: 20,
    servings: 2,
    equipment: ["wok"],
    seasonal: ["all"],
    ingredients: [
      "150g rice vermicelli",
      "1 tbsp curry powder",
      "2 eggs, beaten",
      "1 bell pepper, sliced",
      "100g bean sprouts",
      "2 tbsp soy sauce",
      "Spring onions"
    ],
    instructions: [
      "Soak vermicelli in hot water, drain",
      "Scramble eggs, set aside",
      "Stir-fry pepper with curry powder",
      "Add noodles, soy sauce, toss well",
      "Add eggs and bean sprouts",
      "Garnish with spring onions"
    ]
  },
  {
    name: "Japchae",
    description: "Korean glass noodles with vegetables",
    cuisine: "Korean",
    duration: 30,
    servings: 2,
    equipment: ["pot", "pan"],
    seasonal: ["all"],
    ingredients: [
      "150g sweet potato noodles (dangmyeon)",
      "100g spinach",
      "1 carrot, julienned",
      "100g mushrooms, sliced",
      "1 onion, sliced",
      "3 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tbsp sugar",
      "Sesame seeds"
    ],
    instructions: [
      "Cook noodles, drain, cut shorter",
      "Blanch spinach, squeeze dry",
      "Sauté each vegetable separately",
      "Toss noodles with soy sauce, sesame oil, sugar",
      "Combine everything, sprinkle sesame seeds"
    ]
  }
];

// Insert recipes
const insert = db.prepare(`
  INSERT INTO recipes (name, description, cuisine, duration, servings, equipment, seasonal, ingredients, instructions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const r of recipes) {
  insert.run(
    r.name,
    r.description,
    r.cuisine,
    r.duration,
    r.servings,
    JSON.stringify(r.equipment),
    JSON.stringify(r.seasonal),
    JSON.stringify(r.ingredients),
    JSON.stringify(r.instructions)
  );
}

console.log(`Seeded ${recipes.length} recipes`);
