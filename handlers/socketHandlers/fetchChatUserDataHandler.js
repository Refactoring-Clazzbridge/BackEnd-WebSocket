const { getUsersByRoleOrCourse } = require("./chatService");

// 채팅 사용자 데이터 가져오기 핸들러
const fetchChatUserDataHandler = async (socket) => {
  try {
    const studentData = await getUsersByRoleOrCourse(redisClient, socket.user.course_id);
    socket.emit('fetchedChatUserData', studentData);
  } catch (error) {
    console.error('Error fetching chat user data:', error);
  }
};

module.exports = fetchChatUserDataHandler;