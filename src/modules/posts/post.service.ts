
import type { Request, Response, NextFunction } from "express";
import { appError } from "../../common/utils/global-error-handler.js";
import UserRepository from "../../DB/repositories/user.repository.js";
import { successResponse } from "../../common/utils/response.success.js";
import tokenService from "../../common/utils/security/token.service.js";
import redisService from "../../common/service/redis.service.js";
import { S3Service } from "../../common/service/s3.service.js";
import PostRepository from "../../DB/repositories/post.repository.js";
import type { PostDTO, PostIdDTO, updatePostDTO } from "./post.dto.js";
import { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum.js";
import notificationService from "../../common/service/notification.service.js";
import { availibility_enum, On_Model_enum } from "../../common/enum/post.enum.js";
import { postAvailibility } from "../../common/utils/post.utils.js";
import { populate } from "dotenv";
import type { ref } from "node:process";
class PostService {

    private readonly _userRepo = new UserRepository()
    private readonly _postRepo = new PostRepository()
    private readonly _redisService = redisService
    private readonly _tokenService = tokenService
    private readonly _s3Service = new S3Service
    private readonly _notificationService = notificationService
    constructor() { }

    createPost = async (req: Request, res: Response, next: NextFunction) => {
        const { content, allowComment, availablity, tags }: PostDTO = req.body;
        let mentions: Types.ObjectId[] = [];
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
            mentions.push(tag._id);
            (await this._redisService.getFCMs(tag._id))?.map((token) => fcmTokens.push(token))
        }

        let urls: string[] = []
        let folderId = randomUUID()
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: Store_Enum.memory
            })
        }

        const post = await this._postRepo.create({
            attachments: urls,
            content: content!,
            allowComment,
            availablity,
            tags: mentions,
            createdBy: req?.user?._id!,
            folderId
        } as any)

        if (!post) {
            await this._s3Service.deleteFiles(urls)
            throw new appError("failed to create post", 500)
        }

        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "New Post",
                    body: content || ""
                }
            })
        }

        successResponse({ res })
    }

    getPosts = async (req: Request, res: Response, next: NextFunction) => {
        const searchQuery = req?.query?.search ? {
            content: { $regex: req?.query?.search, $options: "i" }
        } : {}
        const posts = await this._postRepo.find({
            filter: {
                $or: [
                    ...postAvailibility(req),
                ],
            }
        })

        const paginatedPosts = await this._postRepo.paginate({
            page: +req?.query?.page!,
            limit: +req?.query?.limit!,
            search: {
                $or: [
                    ...postAvailibility(req),
                ],
                ...searchQuery
            },
            populate: [
                {
                    path: "comments",
                    match: {
                        onModel: On_Model_enum.Post
                    },
                    populate: {
                        path: "replies",
                        match: {
                            onModel: On_Model_enum.Comment
                        }
                    }
                }
            ]
        })

        // let doc=[]
        // for (const post of posts) {
        //    const comments=await this._commentRepo.find({
        //        filter: {
        //            postId: post._id,
        //        }
        //    })
        //    doc.push({
        //       ...post.toObject(),
        //        comments
        //    })
        // }

        successResponse({ res, metaData: paginatedPosts })
    }

    getPost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                ...postAvailibility(req),
            }
        })
        if (!post) {
            throw new appError("post not found or not allowed", 404)
        }
        successResponse({ res, data: post })
    }

    likePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;
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

        const post = await this._postRepo.findOneAndUpdate({
            filter: {
                _id: postId,
                ...postAvailibility(req),
            },
            update: updateQuery
        })

        if (!post) {
            throw new appError("post not found or not allowed", 404)
        }

        successResponse({ res, data: post })

    }

    updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params
        const { allowComment, availablity, tags, content, removeAttachment, removeTags }: updatePostDTO = req.body
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                createdBy: req?.user?._id!
            }
        })
        if (!post) {
            throw new appError("post not found or not allowed", 404)
        }
        if (removeAttachment?.length) {
            const invalidFiles = removeAttachment.filter((file) => {
                return !post.attachments?.includes(file)
            })
            if (invalidFiles?.length) {
                throw new appError("some paths are not found or invalid", 400)
            }
            await this._s3Service.deleteFiles(removeAttachment)
            post.attachments = post.attachments?.filter((file) => {
                return !removeAttachment?.includes(file)
            }) as string[]
        }

        const updateTags = new Set(post?.tags?.map((id) => id.toString()))

        removeTags?.forEach((tag) => {
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

            post.tags = [...updateTags].map((id: string) => {
                return new Types.ObjectId(id)
            })

        }

        if (req?.files?.length) {
            let urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req?.user?._id}/posts/${post.folderId}`,
                store_type: Store_Enum.memory
            })
            post.attachments?.push(...urls)
        }

        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "New Post",
                    body: content || ""
                }
            })
        }

        if (content) post.content = content
        if (availablity) post.availablity = availablity
        if (allowComment) post.allowComment = allowComment

        await post.save()
        successResponse({ res, data: post })

    }

    deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params
        const post = await this._postRepo.findOneAndDelete({
            filter: {
                _id: postId,
                createdBy: req?.user?._id!
            }
        })
        if (!post) {
            throw new appError("post not found or not allowed", 404)
        }
        if (post.attachments?.length) {
            await this._s3Service.deleteFiles(post.attachments)
            await this._s3Service.deleteFolder(`users/${req?.user?._id}/posts/${post.folderId}`)
        }
        successResponse({ res, message: "post deleted successfully" })
    }
}

export default new PostService