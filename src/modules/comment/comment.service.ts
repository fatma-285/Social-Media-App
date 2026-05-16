
import type { Request, Response, NextFunction } from "express";
import { appError } from "../../common/utils/global-error-handler.js";
import UserRepository from "../../DB/repositories/user.repository.js";
import { successResponse } from "../../common/utils/response.success.js";
import tokenService from "../../common/utils/security/token.service.js";
import redisService from "../../common/service/redis.service.js";
import { S3Service } from "../../common/service/s3.service.js";
import type { CommentDTO, CommentIdDTO, UpdateCommentDto } from "./comment.dto.js";
import { Types, type HydratedDocument } from "mongoose";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import notificationService from "../../common/service/notification.service.js";
import { allow_comment_enum, availibility_enum, On_Model_enum } from "../../common/enum/post.enum.js";
import { postAvailibility } from "../../common/utils/post.utils.js";
import CommentRepository from "../../DB/repositories/comment.repository.js";
import PostRepository from "../../DB/repositories/post.repository.js";
import { populate } from "dotenv";
import path from "node:path";
import type { IPost } from "../../DB/models/post.model.js";
import type { IComment } from "../../DB/models/comment.model.js";
class CommentService {

    private readonly _userRepo = new UserRepository()
    private readonly _commentRepo = new CommentRepository()
    private readonly _postRepo = new PostRepository()
    private readonly _redisService = redisService
    private readonly _tokenService = tokenService
    private readonly _s3Service = new S3Service
    private readonly _notificationService = notificationService
    constructor() { }

    createComment = async (req: Request, res: Response, next: NextFunction) => {
        const { postId, commentId } = req.params
        const { content, tags,onModel }: CommentDTO = req.body;
        let mentions: Types.ObjectId[] = [];
        let fcmTokens: string[] = []
        let doc:HydratedDocument<IPost|IComment>|null=null
        if(onModel===On_Model_enum.Post&&!commentId){ // create comment on post
            doc = await this._postRepo.findOne({
                filter: {
                    _id: postId,
                    $or: [
                        ...postAvailibility(req),
                    ],
                    allowComment:allow_comment_enum.allow
    
                }
            })
            if (!doc) {
                throw new appError("post not found or comments is disabled", 404)
            }
        }else if(onModel===On_Model_enum.Comment&&commentId){ // create reply on comment
             let comment= await this._commentRepo.findOne({
            filter: {
                _id:commentId,
                refId:postId!
            },
            options: {
                populate: [{
                    path:"refId",
                    match:{
                        $or:[
                            ...postAvailibility(req)
                        ],
                        allowComment:allow_comment_enum.allow
                    }
                }]
            }
        })
         if (!comment?.refId) {
            throw new appError("comment not found or not allowed", 404)
        }
        doc=comment;
        }

        if(!doc){
            throw new appError("invalid model value", 404)
        }

        const taggedUsers = await this._userRepo.find({
            filter: {
                _id: { $in: tags }
            }
        })

        if (tags && tags?.length !== taggedUsers.length) {
            throw new appError("invalid tags", 400)
        }

        for (const tag of taggedUsers) {
            if (tag._id.toString() === req?.user?._id?.toString()) {
                throw new appError("you can't tag yourself", 400)
            }
            mentions.push(tag._id);
            (await this._redisService.getFCMs(tag._id))?.map((token) => fcmTokens.push(token))
        }

        let urls: string[] = []
        let folderId = randomUUID()
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
                store_type: Store_Enum.memory
            })
        }

        const comment = await this._commentRepo.create({
            attachments: urls,
            content: content!,
            tags: mentions,
            createdBy: req?.user?._id!,
            folderId,
            refId: doc?._id,
            onModel
        } as any)

        if (!comment) {
            await this._s3Service.deleteFiles(urls)
            throw new appError("failed to create comment", 500)
        }

        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You`re mentioned in a comment",
                    body: content || ""
                }
            })
        }

        successResponse({ res, data: comment })
    }

    likeComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params;
        const { flag } = req.params;
        let updateQuery: any = {
            $addToSet: {
                likes: req?.user?._id
            }
        }
        if (flag && flag === "disLike") {
            updateQuery = {
                $pull: {
                    likes: req?.user?._id
                }
            }
        }

        const comment = await this._commentRepo.findOneAndUpdate({
            filter: {
                _id: commentId,
            },
            update: updateQuery
        })

        if (!comment) {
            throw new appError("comment not found", 404)
        }

        successResponse({ res, data: comment })

    }

    updateComment=async(req:Request,res:Response,next:NextFunction)=>{
        const {commentId}=req.params
        const {tags,content,removeAttachment,removeTags}:UpdateCommentDto=req.body
         const comment=await this._commentRepo.findOne({
            filter:{
                _id:commentId,
                createdBy:req?.user?._id!
            }
         })
         if(!comment){
            throw new appError("comment not found or not allowed",404)
         }

         if(removeAttachment?.length){
            const invalidFiles=removeAttachment.filter((file)=>{
                return !comment.attachments?.includes(file)
            })
            if(invalidFiles?.length){
                throw new appError("some paths are not found or invalid",400)
            }
            await this._s3Service.deleteFiles(removeAttachment)
            comment.attachments=comment.attachments?.filter((file)=>{
                return !removeAttachment?.includes(file)
            })as string[]
         }

         const updateTags=new Set(comment?.tags?.map((id)=>id.toString()))

         removeTags?.forEach((tag)=>{
           return updateTags.delete(tag)
         })

        let fcmTokens: string[] = []

        const taggedUsers = await this._userRepo.find({
            filter: {
                _id: { $in: tags }
            }
        })

        if (tags && tags?.length !== taggedUsers.length) {
            throw new appError("invalid tags", 400)
        }

        for (const tag of taggedUsers) {
            if (tag._id.toString() === req?.user?._id?.toString()) {
                throw new appError("you can't tag yourself", 400)
            }
            updateTags.add(tag._id.toString());
            (await this._redisService.getFCMs(tag._id))?.map((token) => fcmTokens.push(token))

            comment.tags=[...updateTags].map((id:string)=>{
                return new Types.ObjectId(id)
            })

        }
        const post=await this._postRepo.findOne({
            filter:{
                _id:comment.refId
            }
        })

        if (req?.files?.length) {
          let urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req?.user?._id}/posts/${post?.folderId}/comments/${comment.folderId}`,
                store_type: Store_Enum.memory
            })
            comment.attachments?.push(...urls)
        }

        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "you`re mentioned in a comment",
                    body: content || ""
                }
            })
        }

        if(content) comment.content=content

        await comment.save()
        successResponse({ res, data: comment })

    }

    deleteComment=async(req:Request,res:Response,next:NextFunction)=>{
        const {commentId}=req.params
        const comment=await this._commentRepo.findOneAndDelete({
            filter:{
                _id:commentId,
                createdBy:req?.user?._id!
            }
        })
        const post=await this._postRepo.findOne({
            filter:{
                _id:comment?.refId,
            }
        })
        if(!post){
            throw new appError("post not found or not allowed",404)
        }
        
        if(!comment){
            throw new appError("comment not found or not allowed",404)
        }

        if(comment?.attachments?.length){
            await this._s3Service.deleteFiles(comment.attachments)
            await this._s3Service.deleteFolder(`users/${req?.user?._id}/posts/${post.folderId}/comments/${comment.folderId}`)
        }

        successResponse({ res,message:"comment deleted successfully" })
    }

// createReplies = async (req: Request, res: Response, next: NextFunction) => {
//         const { postId, commentId } = req.params
//         const { content, tags }: CommentDTO = req.body;
//         let mentions: Types.ObjectId[] = [];
//         let fcmTokens: string[] = []
//         const comment = await this._commentRepo.findOne({
//             filter: {
//                 _id:commentId,
//                 postId:postId!
//             },
//             options: {
//                 populate: [{
//                     path:"postId",
//                     match:{
//                         $or:[
//                             ...postAvailibility(req)
//                         ],
//                         allowComment:allow_comment_enum.allow
//                     }
//                 }]
//             }
//         })
        
//         if (!comment?.postId) {
//             throw new appError("comment not found or not allowed", 404)
//         }
//         const taggedUsers = await this._userRepo.find({
//             filter: {
//                 _id: { $in: tags }
//             }
//         })

//         if (tags && tags?.length !== taggedUsers.length) {
//             throw new appError("invalid tags", 400)
//         }

//         for (const tag of taggedUsers) {
//             if (tag._id.toString() === req?.user?._id?.toString()) {
//                 throw new appError("you can't tag yourself", 400)
//             }
//             mentions.push(tag._id);
//             (await this._redisService.getFCMs(tag._id))?.map((token) => fcmTokens.push(token))
//         }

//         let urls: string[] = []
//         let folderId = randomUUID()
//         if (req?.files) {
//             urls = await this._s3Service.uploadFiles({
//                 files: req.files as Express.Multer.File[],
//                 path: `users/${req?.user?._id}/posts/${(comment.postId as any).folderId}/comments/${folderId}`,
//                 store_type: Store_Enum.memory
//             })
//         }

//      const reply = await this._commentRepo.create({
//             content,
//             mentions,
//             attachments: urls,
//             folderId,
//             createdBy: req?.user?._id,
//             postId: comment.postId._id,
//             commentId: comment._id
//         }as any)

//         if (!reply) {
//             await this._s3Service.deleteFiles(urls)
//             throw new appError("failed to create reply", 500)
//         }

//         if (fcmTokens?.length) {
//             await this._notificationService.sendNotifications({
//                 tokens: fcmTokens,
//                 data: {
//                     title: "New Post",
//                     body: content || ""
//                 }
//             })
//         }

//         successResponse({ res, data: reply })
//     }
}

export default new CommentService