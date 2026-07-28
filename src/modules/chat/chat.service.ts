import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose"
import { S3Service } from "../../common/service/s3.service.js"
import UserRepository from "../../DB/repositories/user.repository.js"
import { appError } from "../../common/utils/global-error-handler.js";
import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { successResponse } from "../../common/utils/response.success.js";
import ChatRepository from "../../DB/repositories/chat.repository.js";
import type { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service.js";
import { log } from "console";


class ChatService {
    private readonly _userRepo = new UserRepository()
    private readonly _chatRepo = new ChatRepository()
    private readonly _s3Service = new S3Service

    constructor() { }
    //*     ===================rest api===============

    getChat = async (req: Request, res: Response) => {
        console.log("getChat called");
    console.log(req.params);
    console.log(req.user);
        const { userId } = req.params;
        let { page, limit = 5 } = req.query as unknown as { page?: number, limit?: number };
        if (page! < 0 || !page) page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        let chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [userId, req.user?._id]
                },
                group: {
                    $exists: false
                },
                // messages: {
                //     $slice: [-(page * limit), limit]
                // }
            },
            options: {
                populate: [{
                    path: "participants",
                }],

            }
        })
        console.log({chat})

        // if (!chat) {
        //     throw new appError("chat not found", 404);
        // }
        if (!chat) {
            chat= await this._chatRepo.create({
                participants: [userId, req.user?._id!],
                createdBy: req.user?._id
            })
            await chat.populate("participants");
        }

        successResponse({ res, message: "Done", data: chat || null })
    }

   getGroupChat = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const chat = await this._chatRepo.findOne({
        filter: {
            _id: groupId,
            participants: {
                $in: [req.user?._id!]
            },
            group: {
                $exists: true
            }
        },
        options: {
            populate: [
                {
                    path: "messages.createdBy",
                },
                {
                    path: "participants",
                }
            ]
        }
    });

    if (!chat) {
        throw new appError("Group not found", 404);
    }

    successResponse({
        res,
        message: "Done",
        data: chat
    });
};

    createGroupChat = async (req: Request, res: Response) => {
        const { group, participants } = req.body;
        let { groupImage } = req.body;
        const createdBy = req.user?._id as Types.ObjectId;
        const dbParticipants = participants.map((participant: string) => {
            return Types.ObjectId.createFromHexString(participant)
        })
        const users = await this._userRepo.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: [createdBy] }
            }
        })

        if (users.length !== participants.length) {
            throw new appError("some users not found", 400)
        }

        const roomId = `${group.replace(/\s+/g, "-")}_${uuidv4()}`;
        if (req?.file) {
            groupImage = await this._s3Service.uploadFile(
                {
                    path: `chat/${roomId}`,
                    file: req.file as Express.Multer.File
                }
            )
        }

        dbParticipants.push(createdBy);

        const chat = await this._chatRepo.create({
            participants: dbParticipants,
            messages: [],
            createdBy,
            group,
            groupImage,
            roomId
        })

        if (!chat) {
            if (groupImage) {
                await this._s3Service.deleteFile(groupImage)
            }
            throw new appError("chat not created", 404)
        }

        successResponse({ res, message: "success", data: chat })
    }


    //*     =================socket====================

    sendMessage = async (data: any, socket: Socket, io: Server) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({
            filter: {
                _id: sendTo
            }
        });
        if (!user) {
            throw new appError("user not found", 404)
        }

        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [sendTo, createdBy]
                },
                group: {
                    $exists: false
                }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            },

        })
        if (!chat) {
            await this._chatRepo.create({
                participants: [sendTo, createdBy],
                messages: [{
                    content,
                    createdBy
                }],
                createdBy
            })
        }

        io.to(await redisService.getSockets(createdBy.toString())).emit("successMessage", { content });
        io.to(await redisService.getSockets(sendTo.toString())).emit("newMessage", { content, from: socket.data.user });
        console.log({ data });


    }

    sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
        const { groupId, content } = data;
        const createdBy = socket.data.user._id;

        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                _id: groupId,
                participants: {
                    $all: [createdBy]
                },
                group: {
                    $exists: true
                }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            },

        })
        if (!chat) {
            throw new appError("chat not found", 404)
        }

        io.to(await redisService.getSockets(createdBy.toString())).emit("successMessage", { content });
        io.to(chat?.roomId!).emit("newMessage", { content, from: socket.data.user, groupId });
        console.log({ data });


    }

    join_room = async (data: any, socket: Socket, io: Server) => {
        const { roomId } = data;
        const chat = await this._chatRepo.findOne({
            filter: {
                roomId,
                participants: {
                    $in: [socket.data.user._id]
                },
                group: { $exists: true }
            }
        })
        if (!chat) {
            throw new appError("chat not found", 404)
        }
        socket.join(chat?.roomId!);
        console.log({ join: chat?.roomId });
    }


}

export default new ChatService