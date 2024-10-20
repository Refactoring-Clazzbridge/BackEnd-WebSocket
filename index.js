const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis'); // 최신 redis 모듈

// Express 서버 설정
const host = process.env.HOST || '127.0.0.1';
const port = process.env.CHAT_PORT || 3001;
const app = express();
app.use(cors({
  origin: ['http://'+host+':'+port,'http://'+host+':'+3001],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3001'], // 허용할 프론트엔드의 URL
    methods: ['GET', 'POST'],
    credentials: true,  // 쿠키 전송을 허용할지 여부
  }
});

app.get('/chat', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Redis 클라이언트 설정 (비동기 방식)
async function initializeRedis() {
  const redisClient = createClient({
    url: 'redis://redisc-po67e.vpc-cdb.ntruss.com:6379', // Redis URL을 명확하게 설정
    legacyMode: true,
  });

  // Redis 연결 확인
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  await redisClient.connect();  // 최신 redis는 명시적으로 connect() 필요

  console.log('Redis client is connected');

  return redisClient;
}

async function startServer() {
  try {
    const redisClient = await initializeRedis();
    io.on('connection', (socket) => {
      console.log('a user connected, id : ', socket.id);

      socket.on('connected', (token) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            console.error(err);
          }
          console.log('a user connected, name : ', user);
        });
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