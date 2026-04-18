import { PREFIX, SECRET_KEY } from "../../config/config.service.js";
import userModel from "../../DB/models/user.model.js";
import { get, revoke_key} from "../../DB/redis/redis.service.js";

import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/security/token.service.js";
import UserRepository from "../../DB/repositories/user.repository.js";

export const authentication = async (req:Request, res:Response, next:NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
        throw new Error("unauthorized..", { cause: 401 })
    }

    //bearer token
    const [prefix, token] = authorization.split(" ");
    if (prefix !== PREFIX || !token) {
        throw new Error("invalid token prefix..", { cause: 401 })
    }

    const decoded = verifyToken({
        token,
        secret_key: SECRET_KEY!
        , options: {
            // ignoreExpiration:true
        }
    })as any;

    if (!decoded || !decoded?.id) {
        throw new Error("invalid token payload..", { cause: 401 })
    }
const userModel = new UserRepository()
    const user = await userModel.findOne({  filter: { _id: decoded.id } });

    if (!user) {
        throw new Error("user not found..🤷", { cause: 400 })
    }

    // if (user.changeCredentials?.getTime() > decoded.iat * 1000) {
    //     throw new Error("token expired..", { cause: 401 })
    // }

    const revokeToken=await get(revoke_key({userId:user._id,jti:decoded.jti}));
    if (revokeToken) {
        throw new Error("invalid token revoked..", { cause: 401 })
    }

    req.user = user;
    req.decoded = decoded;
    next();
}