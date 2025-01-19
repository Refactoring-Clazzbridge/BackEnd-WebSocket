const getAllChatsFromUserId = require("./chatHandlers/getAllChatsFromUserId");
const handleChatMessages = require("./chatHandlers/handleChatMessages");
const newMessage = require("./chatHandlers/newMessageHandler");
const scanAllChats = require("./chatHandlers/scanAllChats");

module.exports = { getAllChatsFromUserId, handleChatMessages, newMessage, scanAllChats };