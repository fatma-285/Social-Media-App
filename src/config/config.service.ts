import { resolve } from "node:path";
import { config } from "dotenv";    

const NODE_ENV = process.env.NODE_ENV || "development";
const envPath = resolve(import.meta.dirname, `../../.env.${NODE_ENV}`);
config({ path: envPath });
// (! => mean that definitly not undefined)
export const PORT:number=Number(process.env.PORT)||7000;
export const MONGO_URI:string=process.env.MONGO_URI!;  

export const SECRET_KEY_USER=process.env.SECRET_KEY_USER;
export const SECRET_KEY_ADMIN=process.env.SECRET_KEY_ADMIN;
export const SALT_ROUNDS=Number(process.env.SALT_ROUNDS);
export const REFRESH_SECRET_KEY_USER=process.env.REFRESH_SECRET_KEY_USER;
export const REFRESH_SECRET_KEY_ADMIN=process.env.REFRESH_SECRET_KEY_ADMIN;
export const PREFIX_USER=process.env.PREFIX_USER;
export const PREFIX_ADMIN=process.env.PREFIX_ADMIN;

export const CLOUDINARY_CLOUD_NAME=Number(process.env.CLOUDINARY_CLOUD_NAME);
export const CLOUDINARY_API_KEY=Number(process.env.CLOUDINARY_API_KEY);
export const CLOUDINARY_API_SECRET=Number(process.env.CLOUDINARY_API_SECRET);

export const REDIS_URL=process.env.REDIS_URL;

export const CLIENT_ID=process.env.CLIENT_ID;

export const EMAIL=process.env.EMAIL;
export const PASSWORD=process.env.PASSWORD;

export const AWS_REGION=process.env.AWS_REGION;
export const AWS_ACCESS_KEY_ID=process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY=process.env.AWS_SECRET_ACCESS_KEY;

