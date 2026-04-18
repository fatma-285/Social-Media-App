import { resolve } from "node:path";
import { config } from "dotenv";    

const NODE_ENV = process.env.NODE_ENV || "development";
const envPath = resolve(import.meta.dirname, `../../.env.${NODE_ENV}`);
config({ path: envPath });
// (! => mean that definitly not undefined)
export const PORT:number=Number(process.env.PORT)||7000;
export const MONGO_URI:string=process.env.MONGO_URI!;  

export const SECRET_KEY=process.env.SECRET_KEY;
export const SALT_ROUNDS=Number(process.env.SALT_ROUNDS);
export const REFRESH_SECRET_KEY=process.env.REFRESH_SECRET_KEY;
export const PREFIX=process.env.PREFIX;

export const CLOUDINARY_CLOUD_NAME=Number(process.env.CLOUDINARY_CLOUD_NAME);
export const CLOUDINARY_API_KEY=Number(process.env.CLOUDINARY_API_KEY);
export const CLOUDINARY_API_SECRET=Number(process.env.CLOUDINARY_API_SECRET);

export const REDIS_URL=process.env.REDIS_URL;

export const EMAIL=process.env.EMAIL;
export const PASSWORD=process.env.PASSWORD;