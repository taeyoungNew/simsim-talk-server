import { Sequelize } from "sequelize";
import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_USERNAME,
  DB_PORT,
} from "../config";
const isProd = process.env.NODE_ENV === "production";

const sequelizeConnection: Sequelize = isProd
  ? new Sequelize(
      process.env.MYSQLDATABASE!,
      process.env.MYSQLUSER!,
      process.env.MYSQLPASSWORD!,
      {
        host: process.env.MYSQLHOST,
        port: Number(process.env.MYSQLPORT),
        dialect: "mysql",
      },
    )
  : new Sequelize(
      DB_DATABASE,
      DB_USERNAME,
      DB_PASSWORD,

      {
        host: DB_HOST,
        dialect: "mysql",
        port: Number(DB_PORT),
      },
    );

export default sequelizeConnection;
