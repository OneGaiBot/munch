# 🍜 Munch

*What's for dinner?*

A recipe inspiration app for vegetarians. Built for quick, easy meals using ingredients available in Antwerp (Delhaize + specialty stores).

## Features

- 📱 Beautiful card-based recipe browser
- 🔍 Filter by cuisine, cooking time, equipment
- 🍟 Airfryer recipes highlighted
- ❤️ Save favorites
- 🛒 Shopping list generator
- 📐 Adjustable servings (metric units)
- 🌍 Cuisines: Japanese, Chinese, Indian, Thai, Italian, Middle Eastern, Mexican, Korean

## Running

```bash
npm install
npm run seed   # Populate recipes
npm start
```

Access at: `http://localhost:3002` or `http://Eliass-Mac-mini.local:3002`

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Frontend:** Vanilla HTML/CSS/JS

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List recipes (filters: cuisine, maxDuration, equipment, search, favorites) |
| GET | `/api/recipes/:id` | Get single recipe |
| GET | `/api/cuisines` | List all cuisines |
| POST | `/api/favorites/:recipeId` | Toggle favorite |
| GET | `/api/shopping-list` | Get shopping list |
| POST | `/api/shopping-list/from-recipe/:id` | Add recipe ingredients to list |
| PATCH | `/api/shopping-list/:id` | Toggle item checked |
| DELETE | `/api/shopping-list/:id` | Remove item |
