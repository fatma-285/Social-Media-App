import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";
import mongoose from "mongoose";

export interface IUser{
firstName:string,
lastName:string,
userName:string,
email:string,
password:string,
role:RoleEnum,
age:number,
confirmed?:boolean,
phone?:string,
address?:string,
gender?:GenderEnum,
createdAt:Date,
updatedAt:Date,
changeCredentials?: Date,
provider?:ProviderEnum
}

const userSchema=new mongoose.Schema<IUser>({
    firstName:{
        type:String,
        trim:true,
        min:3,
        max:25,
        required:true
    },
    lastName:{
        type:String,
        trim:true,
        min:3,
        max:25,
        required:true
    },
    email:{
        type:String,
        trim:true,
        unique:true,
        required:true
    },
    password:{
        type:String,
        trim:true,
        min:8,
        max:20,
        required:true
    },
    age:{
        type:Number,
        min:18,
        max:60,
        required:true
    },
    phone:{
        type:String,
        trim:true,
    },
    address:{
        type:String,
        trim:true,
    },
    gender:{
        type:String,
        enum:GenderEnum,
        default:GenderEnum.male
    },
    role:{
        type:String,
        enum:RoleEnum,
        default:RoleEnum.user
    },
    provider:{
        type:String,
        enum:ProviderEnum,
        default:ProviderEnum.system
    },
    confirmed:Boolean,
    changeCredentials:Date
},{
    timestamps:true,
    strictQuery:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
})

userSchema.virtual("userName").get(function(){
    return `${this.firstName} ${this.lastName}`
}).set(function(userName){
    const names=userName.split(" ")
    this.firstName=names[0]
    this.lastName=names[1]
})

const userModel=  mongoose.models.User || mongoose.model<IUser>("User",userSchema)
export default userModel