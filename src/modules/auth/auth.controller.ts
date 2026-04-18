import { Router } from "express";
import AuthService from "./auth.service.js"
import { Validation } from "../../common/middleware/validation.js";
import { IChangePasswordSchema, IConfirmEmailSchema, IForgetPasswordSchema, ILoginSchema, IResetPasswordSchema, signUpSchema } from "./auth.validation.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";

const authRouter = Router();
authRouter.post("/signUp",Validation(signUpSchema),AuthService.signUp)
authRouter.post("/confirm-email",Validation(IConfirmEmailSchema),AuthService.confirmEmail)
authRouter.post("/login",Validation(ILoginSchema),AuthService.login)
authRouter.post("/forgot-password",Validation(IForgetPasswordSchema),AuthService.forgetPassword)
authRouter.post("/reset-password",Validation(IResetPasswordSchema),AuthService.resetPassword)
authRouter.patch("/update-password",authentication,Validation(IChangePasswordSchema),AuthService.updatePassword)
authRouter.post("/logout",authentication,AuthService.logout)
export default authRouter;
