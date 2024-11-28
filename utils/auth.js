const { verify } = require('jsonwebtoken');
const requestWithAuthToken = require('./apiClient');
require("dotenv").config();

// 토큰 검증 함수
function verifyToken(token) {
  try {
    return verify(token, process.env.JWT_SECRET); // 유효한 경우 디코딩된 토큰 반환
  } catch (error) {
    console.error("Invalid Token:", error.message);
    return null; // 유효하지 않은 경우 null 반환
  }
}

async function getUserInfoFromMySql(token, userId) {
  try {
    const response = await requestWithAuthToken(token, 'GET', `/user/chat/${userId}`);
    return response.data;
  } catch (err) {
    console.error(err);
  }
}

module.exports = { verifyToken, getUserInfoFromMySql };