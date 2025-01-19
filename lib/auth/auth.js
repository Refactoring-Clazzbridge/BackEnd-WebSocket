const { verify } = require('jsonwebtoken');
const requestWithAuthToken = require('../api/apiClient');
require("dotenv").config();

// 상수 정의
const JWT_SECRET = process.env.JWT_SECRET;

// 토큰 검증 함수
function verifyToken(token) {
  try {
    return verify(token, JWT_SECRET); // 유효한 경우 디코딩된 토큰 반환
  } catch (error) {
    console.error("Invalid Token:", error.message);
    return null; // 유효하지 않은 경우 null 반환
  }
}

// MySQL에서 사용자 정보 가져오기
async function getUserInfoFromMySql(token, userId) {
  try {
    const response = await requestWithAuthToken(token, 'GET', `/user/chat/${userId}`);
    return response.data; // 성공적인 응답 데이터 반환
  } catch (err) {
    console.error("Failed to get user info:", err);
    throw new Error("사용자 정보를 가져오는 데 실패했습니다."); // 에러를 호출하는 쪽에서 처리할 수 있도록 throw
  }
}

module.exports = { verifyToken, getUserInfoFromMySql };