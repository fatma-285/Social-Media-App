import zod from 'zod'
import type { signUpSchema,ILoginSchema,IConfirmEmailSchema,IForgetPasswordSchema,IResetPasswordSchema,IChangePasswordSchema, IResendOtpSchema } from './auth.validation.js';

export type ISignUpType=zod.infer<typeof signUpSchema.body>

export type ILoginType=zod.infer<typeof ILoginSchema.body>

export type IConfirmEmailType=zod.infer<typeof IConfirmEmailSchema.body>

export type IForgetPasswordType=zod.infer<typeof IForgetPasswordSchema.body>

export type IResetPasswordType=zod.infer<typeof IResetPasswordSchema.body>

export type IChangePasswordType=zod.infer<typeof IChangePasswordSchema.body>

export type IResendOtpType=zod.infer<typeof IResendOtpSchema.body>
