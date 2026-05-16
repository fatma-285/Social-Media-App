import type { Model } from "mongoose";
import BaseRepository from "./BaseRepository.js";
import { appError } from "../../common/utils/global-error-handler.js";
import type { IComment } from "../models/comment.model.js";
import commentModel from "../models/comment.model.js";

class CommentRepository extends BaseRepository<IComment> {
    constructor(protected readonly model: Model<IComment>= commentModel) {
        super(model)
    }
}

export default CommentRepository