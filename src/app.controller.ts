import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors"
import helmet from "helmet";
import rateLimit from "express-rate-limit"
import {PORT} from "./config/config.service.js"
import { appError, globalErrorHandler } from "./common/utils/global-error-handler.js";
import authRouter from "./modules/auth/auth.controller.js";
import { checkConnection } from "./DB/connectionDb.js";
import { redisClient, redisConnection } from "./DB/redis/redis.db.js";


const app: express.Application = express();
const port:number=Number(PORT)

const bootstrap = async() => {
    const limiter=rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 100, 
        message: "Too many requests from this IP, please try again after 15 minutes",
        handler: (req:Request, res:Response, next:NextFunction) => {
           throw new appError("Too many requests from this IP, please try again after 15 minutes",429)
        },
        legacyHeaders: false, 
    })
    
    app.use(express.json());
    app.use(cors(),limiter,helmet());

    checkConnection()
    redisConnection()

    app.get("/", (req:Request, res:Response, next:NextFunction) => {
        res.status(200).json({
            message: "Welcome to my social media app....😎",
        });
    })

    app.use("/auth",authRouter)

    app.use("{/*demo}",(req:Request,res:Response,next:NextFunction)=>{
        throw new appError(`url ${req.originalUrl} with method ${req.method} not found`,404)
    })
    app.use(globalErrorHandler)
    app.listen(port, () => {
        console.log("Server is running on port 3000");
    });
}

export default bootstrap