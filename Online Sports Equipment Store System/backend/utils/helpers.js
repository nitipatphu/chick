const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// Database
const getDB = async () => {
  const file = path.join(__dirname, '../data/db.json');
  const adapter = new JSONFile(file);
  const db = new Low(adapter);
  await db.read();
  return db;
};

// auto id
const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// find product by id
const findProduct = async (productId) => {
  const db = await getDB();
  return db.data.products.find(p => p.id === productId);
};

// calculate total price of items in cart
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

module.exports = { getDB, generateId, findProduct, calculateTotal };