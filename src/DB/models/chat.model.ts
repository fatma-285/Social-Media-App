import mongoose, { Types } from "mongoose";

export interface IMessage {
     createdBy:Types.ObjectId,
     content:string
}
export interface IChat {
    //OVO
     createdBy:Types.ObjectId,
     participants:Types.ObjectId[],
     messages:IMessage[],
     //OVM
     group:string,
     groupImage?:string,
     roomId:string
}

const MessageSchema = new mongoose.Schema<IMessage>({
    content: {
        type: String,
        min: 1,
        required:true
    },
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

const ChatSchema = new mongoose.Schema<IChat>({
    participants: {
        type: [Types.ObjectId],
        ref: "User",
        required: true
    },
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }, 
    messages:[MessageSchema],

    group:String,
    groupImage:String,
    roomId:String
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})


const ChatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema)
export default ChatModel