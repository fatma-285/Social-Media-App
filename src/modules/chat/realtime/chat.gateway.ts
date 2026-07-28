import type { Socket,Server } from "socket.io"
import chatEvents from "./chat.events.js"

class Chat_Gateway {
    constructor() { }

    registerEvents = async (socket: Socket, io: Server) => {
        await chatEvents.disConnect(socket)
        await chatEvents.sendMessage(socket,io)
        await chatEvents.join_room(socket,io)
        await chatEvents.sendGroupMessage(socket,io)
    }
}
export default new Chat_Gateway