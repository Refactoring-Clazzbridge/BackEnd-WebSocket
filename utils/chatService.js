async function getAllChatsFromUserId(redisClient, userId) {
  try {
    const allChatKeys = await scanAllChats(redisClient);
    const chatsForUser = [];

    console.log(allChatKeys);

    for (const chatKey of allChatKeys) {
      console.log(`Processing chatKey: ${chatKey}`);
      const chatData = await new Promise((resolve, reject) => {
        redisClient.hgetall(chatKey, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      console.log(`chatData for ${chatKey}:`, chatData);

      if (!chatData) {
        console.error(`No data found for key: ${chatKey}`);
        continue;
      }

      const participants = chatData.participants ? chatData.participants.split(',') : [];
      console.log(`Participants for ${chatKey}:`, participants);

      // participants 필드에 userId가 포함되어 있는지 확인
      if (participants.includes(String(userId))) {
        const sender = await new Promise((resolve, reject) => {
          redisClient.hgetall(`user:${chatData.sender}`, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        })

        const messages = await new Promise((resolve, reject) => {
          redisClient.lrange(`${chatKey}:messages`, 0, -1, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        })

        //console.log(messages)

        chatData.id = chatKey;
        chatData.sender = {
          name: sender.name,
          username: sender.username,
          online: sender.online,
          avatar: sender.avatar,
        }
        chatData.messages = [
          ...messages.map((msg) => JSON.parse(msg))
        ]
        chatsForUser.push(chatData);
      }
    }

    return chatsForUser;
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

async function getUsersByCourse(redisClient, courseId){
  const userKeys = await new Promise((resolve, reject) => {
    redisClient.keys('user:*', (err, result) => {
      if (err) return reject(err);
      resolve(result);
    })
  })
  const filteredUsers = [];

  for (const key of userKeys) {
    const user = await new Promise((resolve, reject) => {
      redisClient.hgetall(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })// 각 사용자 정보를 가져옴

    // role이 ROLE_ADMIN이거나 courseId가 socket.user.id와 일치하는 경우
    if (user.courseId === courseId) {
      filteredUsers.push(user);
    }
  }

  return filteredUsers;
};

async function getUsersByRoleOrCourse(redisClient, courseId){
  const userKeys = await new Promise((resolve, reject) => {
    redisClient.keys('user:*', (err, result) => {
      if (err) return reject(err);
      resolve(result);
    })
  }) // 'user:*' 패턴에 맞는 모든 키 조회
  const filteredUsers = [];
  console.log(userKeys);

  for (const key of userKeys) {
    const user = await new Promise((resolve, reject) => {
      redisClient.hgetall(key, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })// 각 사용자 정보를 가져옴

    user.id = key.split(':')[1]; // user:1 -> 1

    // role이 ROLE_ADMIN이거나 courseId가 socket.user.id와 일치하는 경우
    if (user.role === 'ROLE_ADMIN' || user.courseId === courseId) {
      filteredUsers.push(user);
    }
  }

  console.log("********************")
  console.log(filteredUsers);
  console.log("********************")

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

async function setUserOnlineStatus(redisClient, userId, isOnline) {
  return new Promise((resolve, reject) => {
    redisClient.hset(`user:${userId}`, 'online', String(isOnline), (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function newMessage(redisClient, userId, message) {
  const messages = await new Promise((resolve, reject) => {
    redisClient.lrange(`${message.chatId}:messages`, 0, -1, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
  //console.log(messages);
  const messagesCount = messages.length;
  const chatKey = message.chatId;
  const messageData = {
    id: messagesCount + 1,
    content: message.message,
    timestamp: new Date(Date.now()),
    sender: userId,
  };

  return new Promise((resolve, reject) => {
    redisClient.rpush(`${chatKey}:messages`, JSON.stringify(messageData), (err, result) => {
      if (err) return reject(err);
      resolve(messageData);
    });
  });
}

async function scanAllChats(redisClient, cursor = '0', keys = []) {
  return new Promise((resolve, reject) => {
    redisClient.scan(cursor, 'MATCH', 'chat:*', 'COUNT', 100, (err, res) => {
      if (err) return reject(err);

      const [newCursor, newKeys] = res;
      const filteredKeys = newKeys.filter(key => !key.includes(':messages'));
      const filteredKeys2 = filteredKeys.filter(key => !key.includes(':counter'));
      keys.push(...filteredKeys2);

      if (newCursor === '0') {
        resolve(keys);
      } else {
        resolve(scanAllChats(redisClient, newCursor, keys));
      }
    });
  });
}



module.exports = {getUsersByRoleOrCourse, getAllChatsFromUserId, handleChatMessages, setUserOnlineStatus, newMessage, fetchUserData , getUserCourseId, getUsersByCourse};