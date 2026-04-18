import type { Request, Response, NextFunction } from "express";
import type { RoleEnum } from "../enum/user.enum.js";

export const authorize = (roles:RoleEnum[] =[]) => {
  return (req:Request, res:Response, next:NextFunction) => {
    if (!req.user) {
      return next(new Error("Unauthorized", { cause: 401 }));
    }

    if (!roles.includes(req.user.role)) {
      return next(new Error("Forbidden", { cause: 403 }));
    }

    next();
  };
};
