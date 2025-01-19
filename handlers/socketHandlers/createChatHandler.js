const { newMessage } = require("./chatService");
const { redisClient } = require("./redisClient");

// 채팅 생성 이벤트 핸들러
const createChatHandler = async (socket, data, callback) => {
  try {
    const participants = [data.selectedUserId, data.sendUserId];
    const newChatId = await redisClient.incr('room:id:counter');

    await redisClient.hset(`room:${newChatId}`,
      'messages', `chat:${newChatId}:messages`,
      'participants', participants.join(','),
      'type', 'direct',
      'title', 'New Chat'
    );

    const message = {
      chatId: `room:${newChatId}`,
      content: data.text !== "" ? data.text : 'Welcome to the chat!'
    };

    await newMessage(socket.userId, message);

    if (typeof callback === 'function') {
      callback({ success: true, message: 'New chat created successfully', chatId: newChatId });
    }

    const chatsForUser = await getAllChatsFromUserId(socket.userId);
    socket.emit('chats', chatsForUser);
  } catch (error) {
    console.error('Error creating chat:', error);
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Failed to create chat' });
    }
  }
};

module.exports = createChatHandler;