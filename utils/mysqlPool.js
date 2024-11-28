require("dotenv").config();
const mysql = require('mysql2/promise');

let mysqlPool;

async function initializePool() {
  if (!mysqlPool) {
    console.log("MYSQL_HOST :", process.env.MYSQL_HOST);
    mysqlPool = await mysql.createPool({
      host:process.env.MYSQL_HOST,
      port:process.env.MYSQL_PORT,
      user:process.env.MYSQL_USER,
      password:process.env.MYSQL_PASSWORD,
      database:process.env.MYSQL_DB,
    });
  }
  return mysqlPool;
}

module.exports = {initializePool};