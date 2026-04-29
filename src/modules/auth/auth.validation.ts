import zod from "zod"
import { GenderEnum } from "../../common/enum/user.enum.js"

//* //// sign up ////

export const signUpSchema = {
    body: zod.object({
        firstName: zod.string({error:"name is required"}).min(3).max(25),
        lastName: zod.string({error:"name is required"}).min(3).max(25),
        email: zod.email(),
        password: zod.string().min(8).max(20),
        cPassword: zod.string().min(8).max(20),
        age:zod.number().min(18).max(60),
        address:zod.string().min(5).max(100).optional(),
        phone:zod.string().min(3).max(25).optional(),
        gender:zod.enum(GenderEnum).optional(),
    })
    .refine(({ password, cPassword }) => password === cPassword, {
        message: "passwords do not match",
        path: ["cPassword"],
    })

    // .superRefine(({ password, cPassword }, ctx) => {
    //     if (password !== cPassword) {
    //         ctx.addIssue({
    //             code: "custom",
    //             message: "passwords do not match",
    //             path: ["cPassword"],
    //         });
    //     }
    //     if (password !== cPassword) {
    //         ctx.addIssue({
    //             code:"custom",
    //             message: "passwords do not match",
    //             path: ["cPassword"],
    //         });
    //     }
    // })
    ,
}


//* //// resend otp ////
export const IResendOtpSchema={
    body: zod.object({
        email: zod.email(),
    })
}

//* //// login ////

export const ILoginSchema={
     body: IResendOtpSchema.body.safeExtend({
        password: zod.string().min(8).max(20),
    })
}

//* //// confirm email ////

export const IConfirmEmailSchema={
    body: zod.object({
        email: zod.email(),
        otp:zod.string().regex(/^\d{5}$/),
    })
}

//* //// forget password ////

export const IForgetPasswordSchema={
    body: zod.object({
        email: zod.email(),
    })
}


//* //// reset password ////

export const IResetPasswordSchema={
    body: zod.object({
        email: zod.email(),
        otp:zod.string(),
        password: zod.string().min(8).max(20),
    })
}

//* //// change password ////

export const IChangePasswordSchema={
    body: zod.object({
        oldPassword: zod.string().min(8).max(20),
        newPassword: zod.string().min(8).max(20),
        confirmPassword: zod.string().min(8).max(20),
    })
}