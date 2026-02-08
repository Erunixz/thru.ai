// =============================================================================
// server/db.js — SQLite Database for Menu Items
// =============================================================================
//
// Uses better-sqlite3 for a fast, file-based SQL database.
// The menu_items table stores all items with their prices, sizes, modifiers, etc.
// On first run, seeds from the existing menu.json file.
//
// This allows easy price edits via the REST API — changes are picked up
// immediately by the next agent conversation session.
//
// =============================================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'menu.db');

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// =============================================================================
// Schema
// =============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    category      TEXT    NOT NULL,
    name          TEXT    NOT NULL UNIQUE,
    price         REAL    NOT NULL,
    description   TEXT,
    size_prices   TEXT,    -- JSON object: {"small":2.99,"medium":3.49,"large":3.99} or null
    modifiers     TEXT,    -- JSON array: ["no pickles","extra cheese"] or null
    flavors       TEXT,    -- JSON array: ["chocolate","vanilla"] or null
    combo_includes TEXT,   -- JSON array: ["Classic Burger","Medium Fries"] or null
    created_at    TEXT    DEFAULT (datetime('now')),
    updated_at    TEXT    DEFAULT (datetime('now'))
  );
`);

// =============================================================================
// Seed from menu.json (only if the table is empty)
// =============================================================================

const count = db.prepare('SELECT COUNT(*) as cnt FROM menu_items').get().cnt;

if (count === 0) {
  console.log('🌱 Seeding menu database from menu.json...');

  const menuPath = path.join(__dirname, 'menu.json');
  if (fs.existsSync(menuPath)) {
    const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

    const insert = db.prepare(`
      INSERT INTO menu_items (category, name, price, description, size_prices, modifiers, flavors, combo_includes)
      VALUES (@category, @name, @price, @description, @size_prices, @modifiers, @flavors, @combo_includes)
    `);

    const seedMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
    });

    const rows = [];
    for (const [category, items] of Object.entries(menu)) {
      for (const [name, data] of Object.entries(items)) {
        rows.push({
          category,
          name,
          price: data.price,
          description: data.description || null,
          size_prices: data.size_prices ? JSON.stringify(data.size_prices) : null,
          modifiers: data.modifiers ? JSON.stringify(data.modifiers) : null,
          flavors: data.flavors ? JSON.stringify(data.flavors) : null,
          combo_includes: data.includes ? JSON.stringify(data.includes) : null,
        });
      }
    }

    seedMany(rows);
    console.log(`✅ Seeded ${rows.length} menu items into SQLite`);
  } else {
    console.warn('⚠️  menu.json not found — database is empty');
  }
}

// =============================================================================
// Query helpers
// =============================================================================

/**
 * Get all menu items, grouped by category (same format the agent expects).
 */
function getMenuGrouped() {
  const rows = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  const grouped = {};

  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = {};

    const item = { price: row.price };
    if (row.description) item.description = row.description;
    if (row.size_prices) {
      const sp = JSON.parse(row.size_prices);
      item.sizes = Object.keys(sp);
      item.size_prices = sp;
    }
    if (row.modifiers) item.modifiers = JSON.parse(row.modifiers);
    if (row.flavors) item.flavors = JSON.parse(row.flavors);
    if (row.combo_includes) item.includes = JSON.parse(row.combo_includes);

    grouped[row.category][row.name] = item;
  }

  return grouped;
}

/**
 * Get all menu items as a flat array (for admin/API).
 */
function getAllItems() {
  return db.prepare('SELECT * FROM menu_items ORDER BY category, name').all().map(parseRow);
}

/**
 * Get a single item by ID.
 */
function getItemById(id) {
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  return row ? parseRow(row) : null;
}

/**
 * Create a new menu item.
 */
function createItem({ category, name, price, description, size_prices, modifiers, flavors, combo_includes }) {
  const result = db.prepare(`
    INSERT INTO menu_items (category, name, price, description, size_prices, modifiers, flavors, combo_includes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category, name, price,
    description || null,
    size_prices ? JSON.stringify(size_prices) : null,
    modifiers ? JSON.stringify(modifiers) : null,
    flavors ? JSON.stringify(flavors) : null,
    combo_includes ? JSON.stringify(combo_includes) : null,
  );
  return getItemById(result.lastInsertRowid);
}

/**
 * Update an existing menu item (partial update supported).
 */
function updateItem(id, updates) {
  const current = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!current) return null;

  const fields = {};
  if (updates.category !== undefined) fields.category = updates.category;
  if (updates.name !== undefined) fields.name = updates.name;
  if (updates.price !== undefined) fields.price = updates.price;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.size_prices !== undefined) fields.size_prices = updates.size_prices ? JSON.stringify(updates.size_prices) : null;
  if (updates.modifiers !== undefined) fields.modifiers = updates.modifiers ? JSON.stringify(updates.modifiers) : null;
  if (updates.flavors !== undefined) fields.flavors = updates.flavors ? JSON.stringify(updates.flavors) : null;
  if (updates.combo_includes !== undefined) fields.combo_includes = updates.combo_includes ? JSON.stringify(updates.combo_includes) : null;

  if (Object.keys(fields).length === 0) return getItemById(id);

  const setClauses = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
  fields.id = id;

  db.prepare(`UPDATE menu_items SET ${setClauses}, updated_at = datetime('now') WHERE id = @id`).run(fields);
  return getItemById(id);
}

/**
 * Delete a menu item by ID.
 */
function deleteItem(id) {
  const item = getItemById(id);
  if (!item) return null;
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  return item;
}

// Parse a raw DB row into a clean object
function parseRow(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    price: row.price,
    description: row.description,
    size_prices: row.size_prices ? JSON.parse(row.size_prices) : null,
    modifiers: row.modifiers ? JSON.parse(row.modifiers) : null,
    flavors: row.flavors ? JSON.parse(row.flavors) : null,
    combo_includes: row.combo_includes ? JSON.parse(row.combo_includes) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

module.exports = {
  db,
  getMenuGrouped,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
