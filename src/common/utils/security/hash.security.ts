import { compareSync, hashSync } from "bcrypt";
import { SALT_ROUNDS } from "../../../config/config.service.js";

export const Hash=({
    plainText,
    saltRounds=SALT_ROUNDS
}:{
    plainText:string,
    saltRounds?:number
}):string=>{
 return hashSync(plainText,Number(saltRounds));
}

export const Compare=({
    plainText,
    cipherText
}:{
    plainText:string,
    cipherText:string
}):boolean=>{
    return compareSync(plainText,cipherText);
}