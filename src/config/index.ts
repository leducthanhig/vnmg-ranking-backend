import { config } from "dotenv";
config();

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, HCAPTCHA_SECRET } = process.env;
export const { DB_HOST, DB_PORT, DB_DATABASE } = process.env;
