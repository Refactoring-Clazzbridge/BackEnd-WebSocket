const axios = require('axios');

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: "http://default-back-service-e27ef-100126159-b0eb9aec7a73.kr.lb.naverncp.com:8080/api/", // 기본 URL 설정
});

// 함수로 API 호출 정의
const requestWithAuthToken = (token, method, url, data = null) => {
  return apiClient({
    method: method,
    url: url,
    data: data,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

module.exports = requestWithAuthToken;