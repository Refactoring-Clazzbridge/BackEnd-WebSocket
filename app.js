const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./utils/auth');
const { initializeRedis } = require('./utils/redisClient');
const { handleChatMessages, getAllChatsFromUserId, setUserOnlineStatus,
  newMessage, fetchUserData, getUserCourseId, getUsersByRoleOrCourse,
  getUsersByCourse, getUserData
} = require('./utils/chatService');
const { join } = require('node:path');
const requestWithAuthToken = require('./utils/apiClient');
const {fetchDataFromMySQL} = require("./utils/fetchDataFromMySQL");
const {socketEventRegist} = require("./utils/socketEvents");
const {initializeIo} = require("./utils/ioConfig");
require("dotenv").config();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = process.env.CHAT_PORT || 3001;

app.use(cors({
  origin: [`http://${host}:${port}`, `http://${host}:3001`],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

async function startServer() {
  try {
    await initializeRedis();
    await fetchDataFromMySQL();

    const server = createServer(app);
    initializeIo(server);

    server.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();