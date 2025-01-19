const { newMessage } = require("./chatService");

// 새 메시지 이벤트 핸들러
const newMessageHandler = async (socket, message) => {
  try {
    const newMessageResult = await newMessage(socket.userId, message);
    io.to(message.chatId).emit('newMessages', newMessageResult);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

module.exports = newMessageHandler;