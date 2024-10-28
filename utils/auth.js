const { verify } = require('jsonwebtoken');
const requestWithAuthToken = require('./apiClient');

async function verifyToken(token, secret) {
  return new Promise((resolve, reject) => {
    verify(token, secret, (err, user) => {
      if (err || !user) {
        console.error("JWT 검증 실패: ", err);
        return resolve(null);
      }
      resolve(user);
    });
  });
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