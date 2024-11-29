const {verifyToken} = require("./auth");
const {
  getUserCourseId,
  setUserOnlineStatus,
  getAllChatsFromUserId,
  fetchUserData,
  newMessage,
  getUserData,
  getUsersByRoleOrCourse,
  getUsersByCourse
} = require("./chatService");
const requestWithAuthToken = require("./apiClient");
const {redisClient} = require("./redisClient");
const JWT_SECRET = process.env.JWT_SECRET;

function socketEventRegist(socket, io) {
  // 모든 이벤트를 가로채는 미들웨어
  socket.use((packet, next) => {
    const [event, data] = packet;

    // 데이터에서 토큰 추출
    const token = data?.token;

    if (!token) {
      console.error("No token provided");
      return next(new Error("Authentication error"));
    }

    // 토큰 유효성 검사
    const decoded = verifyToken(token);
    // console.log("decoding 된 토큰 : ", decoded);
    if (!decoded) {
      console.error("Invalid token");
      return next(new Error("Authentication error"));
    }

    // 토큰이 유효한 경우 다음 핸들러로 진행
    next();
  });

  socket.on('register', async(data) => {
    // console.log(data);

    const userData = await new Promise((resolve, reject) => {
      redisClient.hgetall(`user:${data.userId}`, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })

    if (!userData) {
      console.log("No data found for user:", data.userId);
      return null;
    }

    socket.user = userData;
    socket.userId = data.userId;

    try {
      await setUserOnlineStatus(socket.userId, true);
      console.log("유저 온라인 상태 set true")
    } catch (e) {
      console.error("유저 상태 변경 중 오류 발생 : ", e);
    }

    try {
      // 사용자에게 참여 중인 채팅방 목록을 가져와 입장시킴
      const roomsForUser = await getAllChatsFromUserId(socket.userId);
      // console.log('Rooms for user:', roomsForUser);
      
      roomsForUser.forEach(room => {
        const roomId = `${room.id}`;
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });
    } catch (error) {
      console.error('Error during init: ', error);
    }

    socket.emit('initCompleted');
  });

  socket.on('fetchData', async (token) => {
    requestWithAuthToken(token, 'GET', `/user/all`).then((response) => {
      console.log(response.data);
      response.data.map((user) => {
        fetchUserData(redisClient, user);
      });
    }).catch((error) => {
      console.error(error);
    });
  });

  socket.on('requestChats', async () => {
    try {
      const chatsForUser = await getAllChatsFromUserId(socket.userId);
      console.log(chatsForUser);
      console.log("채팅방 불러오기 성공")
      socket.emit('chats', chatsForUser);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('newMessage', async (message) => {
    try {
      const newMessageResult = await newMessage(socket.userId, message);
      console.log('New message:', newMessageResult);
      console.log('Sending to room:', message.chatId);
      
      // 해당 방의 모든 소켓 확인
      const sockets = await io.in(message.chatId).fetchSockets();
      console.log(`Number of sockets in room ${message.chatId}:`, sockets.length);

      // 특정 채팅방에 있는 사용자들에게만 메시지 전송
      io.to(message.chatId).emit('newMessages', newMessageResult);
      // socket.emit('newMessages', newMessageResult);
    } catch (e) {
      console.error('Error sending message:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
    try {
      setUserOnlineStatus(socket.userId, false);
      console.log("유저 온라인 상태 set false")
    } catch (e) {
      console.error(e);
    }
  });

  // 사용자가 새로운 채팅방을 생성할 때 사용
  socket.on('createChat', async (data, callback) => {
    try {
      const participants = [data.selectedUserId, data.sendUserId]; // participants는 사용자 ID 배열입니다
      const newChatId = await new Promise((resolve, reject) => {
        redisClient.incr('room:id:counter', (err, result) => {
          if (err) return reject(err);
          resolve(result);
        })
      }); // 새 채팅방 ID 생성

      // Redis에 새 채팅방 저장
      await redisClient.hset(`room:${newChatId}`,
          'messages', `chat:${newChatId}:messages`,
          'participants', participants.join(','),
          'type', 'direct',
          'title', 'New Chat'
      );
      const message = {
        chatId: `room:${newChatId}`,
        content: data.text !== "" ? data.text : 'Welcome to the chat!'
      }

      await newMessage(socket.userId, message);

      // await redisClient.rpush(`room:${newChatId}:messages`, JSON.stringify({
      //   id: '1',
      //   sender: data.sendUserId,
      //   content: data.text !== "" ? data.text : 'Welcome to the chat!',
      //   timestamp: new Date(Date.now())
      // }));

      // 콜백이 함수인 경우에만 호출
      if (typeof callback === 'function') {
        callback({ success: true, message: 'New chat created successfully', chatId: newChatId });
      }

      const chatsForUser = await getAllChatsFromUserId(socket.userId);
      console.log(chatsForUser);
      console.log("채팅방 불러오기 성공")
      socket.emit('chats', chatsForUser);

    } catch (error) {
      console.error('Error creating chat:', error);
      // 콜백이 함수인 경우에만 호출
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Failed to create chat' });
      }
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

  socket.on('getUserData', async (userId) => {
    try {
      const userData = await getUserData(redisClient, userId);
      console.log(userData);
      socket.emit('gotUserData', userData);
    } catch(error) {
      console.error('Error fetching user data:', error);
    }
  })

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
      const studentData = await getUsersByRoleOrCourse(redisClient, socket.user.course_id);
      // console.log(studentData);
      socket.emit('fetchedChatUserData', studentData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  })

  socket.on('fetchStudentData', async (courseId) => {
    try {
      const studentData = await getUsersByCourse(redisClient, courseId);
      console.log(studentData, "gigi");
      socket.emit('fetchedStudentData', studentData);
//      socket.emit('fetchedCourseStudentData', studentData);

    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  })

}

module.exports = {socketEventRegist}