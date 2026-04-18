import type { Types } from "mongoose";
import { redisClient } from "./redis.db.js";

export const revoke_key=({userId,jti}:{userId:Types.ObjectId,jti:string})=>{
return `revoke_token::${userId}::${jti}`
}

export const get_key=({userId}:{userId:Types.ObjectId})=>{
return `revoke_token::${userId}`
}   

export const login_key=({email}:{email:string})=>{
    return `login::${email}`
}
export const loginConfirm_key=({email}:{email:string})=>{
    return `login::${email}::confirm`
}

export const twoStepsVerification_key=({email}:{email:string})=>{
    return `twoStepsVerification::${email}`
}

export const block_login_key=({email}:{email:string})=>{
    return `${login_key({email})}::block`
}
export const otp_key=({email}:{email:string})=>{
    return `otp::${email}`
}

export const max_otp_key=({email}:{email:string})=>{
    return `${otp_key({email})}::max_tries`
}

export const password_otp_key=({email}:{email:string})=>{
    return `${otp_key({email})}::password`
}

export const block_otp_key=({email}:{email:string})=>{
    return `${otp_key({email})}::block`
}

export const set = async ({ key, value, ttl } : { key: string, value: any, ttl?: number}) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return ttl ? await redisClient.set(key, data, { EX: ttl }) : await redisClient.set(key, data);
    } catch (error) {
        console.log("failed to set data in redis", error);
    }
}

export const update = async ({ key, value } : { key: string, value: any}) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0;
        }
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return await redisClient.set(key, data);
    } catch (error) {
        console.log("error on update data in redis", error);
    }
}

export const get=async (key: string) => {
    try {
        try {
            const data = await redisClient.get(key);

        if (!data) return null;
           try {
            return JSON.parse(data);
        } catch {
            return data;
        }
        } catch (error) {
            return await redisClient.get(key);
        }
    } catch (error) {
        console.log("error on get data from redis", error);
    }
}

export const exists=async (key: string) => {
    try {
        return await redisClient.exists(key);
    } catch (error) {
        console.log("error on check exists data from redis", error);
    }
}

export const del=async (key: string) => {
    try {
        if(!key.length) return 0
        return await redisClient.del(key);
    } catch (error) {
        console.log("error on delete data from redis", error);
    }
}

export const ttl=async (key: string) => {
    try {
        return await redisClient.ttl(key);
    } catch (error) {
        console.log("error on get ttl data from redis", error);
    }
}

export const keys = async (pattern: string): Promise<string[]> => {
    try {
        return await redisClient.keys(`${pattern}*`);
    } catch (error) {
        console.log("error on get keys data from redis", error);
        return []; 
    }
}

export const flushall=async () => {
    try {
        return await redisClient.flushAll();
    } catch (error) {
        console.log("error on flushall data from redis", error);
    }
}

export const expire=async (key: string, ttl: number) => {
    try {
        return await redisClient.expire(key, ttl);
    } catch (error) {
        console.log("error on expire data from redis", error);
    }
}

export const incr=async (key: string) => {
    try {
        return await redisClient.incr(key);
    } catch (error) {
        console.log("error on incr data from redis", error);
    }
}