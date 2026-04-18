import { EventEmitter } from "events";
import { emailEnum } from "../../enum/email.enum.js";

export const eventEmitter=new EventEmitter();

eventEmitter.emit(emailEnum.confirmEmail,async(fn:any)=>{
    await fn();
})