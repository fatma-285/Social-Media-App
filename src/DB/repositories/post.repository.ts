import type { Model } from "mongoose";
import BaseRepository from "./BaseRepository.js";
import { appError } from "../../common/utils/global-error-handler.js";
import type { IPost } from "../models/post.model.js";
import postModel from "../models/post.model.js";

class PostRepository extends BaseRepository<IPost> {
    constructor(protected readonly model: Model<IPost>= postModel) {
        super(model)
    }
}

export default PostRepository