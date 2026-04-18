import type { Model } from "mongoose";
import type { IUser } from "../models/user.model.js";
import BaseRepository from "./BaseRepository.js";
import { appError } from "../../common/utils/global-error-handler.js";
import userModel from "../models/user.model.js";

class UserRepository extends BaseRepository<IUser> {
    constructor(protected readonly model: Model<IUser>= userModel) {
        super(model)
    }

    async userExist(email: string) {
        const user = await this.findOne({filter: { email }} )
        if (user) {
            throw new appError("email already exists", 409)
        }
        return user
    }

}

export default UserRepository