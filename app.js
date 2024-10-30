const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const cors = require('cors');
const { verifyToken } = require('./utils/auth');
const { initializeRedis } = require('./utils/redisClient');
const { handleChatMessages, getAllChatsFromUserId, setUserOnlineStatus,
  newMessage, fetchUserData, getUserCourseId, getUsersByRoleOrCourse,
  getUsersByCourse
} = require('./utils/chatService');
const { join } = require('node:path');
const requestWithAuthToken = require('./utils/apiClient');
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
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

async function startServer() {
  const redisClient = await initializeRedis();

  io.on('connection', (socket) => {
    console.log('a user connected, socket id : ', socket.id);

    socket.on('token', async (token) => {
      const user = await verifyToken(token, JWT_SECRET);
      if (!user) {
        console.error("유효하지 않은 토큰입니다.")
        return;
      }
      const courseId = await getUserCourseId(redisClient, user.id);

      console.log(token)
      // console.log(user)
      socket.user = user;
      socket.token = token;
      socket.courseId = courseId;
      socket.join(courseId);
      // console.log(socket)
      // console.log(socket.courseId)
      // console.log(socket.token)
      // console.log(socket.user)

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

    socket.on('fetchData', async (token) => {
      requestWithAuthToken(token, 'GET', `/user/all`).then((response) => {
        //console.log(response.data);
        response.data.map((user) => {
          fetchUserData(redisClient, user);
        });
      }).catch((error) => {
        console.error(error);
      });
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
        io.emit('newMessages', newMessageResult);
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('disconnect', () => {
      console.log(`${socket.user} disconnected`);
      try {
        setUserOnlineStatus(redisClient, socket.user.id, false);
        console.log("유저 온라인 상태 set false")
      } catch (e) {
        console.error(e);
      }
    });

    // 사용자가 새로운 채팅방을 생성할 때 사용
    socket.on('createChat', async (data, callback) => {
      try {
        const participants = data.username; // participants는 사용자 ID 배열입니다
        const newChatId = await new Promise((resolve, reject) => {
          redisClient.incr('chat:id:counter', (err, result) => {
            if (err) return reject(err);
            resolve(result);
          })
        }); // 새 채팅방 ID 생성

        console.log(participants);

        // Redis에 새 채팅방 저장
        await redisClient.hset(`chat:${newChatId}`,
            'sender', String(participants[1]), // 첫 번째 사용자를 sender로 설정
          'messages', `chat:${newChatId}:messages`,
          'participants', participants.join(','),
          'type', 'direct',
          'title', 'New Chat'
        );

        await redisClient.rpush(`chat:${newChatId}:messages`, JSON.stringify({
          id: '1',
          sender: String(participants[1]),
          content: data.text,
          timestamp: new Date(Date.now())
        }));

        callback({ success: true, message: 'New chat created successfully', chatId: newChatId });
      } catch (error) {
        console.error('Error creating chat:', error);
        callback({ success: false, message: 'Failed to create chat' });
      }
    });

    // 현재 사용자의 채팅 파트너를 제외한 사용자 목록 요청
    socket.on('getAvailableUsers', async (data, callback) => {
      try {
        const { userId } = data;
        const existingChatUserIds = []; // Redis에서 현재 사용자의 채팅 파트너 ID 가져오기 (로직 필요)

        // 모든 사용자 ID 가져오기 (필요에 따라 수정)
        const allUsers = await redisClient.smembers('users');
        const availableUsers = allUsers.filter(
            (id) => !existingChatUserIds.includes(id) && id !== userId
        );

        callback({ success: true, availableUsers });
      } catch (error) {
        console.error('Error fetching available users:', error);
        callback({ success: false, message: 'Failed to fetch available users' });
      }
    });

    socket.on('understanding', (understanding) => {

      try {
        redisClient.hset(`user:${socket.user.id}`, 'understanding', String(understanding));
      } catch (error) {
        console.error('Error setting understanding:', error);
      }
      console.log('understanding:', understanding);
    });

    socket.on('raiseHand', (raiseHand) => {
      //console.log(socket.token)
      //console.log(socket.user)
      try {
        redisClient.hset(`user:${socket.user.id}`, 'raiseHand', String(raiseHand));
        setTimeout(() => {
          redisClient.hset(`user:${socket.user.id}`, 'raiseHand', String(false));
        }, 15000);
      } catch (error) {
        console.error('Error setting raiseHand:', error);
      }
      console.log('raiseHand:', raiseHand);
    });

    socket.on('fetchChatUserData', async () => {
      try {
        const studentData = await getUsersByRoleOrCourse(redisClient, socket.courseId);
        console.log(studentData);
        socket.emit('fetchedChatUserData', studentData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    })

    socket.on('fetchStudentData', async (courseId) => {
      try {
        const studentData = await getUsersByCourse(redisClient, courseId);
        console.log(studentData);
        socket.emit('fetchedCourseStudentData', studentData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    })

    handleChatMessages(socket, io, redisClient);
  });

  server.listen(port, () => {
    console.log('server running at http://localhost:' + port);
  });
}

startServer();