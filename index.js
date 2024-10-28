const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const { verify } = require("jsonwebtoken");
const axios = require("axios");
const requestWithAuthToken = require('./utils/apiClient');
require("dotenv").config();

// Express 서버 설정
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisUrl = process.env.REDIS_URL;
const host = process.env.HOST || '127.0.0.1';
const port = process.env.CHAT_PORT || 3001;
const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
let redisClient;

app.use(cors({
  origin: ['http://' + host + ':' + port, 'http://' + host + ':' + 3001],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://default-clazz-bridge-ser-99ad8-100126125-2a266ae4e49a.kr.lb.naverncp.com:3000'], // 허용할 프론트엔드의 URL
    methods: ['GET', 'POST'],
    credentials: true,  // 쿠키 전송을 허용할지 여부
  }
});

// Redis 클라이언트 설정 (비동기 방식)
async function initializeRedis() {
  const redisClient = createClient({
    url: redisUrl,
    legacyMode: true,
  });

  // Redis 연결 확인
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  // 최신 redis는 명시적으로 connect() 필
  await redisClient.connect();
  console.log("Connected to Redis");

  // 1: 더미데이터 서버
  await redisClient.select(1);
  console.log("redis db 1 selected");

  return redisClient;
}

async function getAllChatsFromUserId(socket) {
  redisClient = await initializeRedis();
  try {
    const userInfoFromMySql = await getUserInfoFromMySql(socket, socket.user.id)
    console.log(userInfoFromMySql);
    const userInfoFromRedis = await getUserInfoFromRedis(socket.user.id);
    console.log(userInfoFromRedis);
    const allChatKeys = await scanAllChats();
    console.log(allChatKeys);

    const chatsForUser = [];

    for (const chatKey of allChatKeys) {
      // console.log(`Processing chatKey: ${chatKey}`);
      const chatData = await new Promise((resolve, reject) => {
        redisClient.hgetall(chatKey, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      // console.log(`chatData for ${chatKey}:`, chatData);

      if (!chatData) {
        console.error(`No data found for key: ${chatKey}`);
        continue;
      }

      const participants = chatData.participants ? chatData.participants.split(',') : [];
      // console.log(`Participants for ${chatKey}:`, participants);

      // console.log(`User ${socket.user.id} `);
      // participants 필드에 userId가 포함되어 있는지 확인
      if (participants.includes(String(socket.user.id))) {
        console.log(`User ${socket.user.id} is a participant in chat ${chatKey}`);
        chatsForUser.push(chatData);
      }
    }

    return chatsForUser;

  } catch (err) {
    console.log(err);
  }
}

async function scanAllChats(cursor = '0', keys = []) {
  return new Promise((resolve, reject) => {
    redisClient.scan(cursor, 'MATCH', 'chat:*', 'COUNT', 10, (err, res) => {
      if (err) return reject(err);

      const [newCursor, newKeys] = res;

      // messages가 붙은 키 제외, chat:* 만 남김
      const filteredKeys = newKeys.filter(key => !key.includes(':messages'));
      keys.push(...filteredKeys);

      if (newCursor === '0') {
        resolve(keys);
      } else {
        resolve(scanAllChats(newCursor, keys));
      }
    })
  })
}

async function getUserInfoFromRedis(userId) {
  const redisClient = await initializeRedis();

  return new Promise((resolve, reject) => {
    redisClient.hgetall(`user:${userId}`, async (err, result) => {
      if (err) return reject(err);
      else resolve(result);
    });
  })
}

async function getUserInfoFromMySql(socket, userId) {
  try {
    const response = await requestWithAuthToken(socket.token, 'get', `/user/chat/${userId}`);
    return response.data;
  } catch (err) {
    console.error(err);
  }
}

async function startServer() {
  redisClient = await initializeRedis();
  try {
    io.on('connection', (socket) => {
      console.log('a user connected, id : ', socket.id);

      socket.on('connected', (token) => {
        console.log('User connected with token : ', token);
        verify(token, JWT_SECRET, (err, user) => {
          if (err || !user || !user.id) {
            console.error("JWT 검증에 실패하였거나, 유저 정보가 존재하지 않습니다. : ",
              err || "User data missing")
            socket.emit('initError', 'Invalid token or user data missing');
            return;
          }

          socket.user = user;

          requestWithAuthToken(token, 'GET', `/user/chat/${user.id}`)
            .then(response => {
              console.log(response.data); // 서버에서 가져온 데이터 확인
              socket.token = token;
              socket.userName = response.data.name;
              socket.avatarImageUrl = response.data.avatarImageUrl;
              socket.userAccount = response.data.memberId;

              console.log('a user connected, name : ', socket.userName);
              console.log('a user connected, id : ', socket.userAccount);

              socket.emit('initCompleted');
            })
            .catch(error => {
              console.error('Error fetching user data:', error); // 오류 처리
            });

          if (err) {
            console.error(err);
          }
        });
      })

      socket.on('requestChats', async () => {
        try {
          const chatsForUser = await getAllChatsFromUserId(socket);
          console.log(chatsForUser)
          socket.emit('chats', chatsForUser);
        } catch (error) {
          console.log(error);
        }
      })

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });

      socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        // Redis에 메시지 저장
        redisClient.rPush('messages', JSON.stringify({ user: "test", msg }));
        io.emit('chat message', msg);
      });
    });

    server.listen(port, () => {
      console.log('server running at http://localhost:' + port);
    });
  } catch (error) {
    console.error('Error initializing the server:', error);
  }
}

startServer();