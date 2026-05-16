import { Types } from "mongoose";
import mongoose from "mongoose";
import { On_Model_enum } from "../../common/enum/post.enum.js";

export interface IComment {
    content?: string,
    folderId: string,
    attachments?: string[],
    likes?: Types.ObjectId[],
    tags?: Types.ObjectId[],
    createdBy: Types.ObjectId,
    refId: Types.ObjectId,
    onModel:On_Model_enum;
}

const CommentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String,
        min: 1,
        required: function (this) {
            return !this.attachments?.length;
        }
    },
    folderId: String,
    attachments: [String],
    likes: {
        type: [Types.ObjectId],
        ref: "User"
    },
    tags: {
        type: [Types.ObjectId],
        ref: "User"
    },
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    refId: {
        type: Types.ObjectId,
        refPath:"onModel",
        required: true
    },//postId or commentId
    onModel: {
        type: String,
        enum: On_Model_enum,
        required: true
    }//Post Or Comment
}, { timestamps: true,
     toJSON: { virtuals: true },
     toObject: { virtuals: true },
     strictQuery:true
 });

 CommentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "refId",
  });


export default mongoose.model<IComment>("Comment", CommentSchema);