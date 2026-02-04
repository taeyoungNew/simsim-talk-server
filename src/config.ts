import dotenv from "dotenv";

dotenv.config({ path: `.env` });

export const {
  PORT,
  MYSQL_URL,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_DATABASE,
  DB_PORT,
  DB_DIALECT,
} = {
  ...process.env,
} as { [key: string]: string };
