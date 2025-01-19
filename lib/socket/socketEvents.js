const socketMiddleware = require("./socketMiddleware");
const registerHandler = require("../../handlers/socketHandlers/registerHandler");
const fetchDataHandler = require("../../handlers/socketHandlers/fetchDataHandler");
const requestChatsHandler = require("../../handlers/socketHandlers/requestChatsHandler");
const newMessageHandler = require("../../handlers/socketHandlers/newMessageHandler");
const createChatHandler = require("../../handlers/socketHandlers/createChatHandler");
const getAvailableUsersHandler = require("../../handlers/socketHandlers/getAvailableUsersHandler");
const disconnectHandler = require("../../handlers/socketHandlers/disconnectHandler");
const fetchChatUserDataHandler = require("../../handlers/socketHandlers/fetchChatUserDataHandler");
const fetchStudentDataHandler = require("../../handlers/socketHandlers/fetchStudentDataHandler");
const getUserDataHandler = require("../../handlers/socketHandlers/getUserDataHandler");
const understandingHandler = require("../../handlers/socketHandlers/understandingHandler");
const raiseHandHandler = require("../../handlers/socketHandlers/raiseHandHandler");

function socketEventRegist(socket, io) {
  // 소켓 미들웨어 등록
  socket.use(socketMiddleware);

  socket.on('register', (data) => registerHandler(socket, data));
  socket.on('fetchData', (token) => fetchDataHandler(socket, token));
  socket.on('requestChats', () => requestChatsHandler(socket));
  socket.on('newMessage', (message) => newMessageHandler(socket, message));
  socket.on('createChat', (data, callback) => createChatHandler(socket, data, callback));
  socket.on('getAvailableUsers', (data, callback) => getAvailableUsersHandler(socket, data, callback));
  socket.on('disconnect', () => disconnectHandler(socket));
  socket.on('fetchChatUserData', () => fetchChatUserDataHandler(socket));
  socket.on('fetchStudentData', (courseId) => fetchStudentDataHandler(socket, courseId));
  socket.on('getUserData', (userId) => getUserDataHandler(socket, userId));
  socket.on('understanding', (understanding) => understandingHandler(socket, understanding));
  socket.on('raiseHand', (raiseHand) => raiseHandHandler(socket, raiseHand));
}

module.exports = { socketEventRegist };