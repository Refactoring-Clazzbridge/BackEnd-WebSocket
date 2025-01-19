const { redisClient } = require("./redisClient");
const getUserData = require("./userService").getUserData;

// 사용자 ID로 모든 채팅을 가져오는 함수
const getAllChatsFromUserId = async (userId) => {
  try {
    const allRoomKeys = await scanAllChats();
    const roomsForUser = [];

    for (const roomKey of allRoomKeys) {
      const chatData = await new Promise((resolve, reject) => {
        redisClient.hgetall(roomKey, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      if (!chatData) {
        console.error(`No data found for key: ${roomKey}`);
        continue;
      }

      const participants = chatData.participants ? chatData.participants.split(',') : [];
      if (participants.includes(String(userId))) {
        const myIndex = participants.indexOf(userId);
        const yourIndex = myIndex === 0 ? 1 : 0;

        const sender = await getUserData(participants[yourIndex]);
        const messages = await new Promise((resolve, reject) => {
          redisClient.lrange(`${roomKey}:messages`, 0, -1, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        chatData.id = roomKey;
        chatData.sender = {
          name: sender.name,
          username: sender.username,
          online: sender.online,
          avatar: sender.avatar,
        };
        chatData.messages = messages.map((msg) => JSON.parse(msg));
        roomsForUser.push(chatData);
      }
    }

    return roomsForUser;
  } catch (err) {
    console.log(err);
  }
};

module.exports = getAllChatsFromUserId;