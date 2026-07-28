import type { Model } from "mongoose";
import BaseRepository from "./BaseRepository.js";
import type { IChat } from "../models/chat.model.js";
import ChatModel from "../models/chat.model.js";

class ChatRepository extends BaseRepository<IChat> {
    constructor(protected readonly model: Model<IChat>= ChatModel) {
        super(model)
    }
}

export default ChatRepository