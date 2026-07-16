const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const getDB = async () => {
  const file = path.join(__dirname, '../data/db.json');
  const adapter = new JSONFile(file);
  const db = new Low(adapter);
  await db.read();
  return db;
};

const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

const findProduct = async (productId) => {
  const db = await getDB();
  return db.data.products.find((p) => p.id === productId);
};

const calculateTotal = (items) => {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    sum = sum + (item.price * item.quantity);
  }
  return sum;
};

module.exports = { getDB, generateId, findProduct, calculateTotal };