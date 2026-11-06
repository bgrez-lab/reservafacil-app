const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('bufferCommands', false);

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI es obligatorio');
  }
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('Conectado a MongoDB');
}

module.exports = { mongoose, connectDatabase, MONGODB_URI };
