'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const seedAdmins = require('./utils/seedAdmins');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedAdmins();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
