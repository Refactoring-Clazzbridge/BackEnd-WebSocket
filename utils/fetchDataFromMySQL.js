const {redisClient} = require('./redisClient');
const {initializePool} = require('./mysqlPool');

async function fetchDataFromMySQL() {
  let mysqlPool = await initializePool();

  try {
    // MySQL에서 USER 데이터 추출
    const [rows] = await mysqlPool.query(`
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
    `);

    // Redis에 데이터 set
    for (const row of rows) {
      const redisKey = `user:${row.id}`
      // legacyMode에서는 필드와 값을 각각 전달해야 함
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
    console.log("Data fetch complete");
  } catch (error) {
    console.error("Error fetching data from MySQL or setting data in Redis: ", error);
  } finally {
    // await mysqlPool.end();
  }
}

module.exports = {fetchDataFromMySQL};