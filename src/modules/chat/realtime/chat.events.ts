import type { Server, Socket } from "socket.io";
import chatService from "../chat.service.js";
import redisService from "../../../common/service/redis.service.js";

class Chat_Events {
    constructor() { }

    disConnect = async (socket: Socket) => {
        socket.on("disconnect", async () => {
            await redisService.removeSocket({ userId: socket.data.user._id, socketId: socket.id })
            // console.log({userCocketIdsAfterDisconnect:await redisService.getSockets(socket.data.user._id)});
        })
    }

    sendMessage = async (socket: Socket,io:Server) => {
        socket.on("sendMessage", async (data: any) => {
            await chatService.sendMessage(data,socket,io)
        })
    }
    
    join_room = async (socket: Socket,io:Server) => {
        socket.on("join_room", async (data: any) => {
            await chatService.join_room(data,socket,io)
        })
    }

    sendGroupMessage = async (socket: Socket,io:Server) => {
        socket.on("sendGroupMessage", async (data: any) => {
            await chatService.sendGroupMessage(data,socket,io)
        })
    }
}

export default new Chat_Events