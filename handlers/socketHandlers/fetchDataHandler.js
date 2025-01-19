const requestWithAuthToken = require("./apiClient");
const { redisClient } = require("./redisClient");

// 데이터 가져오기 이벤트 핸들러
const fetchDataHandler = async (socket, token) => {
  try {
    const response = await requestWithAuthToken(token, 'GET', `/user/all`);
    response.data.forEach(user => fetchUserData(redisClient, user));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

module.exports = fetchDataHandler;