import  { allow_comment_enum, availibility_enum } from "../../common/enum/post.enum.js";
import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";
import mongoose, { Types } from "mongoose";

export interface IPost {
    content?: string,
     attachments?: string[],
     createdBy:Types.ObjectId,
     tags?:Types.ObjectId[],
     likes?:Types.ObjectId[],
     allowComment?:allow_comment_enum,
     availablity?:availibility_enum,
     folderId:string
}

const postSchema = new mongoose.Schema<IPost>({
    content: {
        type: String,
        min: 1,
        required: function(this){
            return !this.attachments?.length
        }
    },
    attachments: {
        type: [String],
    },
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    tags: {
        type: [Types.ObjectId],
        ref: "User",
    },
    likes: {
        type: [Types.ObjectId],
        ref: "User"
    },
    allowComment: {
        type: String,
        enum: allow_comment_enum,
        default: allow_comment_enum.allow
    },
    availablity: {
        type: String,
        enum: availibility_enum,
        default: availibility_enum.public
    },
    folderId: {
        type: String,
    }
    
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})




const postModel = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema)
export default postModel