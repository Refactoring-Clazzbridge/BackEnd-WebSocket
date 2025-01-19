const { redisClient } = require('../redis/redisClient');
const { initializePool } = require('../mysqlPool');

// SQL 쿼리 상수 정의
const FETCH_USERS_QUERY = `
  SELECT
      m.id,
      ai.avatar_image_url,
      mt.type,
      m.member_id,
      m.name,
      sc.course_id
  FROM
      member m
          LEFT JOIN avatar_image ai ON m.avatar_image_id = ai.id
          LEFT JOIN member_type mt ON m.member_type_id = mt.id
          LEFT JOIN student_course sc ON m.id = sc.student_id;
`;

// Redis에 사용자 데이터를 설정하는 함수
async function setUserDataInRedis(row) {
  const redisKey = `user:${row.id}`;
  await redisClient.hSet(
    redisKey,
    'id', row.id || '',
    'member_id', row.member_id || '',
    'name', row.name || '',
    'member_type', row.type || '',
    'avatar_image_url', row.avatar_image_url || '',
    'course_id', row.course_id ? String(row.course_id) : ''
  );
}

// MySQL에서 데이터 가져오는 함수
async function fetchDataFromMySQL() {
  let mysqlPool = await initializePool();

  try {
    // MySQL에서 USER 데이터 추출
    const [rows] = await mysqlPool.query(FETCH_USERS_QUERY);

    // Redis에 데이터 설정
    await Promise.all(rows.map(row => setUserDataInRedis(row)));

    console.log("Data fetch complete");
  } catch (error) {
    console.error("Error fetching data from MySQL or setting data in Redis: ", error);
    throw error; // 에러를 호출하는 쪽에서 처리할 수 있도록 throw
  } finally {
    await mysqlPool.end(); // MySQL 연결 종료
  }
}

module.exports = { fetchDataFromMySQL };