import type { Request, Response, NextFunction } from "express";
import type { RoleEnum } from "../enum/user.enum.js";
import { GraphQLError } from "graphql";

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



export const gql_authorize = async(roles:RoleEnum[] =[],role:string) => {

    if (!roles.includes(role as RoleEnum)) {
     throw new GraphQLError("unauthorized", {
       extensions: {
         code: "Forbidden",
         status:403,
         message:"You are not authorized to perform this action"
         } });  
       }

  };