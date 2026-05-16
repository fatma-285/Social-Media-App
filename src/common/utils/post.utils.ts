import type { Request } from "express"
import { availibility_enum } from "../enum/post.enum.js"

export const postAvailibility = (req: Request) => {
    return  [
            { availablity: availibility_enum.public },
            { availablity: availibility_enum.only_me, createdBy: req?.user?._id! },
            { availablity: availibility_enum.friends, createdBy: { $in: [...(req?.user?.friends || []), req.user?._id] } },
            { tags: { $in: [req?.user?._id] } }
        ]
}