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
import { parseArgs } from "node:util";
import { successResponse } from "./common/utils/response.success.js";
import { S3Service } from "./common/service/s3.service.js";
import { pipeline } from "node:stream/promises";


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

        // const user=new userModel({name:"fatma"})
        // await user.updateOne({age:21})
        // console.log("user updated");

        // const user=await userModel.findOne({
        //     firstName:"fatma",
        //     paranoid:false
        // })
        // console.log({user});

    }

    // test()

    checkConnection()

    await RedisService.connect()

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({
            message: "Welcome to my social media app...😎",
        });
    })
 app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as { path: string[] };
        const { download } = req.query as { download: string };
        const Key = path.join("/") as string;
        const url=await new S3Service().getPreSignedUrl({Key,download:download?download:undefined})
        successResponse({res,data:url})
    })

    app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as { path: string[] };
        const { download } = req.query;
        const key = path.join("/") as string;
        const result = await new S3Service().getFile(key);
        const stream = result.Body as NodeJS.ReadableStream;
        res.setHeader("Content-Type", result.ContentType as string);
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        if (download && download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`); // only apply it for  download
        }
        await pipeline(stream, res);
        // successResponse({res,data:path})
    })

    app.get("/get-folder", async (req: Request, res: Response, next: NextFunction) => {
        const {folderName}=req.query as {folderName:string}
        const files=await new S3Service().getFiles(folderName)
        const filesMapped=files.Contents?.map(file=>file.Key)
        successResponse({res,data:filesMapped})
    })

    app.get("/delete-file", async (req: Request, res: Response, next: NextFunction) => {
        const { Key } = req.query as { Key: string };
        const result = await new S3Service().deleteFile(Key);
        successResponse({ res, data: result })
    })

    app.get("/delete-files", async (req: Request, res: Response, next: NextFunction) => {
        const { Keys } = req.body as { Keys: string[] };
        const result = await new S3Service().deleteFiles(Keys);
        successResponse({ res, data: result })
    })
    
    app.get("/delete-folder", async (req: Request, res: Response, next: NextFunction) => {
        const { folderName } = req.body as { folderName: string };
        const result = await new S3Service().deleteFolder(folderName);
        successResponse({ res, data: result })
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