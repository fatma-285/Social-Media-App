import type { Request, Response, NextFunction } from "express";

export class appError extends Error {
    constructor(public message:any,public statusCode:number=500) {
        super(message);
        this.message=message;
        this.statusCode=statusCode
    }
}
export const globalErrorHandler = (err:appError,req:Request, res:Response, next:NextFunction) => {
    const status=err.statusCode as number || 500;
    res.status(status).json({
        message:err.message,
        status,
        stack:err.stack
    });
}