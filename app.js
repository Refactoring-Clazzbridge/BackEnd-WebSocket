const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./utils/auth');
const { initializeRedis } = require('./utils/redisClient');
const { handleChatMessages, getAllChatsFromUserId, setUserOnlineStatus,
  newMessage
} = require('./utils/chatService');
const { join } = require('node:path');
require("dotenv").config();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = process.env.CHAT_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.use(cors({
  origin: [`http://${host}:${port}`, `http://${host}:3001`],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://default-clazz-bridge-ser-99ad8-100126125-2a266ae4e49a.kr.lb.naverncp.com:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

async function startServer() {
  const redisClient = await initializeRedis();

  io.on('connection', (socket) => {
    console.log('a user connected, socket id : ', socket.id);

    // socket.on('connected', async (token) => {
    //   const user = await verifyToken(token, JWT_SECRET);
    //   if (!user) {
    //     socket.emit('initError', 'Invalid token');
    //     return;
    //   }
    //   socket.user = user;
    //
    //   try {
    //     const setUserStatus = await setUserOnlineStatus(redisClient, socket.user.id,
    //         true);
    //     console.log(setUserStatus);
    //     console.log("유저 온라인 상태 set")
    //   } catch (e) {
    //     console.error(e);
    //   }
    //
    //   try {
    //     socket.emit('initCompleted');
    //   } catch (error) {
    //     console.error('Error during init: ', error);
    //   }
    // });

    socket.on('token', async (token) => {
      const user = await verifyToken(token, JWT_SECRET);
      if (!user) {
        console.error("유효하지 않은 토큰입니다.")
        return;
      }
      console.log(token)
      console.log(user)
      socket.user = user;
      socket.token = token;

      try {
        const setUserStatus = await setUserOnlineStatus(redisClient, socket.user.id,
          true);
        console.log("유저 온라인 상태 set true")
      } catch (e) {
        console.error(e);
      }

      try {
        // 사용자에게 참여 중인 채팅방 목록을 가져와 입장시킴
        const chatsForUser = await getAllChatsFromUserId(redisClient, socket.user.id);
        chatsForUser.forEach(chat => {
          socket.join(`room-${chat.id}`);
        });

        socket.emit('initCompleted');
      } catch (error) {
        console.error('Error during init: ', error);
      }

      try {
        socket.emit('initCompleted');
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('requestChats', async () => {
      try {
        const chatsForUser = await getAllChatsFromUserId(redisClient, socket.user.id);
        console.log(chatsForUser);
        console.log("채팅방 불러오기 성공")
        socket.emit('chats', chatsForUser);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('newMessage', async (message) => {
      try {
        const newMessageResult = await newMessage(redisClient, socket.user.id, message);
        console.log(newMessageResult);
        console.log("메시지 입력", message)

        // 특정 채팅방에 있는 사용자들에게만 메시지 전송
        io.to(`room-${message.chatId}`).emit('newMessages', newMessageResult);
      } catch (e) {
        console.error(e);
      }
    });

    handleChatMessages(socket, io, redisClient);

    socket.on('disconnect', () => {
      console.log(`${socket.user} disconnected`);
      try {
        setUserOnlineStatus(redisClient, socket.user.id, false);
        console.log("유저 온라인 상태 set false")
      } catch (e) {
        console.error(e);
      }
    });
  });

  server.listen(port, () => {
    console.log('server running at http://localhost:' + port);
  });
}

startServer();