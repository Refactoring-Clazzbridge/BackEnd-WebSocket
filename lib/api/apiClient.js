const axios = require('axios');

// 상수 정의
const BASE_URL = process.env.BASE_URL;
const DEFAULT_METHOD = 'GET';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: BASE_URL, // 환경 변수에서 URL을 가져옴
});

// 함수로 API 호출 정의
const requestWithAuthToken = async (token, method = DEFAULT_METHOD, url, data = null) => {
  try {
    const response = await apiClient({
      method: method,
      url: url,
      data: data,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data; // 성공적인 응답 데이터 반환
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw new Error('API 호출 중 오류가 발생했습니다.');
  }
};

module.exports = requestWithAuthToken;