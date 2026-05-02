import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";
import mongoose from "mongoose";
import { appError } from "../../common/utils/global-error-handler.js";
import { Hash } from "../../common/utils/security/hash.security.js";
import type { HydratedDocument } from "mongoose";
import { generateOtp, sendEmail } from "../../common/utils/email/send-email.js";
import { emailTemplete } from "../../common/utils/email/email.templete.js";
import { log } from "node:console";

export interface IUser {
    firstName: string,
    lastName: string,
    userName: string,
    email: string,
    password: string,
    role: RoleEnum,
    age: number,
    profilePic?: string,
    confirmed?: boolean,
    phone?: string,
    address?: string,
    gender?: GenderEnum,
    createdAt: Date,
    updatedAt: Date,
    changeCredentials?: Date,
    provider?: ProviderEnum
}

const userSchema = new mongoose.Schema<IUser>({
    firstName: {
        type: String,
        trim: true,
        min: 3,
        max: 25,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        min: 3,
        max: 25,
        required: function (): boolean {
            if (this.provider === ProviderEnum.google) {
                return false
            }
            return true
        }
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        min: 8,
        max: 20,
        required: function (): boolean {
            if (this.provider === ProviderEnum.google) {
                return false
            }
            return true
        }
    },
    age: {
        type: Number,
        min: 20,
        max: 60,
        required: function (): boolean {
            if (this.provider === ProviderEnum.google) {
                return false
            }
            return true
        }
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: GenderEnum,
        default: GenderEnum.male
    },
    profilePic: String,
    role: {
        type: String,
        enum: RoleEnum,
        default: RoleEnum.user
    },
    provider: {
        type: String,
        enum: ProviderEnum,
        default: ProviderEnum.system
    },
    confirmed: Boolean,
    changeCredentials: Date
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`
})
// .set(function(userName){
//     const names=userName.split(" ")
//     this.firstName=names[0]
//     this.lastName=names[1]
// })

// userSchema.pre("validate",function(){ //before built in validation
//     console.log("-------------------pre validate hook--------------");
//     if(this.age<18){
//         throw new appError("age must be greater than 18",400)
//     }
// })

// userSchema.pre("save", function (this: HydratedDocument<IUser> & { is_new: boolean }) {
//     console.log("-------------------pre save hook--------------");
//     // console.log(this.modifiedPaths());
//     console.log(this);
//     console.log(this.isNew);
//     this.is_new = this.isNew;

//     if (this.isModified("password")) {
//         this.password = Hash({ plainText: this.password })
//     }

// })

// userSchema.post("save", async function () {
//     console.log("-------------------post save hook--------------");
//     const that = this as HydratedDocument<IUser> & { is_new: boolean }
//     if (that.is_new) {
//         const otp = await generateOtp()
//         await sendEmail({
//             to: this.email,
//             subject: "welcome to SocialMedia app",
//             html: emailTemplete(otp.toString(), this.userName),
//         })
//     }
// })

//* Ubdate for Query
userSchema.pre("updateOne",function(){ 
    console.log("-------------------pre updateOne hook--------------");
    log(this)
})

//* Ubdate for Document
userSchema.pre(["updateOne","deleteOne"],{document:true,query:false},function(){ 
    console.log("-------------------pre updateOne hook--------------");
    log(this)
})

//insert many in Model 

userSchema.pre("insertMany",function(doc){
    console.log("-------------------pre insertMAny hook--------------");
    log(this) //model => Model (User)
    console.log(doc);
})

userSchema.post("insertMany",function(doc){
    console.log("-------------------post insertMAny hook--------------");
    log(this)
    console.log(doc);
})

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
userSchema.pre("findOne",function(){
    console.log("-------------------pre findOne hook--------------");
    log(this.getQuery()) 
    // log(this.getFilter()) 
    const {paranoid,...rest}=this.getQuery()
    if(paranoid==false){
        this.setQuery({...rest})
    }else{
        this.setQuery({...rest,deletedAt:{$exists:false}})
    }
})



const userModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema)
export default userModel