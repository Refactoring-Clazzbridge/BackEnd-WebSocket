const express = require('express');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const redis = require('redis');
const cors = require('cors');
const {WebSocketServer} = require("ws");





//
// // Express 서버 설정
// const app = express();
// app.use(cors({
//   origin: 'http://localhost:3000', // 요청을 허용할 도메인 (프론트엔드 주소)
//   methods: ['GET', 'POST'], // 허용할 HTTP 메서드
//   allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
// }));
// const port = 3000;
//
// // JWT 비밀 키 설정
// const JWT_SECRET = 'c2V1bGtpYW5nIHN0cmluZyBmb3IgYmFzZTY0IGVuY29kaW5n';
//
// // Redis 클라이언트 설정
// const redisClient = redis.createClient({
//   host: 'redisc-po67e.vpc-cdb.ntruss.com',  // Redis 서버 호스트 주소
//   port: 6379,               // Redis 서버 포트 번호 (기본값: 6379)
// });
//
// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });
//
// redisClient.on('ready', () => {
//   console.log('Redis client is ready');
// });
//
// redisClient.on('error', (err) => {
//   console.error('Redis connection error:', err);
// });
//
// redisClient.on('end', () => {
//   console.log('Redis connection closed');
// });
//
// // WebSocket 서버 생성
// const wss = new WebSocketServer({noServer: true});
//
// // 미들웨어: JWT 토큰 검증
// const authenticateJWT = (req, res, next) => {
//   const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
//   if (token) {
//     jwt.verify(token, JWT_SECRET, (err, user) => {
//       if (err) {
//         console.log('JWT verification failed:', err); // 오류 로그 추가
//         return res.sendStatus(403);
//       }
//       req.user = user;
//       next();
//     });
//   } else {
//     console.log('No token found, rejecting connection'); // 로그 추가
//     res.sendStatus(401);
//   }
// };
//
// // WebSocket 연결 처리
// wss.on('connection', (ws, req) => {
//   console.log('WebSocket connection established'); // 로그 추가
//   ws.on('message', (msg) => {
//     const parsedMessage = JSON.parse(msg);
//     const {token, content} = parsedMessage;
//
//     jwt.verify(token, JWT_SECRET, (err, user) => {
//       if (err) {
//         console.log('JWT verification failed:', err); // 오류 로그 추가
//         return ws.send(JSON.stringify(err) + "error: Invalid Token");
//       }
//
//       redisClient.rPush('messages', JSON.stringify({user: user.username, content}));
//
//       wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({ user: user.username, content }));
//         }
//       });
//     });
//   });
//
//   ws.send(JSON.stringify({ message: "Connected to WebSocket server" }));
// });
//
// const server = app.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });
//
// server.on('upgrade', (request, socket, head) => {
//   const params = new URLSearchParams(request.url.split('?')[1]);
//
//   const token = params.get('token');
//   console.log('Incoming WebSocket connection with token:', token); // 로그 추가
//   if (token) {
//     jwt.verify(token, JWT_SECRET, (err, user) => {
//       if (err) {
//         console.log('JWT verification failed:', err); // 오류 로그 추가
//         socket.destroy();
//       } else {
//         wss.handleUpgrade(request, socket, head, (ws) => {
//           wss.emit('connection', ws, request);
//         });
//       }
//     });
//   } else {
//     console.log('No token found, rejecting connection'); // 로그 추가
//     socket.destroy();
//   }
// });
//
// // JWT 토큰 발급 API
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//
//   // 여기서 실제 사용자 인증 로직을 추가
//   const user = { username: username }; // 예시로 간단히 사용자 이름만 저장
//
//   // JWT 토큰 발급
//   const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
//   res.json({ token });
// });
//
// // Redis에 저장된 메시지 불러오는 API
// app.get('/messages', authenticateJWT, (req, res) => {
//   redisClient.lRange('messages', 0, -1, (err, messages) => {
//     if (err) {
//       console.error('Redis error:', err); // 오류 로그 추가
//       return res.sendStatus(500);
//     }
//     res.json(messages.map(msg => JSON.parse(msg)));
//   });
// });