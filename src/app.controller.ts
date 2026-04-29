import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors"
import helmet from "helmet";
import rateLimit from "express-rate-limit"
import { PORT } from "./config/config.service.js"
import { appError, globalErrorHandler } from "./common/utils/global-error-handler.js";
import authRouter from "./modules/auth/auth.controller.js";
import { checkConnection } from "./DB/connectionDb.js";
import RedisService from "./common/service/redis.service.js";
import userModel from "./DB/models/user.model.js";


const app: express.Application = express();
const port: number = Number(PORT)

const bootstrap = async () => {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again after 15 minutes",
        handler: (req: Request, res: Response, next: NextFunction) => {
            throw new appError("Too many requests from this IP, please try again after 15 minutes", 429)
        },
        legacyHeaders: false,
    })

    app.use(express.json());
    app.use(cors(), limiter, helmet());

    async function test() {
        // const user = new userModel({
        //     firstName: "fatma",
        //     lastName: "refaat",
        //     email: `7Zm7w${Math.random()}@example.com`,
        //     age: 33,
        //     password: "123456",
        // })
        // await user.save({validateBeforeSave: true})

        // user.age=44
        // await user.save();

        const user=new userModel({name:"fatma"})
        await user.updateOne({age:21})
        console.log("user updated");
        
    }

    // test()

    checkConnection()

    await RedisService.connect()

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({
            message: "Welcome to my social media app...😎",
        });
    })

    app.use("/auth", authRouter)

    app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
        throw new appError(`url ${req.originalUrl} with method ${req.method} not found`, 404)
    })
    app.use(globalErrorHandler)
    app.listen(port, () => {
        console.log("Server is running on port 3000");
    });
}

export default bootstrap