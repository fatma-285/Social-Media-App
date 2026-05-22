import type { ZodType } from "zod";
import type { Request, Response, NextFunction } from "express"
import { appError } from "../utils/global-error-handler.js";
import { GraphQLError } from "graphql";

type reqType = keyof Request;  //body, params, query, headers, ...
type schemaType = Partial<Record<reqType, ZodType>>
/*
Record<reqType, ZodType>
معناها: object فيه keys من نوع reqType
وكل key ليه schema من Zod
Partial<>
يعني مش لازم كل الـ keys تكون موجودة
*/
export const Validation = (schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErrors = [];
        for (const key of Object.keys(schema) as reqType[]) {

            if (!schema[key]) continue

            if (req?.file) {
                req.body.attachment = req.file
            }

            if (req?.files) {
                req.body.attachments = req.files
            }

            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationErrors.push(result.error.message);
            }
        }
        if (validationErrors.length > 0) {
            throw new appError(JSON.parse(validationErrors as unknown as string), 400)
        }
        next()
    }
}




export const gql_validation = (schema: ZodType, data: any) => {
    const validationErrors = [];

    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.issues.map((error: any) => {
            return {
                message: error.message,
                path: error.path[0]
            }
        });
        validationErrors.push(...errors);

    }
    if (validationErrors.length > 0) {
        throw new GraphQLError(JSON.stringify(validationErrors ),
            {
                extensions: {
                    code: "BAD_REQUEST",
                    status: 400,
                    message: "Validation Failed"
                }
            })
    }
}




//? ZOD VALIDATION

//!parse
// try {
//     signUpSchema.parse({ name, email, password })
// } catch (err: any) {
//     throw new Error(err.message)
// }

//!parseAsync
// await signUpSchema.parseAsync(req.body).catch((err: any) => {
//     throw new appError(JSON.parse(err.message))
// })

//!safeParseAsync
// const result=await signUpSchema.safeParseAsync(req.body);
// if (!result.success) {
//     throw new appError(JSON.parse(result.error.message))
// }