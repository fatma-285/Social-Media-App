import { Router } from "express";
import AuthService from "./auth.service.js"
import { Validation } from "../../common/middleware/validation.js";
import * as authValidation from "./auth.validation.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";

const authRouter = Router();
authRouter.post("/signUp",Validation(authValidation.signUpSchema),AuthService.signUp)
authRouter.post("/signup/Gmail",AuthService.signUpWithGmail)
authRouter.patch("/confirm-email",Validation(authValidation.IConfirmEmailSchema),AuthService.confirmEmail)
authRouter.post("/resend-otp",Validation(authValidation.IResendOtpSchema),AuthService.resendOtp)
authRouter.post("/login",Validation(authValidation.ILoginSchema),AuthService.login)
authRouter.post("/forgot-password",Validation(authValidation.IForgetPasswordSchema),AuthService.forgetPassword)
authRouter.post("/reset-password",Validation(authValidation.IResetPasswordSchema),AuthService.resetPassword)
authRouter.get("/profile",authentication,AuthService.getProfile)
authRouter.patch("/update-password",authentication,Validation(authValidation.IChangePasswordSchema),AuthService.updatePassword)
authRouter.post("/logout",authentication,AuthService.logout)
export default authRouter;
