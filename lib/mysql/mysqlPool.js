require("dotenv").config();
const mysql = require('mysql2/promise');

let mysqlPool;

// MySQL 연결 풀 초기화 함수
async function initializePool() {
  if (!mysqlPool) {
    try {
      console.log("MYSQL_HOST :", process.env.MYSQL_HOST);
      mysqlPool = await mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
      });
    } catch (error) {
      console.error("Error initializing MySQL pool:", error);
      throw error; // 에러를 호출하는 쪽에서 처리할 수 있도록 throw
    }
  }
  return mysqlPool;
}

module.exports = { initializePool };