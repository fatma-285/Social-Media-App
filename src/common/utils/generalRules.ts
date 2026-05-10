
import zod from "zod"
import { Types } from "mongoose"

export const general_rules = {
    id: zod.string().refine((value)=>{
        return Types.ObjectId.isValid(value)
    },{
        message:"invalid id"
    }),
    file: zod.object({
        feildname: zod.string(),
        originalname: zod.string(),
        encoding: zod.string(),
        mimetype: zod.string(),
        size: zod.number(),
        // destination: zod.string(),
        // filename: zod.string(),
        buffer: zod.any().optional(),
        path: zod.string().optional(),
    })
}