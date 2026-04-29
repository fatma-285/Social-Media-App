import { PREFIX_ADMIN,PREFIX_USER, SECRET_KEY_USER, SECRET_KEY_ADMIN } from "../../config/config.service.js";
import userModel from "../../DB/models/user.model.js";

import type { Request, Response, NextFunction } from "express";
import UserRepository from "../../DB/repositories/user.repository.js";
import redisService from "../service/redis.service.js";
import tokenService from "../utils/security/token.service.js";
import { appError } from "../utils/global-error-handler.js";

export const authentication = async (req:Request, res:Response, next:NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
        throw new appError("unauthorized..", 401)
    }

    //bearer token
    const [prefix, token] = authorization.split(" ");
    if (!prefix ) {
        throw new appError("invalid token prefix..", 401)
    }
    if ( !token) {
        throw new appError("invalid token ..", 401)
    }
let ACCESS_SECRET_KEY="";
if(prefix===PREFIX_ADMIN){
    ACCESS_SECRET_KEY=SECRET_KEY_ADMIN!
}else if (prefix===PREFIX_USER){
    ACCESS_SECRET_KEY=SECRET_KEY_USER!
}else{
    throw new appError("invalid token prefix..", 401)
}
    const decoded =tokenService.verifyToken({
        token,
        secret_key: ACCESS_SECRET_KEY!
    })as any;

    if (!decoded || !decoded?.id) {
        throw new appError("invalid token payload..", 401)
    }
    const userModel = new UserRepository()
    const user = await userModel.findOne({  filter: { _id: decoded.id } });

    if (!user) {
        throw new appError("user not found..🤷", 400)
    }
    if (!user?.confirmed) {
        throw new appError("user not confirmed..", 400)
    }

    // if (user.changeCredentials?.getTime() > decoded.iat * 1000) {
    //     throw new appError("token expired..", 401)})
    // }

    const revokeToken=await redisService.get(redisService.revoke_key({userId:user._id,jti:decoded.jti}));
    if (revokeToken) {
        throw new appError("invalid token revoked..", 401)
    }

    req.user = user;
    req.decoded = decoded;
    next();
}