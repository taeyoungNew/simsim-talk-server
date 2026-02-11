// import {
//   DB_DATABASE,
//   DB_HOST,
//   DB_PASSWORD,
//   DB_USERNAME,
//   DB_PORT,
//   DB_DIALECT,
// } from "../config";

require("dotenv").config();

module.exports = {
  username: process.env.MYSQLUSER
    ? process.env.MYSQLUSER
    : process.env.DB_USERNAME,
  password: process.env.MYSQLPASSWORD
    ? process.env.MYSQLPASSWORD
    : process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE
    ? process.env.MYSQLDATABASE
    : process.env.DB_DATABASE,
  host: process.env.MYSQLHOST ? process.env.MYSQLHOST : process.env.DB_HOST,
  port: process.env.MYSQLPORT ? process.env.MYSQLPORT : process.env.DB_PORT,
  dialect: "mysql", // Sequelize.Dialect 타입 지정 가능
};

// export default config;
