import type { Response } from "express"

export const successResponse = ({
    res,
    status = 200,
    message = "Success",
    data = undefined,
    metaData = undefined
}: {
    res: Response,
    status?: number,
    message?: string,
    data?: any|undefined,
    metaData?: any|undefined
}) => {
    return res.status(status).json({ message, metaData, data })
}