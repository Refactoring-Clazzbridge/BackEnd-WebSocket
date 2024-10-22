const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const {verify} = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

// Express 서버 설정
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisUrl = process.env.REDIS_URL;
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
    origin: ['http://localhost:3000'], // 허용할 프론트엔드의 URL
    methods: ['GET', 'POST'],
    credentials: true,  // 쿠키 전송을 허용할지 여부
  }
});

app.get('/chat', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const getUserName = async (id) => {
  // 백엔드 서버에서 회원 정보를 가져오는 API
  app.get(`/user/${id}`, (req, res) => {
    res.json({ username: results[0].username });
    // MySQL에서 회원 정보 조회
    db.query('SELECT username FROM users WHERE id = ?', [userId], (error, results) => {
      if (error) {
        return res.status(500).send('Server error');
      }
      if (results.length > 0) {

      } else {
        res.status(404).send('User not found');
      }
    });
  });
}

const get = () => {

}

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: "http://localhost:8080/api/", // 기본 URL 설정
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
        verify(token, 'c2V1bGtpYW5nIHN0cmluZyBmb3IgYmFzZTY0IGVuY29kaW5n', (err, user) => {

          // 요청 인터셉터 설정: 모든 요청에 Authorization 헤더를 자동으로 추가
          apiClient.interceptors.request.use(
              (config) => {
                if (token) {
                  config.headers["Authorization"] = `Bearer ${token}`; // Authorization 헤더에 토큰 추가
                }
                return config; // 요청 계속 진행
              },
              (error) => {
                return Promise.reject(error); // 요청 에러 처리
              }
          );

          console.log(user, token);
          apiClient.get(`/user/chat/${user.id}`)
          .then(response => {
            console.log(response.data); // 서버에서 가져온 데이터 확인
          })
          .catch(error => {
            console.error('Error fetching user data:', error); // 오류 처리
          });
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