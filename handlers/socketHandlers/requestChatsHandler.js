const { getAllChatsFromUserId } = require("./chatService");

// 채팅 요청 이벤트 핸들러
const requestChatsHandler = async (socket) => {
  try {
    const chatsForUser = await getAllChatsFromUserId(socket.userId);
    socket.emit('chats', chatsForUser);
  } catch (error) {
    console.error('Error requesting chats:', error);
  }
};

module.exports = requestChatsHandler;