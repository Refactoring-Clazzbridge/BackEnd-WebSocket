const {redisClient} = require("./redisClient");

async function getAllChatsFromUserId(userId) {
  try {
    const allRoomKeys = await scanAllChats();
    const roomsForUser = [];

    // console.log("all Room Keys :" ,allRoomKeys);

    for (const roomKey of allRoomKeys) {
      // console.log(`Processing roomKey: ${roomKey}`);
      const chatData = await new Promise((resolve, reject) => {
        redisClient.hgetall(roomKey, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      // console.log(`chatData for ${roomKey}:`, chatData);

      if (!chatData) {
        console.error(`No data found for key: ${roomKey}`);
        continue;
      }

      const participants = chatData.participants ? chatData.participants.split(',') : [];
      // console.log(`Participants for ${roomKey}:`, participants);

      // participants 필드에 userId가 포함되어 있는지 확인
      if (participants.includes(String(userId))) {
        const myIndex = participants.indexOf(userId);
        let yourIndex;
        if (myIndex === 0) {
          yourIndex = 1;
        } else {
          yourIndex = 0;
        }
        const sender = await new Promise((resolve, reject) => {
          redisClient.hgetall(`user:${participants[yourIndex]}`, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        })

        const messages = await new Promise((resolve, reject) => {
          redisClient.lrange(`${roomKey}:messages`, 0, -1, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        })

        // console.log(messages)

        chatData.id = roomKey;
        chatData.sender = {
          name: sender.name,
          username: sender.username,
          online: sender.online,
          avatar: sender.avatar,
        }
        chatData.messages = [
          ...messages.map((msg) => JSON.parse(msg))
        ]
        chatData.participantsData = [
          ...participants.map(async (participant) => {
            const user = await getUserData(redisClient, participant);
            return {
              id: participant,
              name: user.name,
              username: user.username,
              online: user.online,
              avatar: user.avatar,
            }
          })
        ];
        roomsForUser.push(chatData);
      }
    }

    return roomsForUser;
  } catch (err) {
    console.log(err);
  }
}

function handleChatMessages(socket, io, redisClient) {
  socket.on('chat message', (msg) => {
    //console.log('message: ' + msg);
    redisClient.rPush('messages', JSON.stringify({ user: "test", msg }));
    io.emit('chat message', msg);
  });
}

async function scanAllUsers(cursor = '0', keys = []) {
  return new Promise((resolve, reject) => {
    redisClient.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100, (err, res) => {
      if (err) return reject(err);

      const [newCursor, newKeys] = res;
      const filteredKeys = newKeys.filter(key => !key.includes(':undefined'));
      keys.push(...filteredKeys);

      if (newCursor === '0') {
        resolve(keys);
      } else {
        resolve(scanAllChats(newCursor, keys));
      }
    });
  });
}

async function getUsersByCourse(redisClient, courseId){
  const userKeys = await scanAllUsers()
//  console.log("userKeys : ", userKeys);

  const filteredUsers = [];

  for (const key of userKeys) {
    const user = await new Promise((resolve, reject) => {
      redisClient.hgetall(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })// 각 사용자 정보를 가져옴

    // role이 ROLE_ADMIN이거나 courseId가 socket.user.id와 일치하는 경우
//    console.log("user.course_id :" ,user.course_id);
//    console.log("courseId : ", courseId)
    if (String(user.course_id) === String(courseId.courseId)) {
      filteredUsers.push(user);
    }
  }

//console.log(filteredUsers)
  return filteredUsers;
};

async function getUsersByRoleOrCourse(redisClient, courseId){
  const fetchUserKeys = async (pattern = 'user:*') => {
    try {
      const keys = [];
      let cursor = '0'; // SCAN 시작 커서

      do {
        // SCAN 명령 실행
        const [newCursor, matchedKeys] = await new Promise((resolve, reject) => {
          redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 10, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        cursor = newCursor; // 커서 업데이트
        keys.push(...matchedKeys); // 매칭된 키 추가
      } while (cursor !== '0'); // SCAN이 끝날 때까지 반복

      // 숫자만 포함된 키 필터링
      const filteredKeys = keys.filter((key) => /^user:\d+$/.test(key));

      // console.log('Filtered User keys:', filteredKeys);
      return filteredKeys;
    } catch (error) {
      console.error('Error fetching user keys with SCAN:', error);
      throw error;
    }
  };

  const userKeys = await fetchUserKeys('user:*'); // 'user:*' 패턴에 맞는 키 조회
  // console.log('User Keys:', userKeys);

  const filteredUsers = [];

  for (const key of userKeys) {
    const user = await new Promise((resolve, reject) => {
      redisClient.hgetall(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })// 각 사용자 정보를 가져옴

    // role이 ROLE_ADMIN이거나 courseId가 socket.user.id와 일치하는 경우
    if (user.course_id === courseId) {
      filteredUsers.push(user);
    }
  }

  // console.log("********************")
  // console.log(filteredUsers);
  // console.log("********************")

  return filteredUsers;
};

async function getUserCourseId(redisClient, userId) {

  return new Promise((resolve, reject) => {
    redisClient.hget(`user:${userId}`, 'courseId', (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function fetchUserData(redisClient, user) {
  //console.log(user.id);

  return new Promise((resolve, reject) => {
    redisClient.hset(`user:${user.id}`, 'name', user.name, 'username', `@${user.memberId}`, 'avatar', user.avatarImage, 'role', user.role, 'courseId', user.courseId,  (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function getUserData(userId) {
  //console.log(user.id);

  return new Promise((resolve, reject) => {
    redisClient.hgetall(`user:${userId}`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function setUserOnlineStatus(userId, isOnline) {
  return new Promise((resolve, reject) => {
    redisClient.hset(`user:${userId}`, 'online', String(isOnline), (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function newMessage(userId, message) {
  const newMsgCount = await new Promise((resolve, reject) => {
    redisClient.incr(`${message.chatId}:messages:counter`, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    })
  }); // 새 채팅방 ID 생성

  const chatKey = message.chatId;
  const messageData = {
    id: newMsgCount,
    content: message.content,
    timestamp: new Date(Date.now()),
    sender: String(userId),
  };

  return new Promise((resolve, reject) => {
    redisClient.rpush(`${chatKey}:messages`, JSON.stringify(messageData), (err, result) => {
      if (err) return reject(err);
      resolve(messageData);
    });
  });
}

async function scanAllChats(cursor = '0', keys = []) {
  return new Promise((resolve, reject) => {
    redisClient.scan(cursor, 'MATCH', 'room:*', 'COUNT', 100, (err, res) => {
      if (err) return reject(err);

      const [newCursor, newKeys] = res;
      const filteredKeys = newKeys.filter(key => !key.includes(':messages'));
      const filteredKeys2 = filteredKeys.filter(key => !key.includes(':counter'));
      keys.push(...filteredKeys2);

      if (newCursor === '0') {
        resolve(keys);
      } else {
        resolve(scanAllChats(newCursor, keys));
      }
    });
  });
}



module.exports = {getUserData, getUsersByRoleOrCourse, getAllChatsFromUserId, handleChatMessages, setUserOnlineStatus, newMessage, fetchUserData , getUserCourseId, getUsersByCourse};