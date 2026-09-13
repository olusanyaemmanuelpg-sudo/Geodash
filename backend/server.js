require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const connectDB = require('./config/db.js');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const Redis = require('ioredis');

const client = new Redis({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST_URL || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

client.on('error', (err) => console.error('Redis Client Error:', err.message));

async function startServer() {
  try {
    await client.connect();
    console.log('Redis Client Connected');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
