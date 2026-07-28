import { Server } from "socket.io";
import {Server as HttpServer} from "http"
import { decodedToken_and_fetchUser } from "../../common/middleware/authentication.middleware.js";
import redisService from "../../common/service/redis.service.js";
import chatGateway from "../chat/realtime/chat.gateway.js";

class Socket_Gateway{
    constructor(){}
    InitIo=async(http_server:HttpServer)=>{
        
    const io = new Server(http_server, {
        cors: {
            origin: "*"
        }
    })

    io.use(async (socket, next) => {
        try {
            // console.log("user",socket.handshake.auth);

            const { user } = await decodedToken_and_fetchUser(
                socket.handshake.auth.authorization||socket.handshake.headers.authorization
            )
            socket.data.user=user;
            next()
        } catch (error: any) {
            next(error)
        }
    })

    // io.on("connection", (socket) => {
    //     console.log(socket.id);
    //     console.log("user in socket",socket.data.user);

        // socket.on("sayHi", (data, cb) => {
        //     console.log(data);
        //     socket.emit("sayHiBack", "hi from be")  //بترد عاللي باعت بس   like one tap only that refreshed
        // io.emit("sayHiBack", "hi from be")  //  بترد ع كله ف نفس الوقت
        // socket.broadcast.emit("sayHiBack", "hi from be")  بترد ع كله عدا اللي باعت
        //  socket.to(socketId).emit("sayHiBack", "hi from be")   // بترد ع اللي السوكيت اي دي بتاعه
        //    socket.except(socketId).emit("sayHiBack", "hi from be")   //  بترد ع كله ما عدا اللي باعت واللي السوكت اي دي بتاعه
        //    io.except(socketId).emit("sayHiBack", "hi from be")   //  بترد ع كله عد اللي السوكيت اي دي بتاعه

        //     cb("hi from be") // acknolodgment
        // })
        // socket.on("hi", (data) => {
        //     console.log(data);
        //     socket.emit("sayHiBack", "hi from be")
        // })
        // socket.on("ackHi", (data, cb) => {
        //     console.log(data);
        //     cb("hi from be as ack")
        // })
    //     socket.on("hiFatma", (data) => {
    //         // console.log(data);
    //         socket.to(data.id).emit("hiBack", { message: "hi fatma" })
    //     })
    // })

    //* Multiplexing
    // io.of("/admin").on("connection", (socket) => {
    //     console.log(socket.id);

    //     socket.on("ackHi", (data, cb) => {
    //         console.log(data);
    //         cb("hi from be as admin")
    //         socket.to(data.id).emit("hiBack",{message:"hi fatma"})
    //     })
    // })
    //=================================================================
    io.on("connection",async(socket)=>{
        redisService.addSocket({userId:socket.data.user._id,socketId:socket.id})
        // console.log({userCocketIds:await redisService.getSockets(socket.data.user._id )});
       await chatGateway.registerEvents(socket,io)
    })
    }
}

export default new Socket_Gateway() 