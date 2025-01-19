const { getUsersByCourse } = require("./chatService");

// 학생 데이터 가져오기 핸들러
const fetchStudentDataHandler = async (socket, courseId) => {
  try {
    const studentData = await getUsersByCourse(redisClient, courseId);
    socket.emit('fetchedStudentData', studentData);
  } catch (error) {
    console.error('Error fetching student data:', error);
  }
};

module.exports = fetchStudentDataHandler;