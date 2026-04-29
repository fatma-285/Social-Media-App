import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service.js";
import type { Types } from "mongoose";
import { emailEnum } from "../../common/enum/email.enum.js";

class RedisService{
    private readonly client:RedisClientType
    constructor(){
        this.client=createClient({
            url:REDIS_URL!
        })
        this.handleEvents()
    }

    handleEvents(){
        this.client.on("error", (err) => {
            console.log("Redis Client Error", err)
        });
    }

    async connect(){
            await this.client.connect();
            console.log("redis connected successfully..😀");
        
    }
    
     revoke_key=({userId,jti}:{userId:Types.ObjectId,jti:string})=>{
    return `revoke_token::${userId}::${jti}`
    }
    
     get_key=(userId:Types.ObjectId)=>{
    return `revoke_token::${userId}`
    }   
    
     login_key=(email:string)=>{
        return `login::${email}`
    }
     loginConfirm_key=(email:string)=>{
        return `login::${email}::confirm`
    }
    
     twoStepsVerification_key=(email:string)=>{
        return `twoStepsVerification::${email}`
    }
    
     block_login_key=(email:string)=>{
        return `${this.login_key(email)}::block`
    }
     otp_key=({email,subject=emailEnum.confirmEmail}:{email:string,subject?:string})=>{
        return `otp::${email}::${subject}`
    }
    
     max_otp_key=(email:string)=>{
        return `${this.otp_key({email})}::max_tries`
    }
    
     password_otp_key=(email:string)=>{
        return `${this.otp_key({email})}::password`
    }
    
     block_otp_key=(email:string)=>{
        return `${this.otp_key({email})}::block`
    }
    
     set = async ({ key, value, ttl } : { key: string, value: string | object, ttl?: number}) => {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data);
        } catch (error) {
            console.log("failed to set data in redis", error);
        }
    }
    
     update = async ({ key, value } : { key: string, value: any}) => {
        try {
            if (!await this.client.exists(key)) {
                return 0;
            }
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return await this.client.set(key, data);
        } catch (error) {
            console.log("error on update data in redis", error);
        }
    }
    
     get=async (key: string) => {
        try {
               try {
                return JSON.parse(await this.client.get(key) as string);
            } catch {
                return await this.client.get(key);
            }
            
        } catch (error) {
            console.log("error on get data from redis", error);
        }
    }
    
     exists=async (key: string) => {
        try {
            return await this.client.exists(key);
        } catch (error) {
            console.log("error on check exists data from redis", error);
        }
    }
    
     del=async (key: string|string[]) => {
        try {
            if(!key.length) return 0
            return await this.client.del(key);
        } catch (error) {
            console.log("error on delete data from redis", error);
        }
    }
    
     ttl=async (key: string) => {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            console.log("error on get ttl data from redis", error);
        }
    }
    
     keys = async (pattern: string): Promise<string[]> => {
        try {
            return await this.client.keys(`${pattern}*`);
        } catch (error) {
            console.log("error on get keys data from redis", error);
            return []; 
        }
    }
    
     flushall=async () => {
        try {
            return await this.client.flushAll();
        } catch (error) {
            console.log("error on flushall data from redis", error);
        }
    }
    
     expire=async ({key,ttl}:{key: string, ttl: number}) => {
        try {
            return await this.client.expire(key, ttl);
        } catch (error) {
            console.log("error on expire data from redis", error);
        }
    }
    
     incr=async (key: string) => {
        try {
            return await this.client.incr(key);
        } catch (error) {
            console.log("error on incr data from redis", error);
        }
    }
}

export default new RedisService