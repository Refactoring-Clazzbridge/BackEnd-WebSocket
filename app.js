const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./lib/auth/auth');
const { initializeRedis } = require('./lib/redis/redisClient');
const { handleChatMessages, getAllChatsFromUserId, setUserOnlineStatus,
  newMessage, fetchUserData, getUserCourseId, getUsersByRoleOrCourse,
  getUsersByCourse, getUserData
} = require('./services/chatService');
const { join } = require('node:path');
const requestWithAuthToken = require('./lib/api/apiClient');
const { fetchDataFromMySQL } = require("./lib/mysql/fetchDataFromMySQL");
const { socketEventRegist } = require("./lib/socket/socketEvents");
const { initializeIo } = require("./lib/socket/ioConfig");
require("dotenv").config();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = process.env.CHAT_PORT || 3001;

function loadEnvironmentVariables() {
  require("dotenv").config();
}

function setupCors() {
  app.use(cors({
    origin: [`http://${host}:${port}`, `http://${host}:3001`],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}

async function initializeServer() {
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

loadEnvironmentVariables();
setupCors();
initializeServer();