
import type { Request, Response, NextFunction } from "express";
import { appError } from "../../common/utils/global-error-handler.js";
import { type IChangePasswordType, type IConfirmEmailType, type IForgetPasswordType, type ILoginType, type IResetPasswordType, type ISignUpType } from "./auth.validation.js";
import userModel, { type IUser } from "../../DB/models/user.model.js";
import type { HydratedDocument, Model } from "mongoose";
import BaseRepository from "../../DB/repositories/BaseRepository.js";
import UserRepository from "../../DB/repositories/user.repository.js";
import { encrypt } from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send-email.js";
import { emailTemplete } from "../../common/utils/email/email.templete.js";
import { del, get, get_key, keys, login_key, otp_key, password_otp_key, revoke_key, set } from "../../DB/redis/redis.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { generateToken } from "../../common/utils/security/token.service.js";
import { REFRESH_SECRET_KEY, SECRET_KEY } from "../../config/config.service.js";
import { randomUUID } from "node:crypto";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { OAuth2Client } from "google-auth-library";
class AuthService {

    private readonly _userModel = new UserRepository()
    constructor() { }

    signUp = async (req: Request, res: Response, next: NextFunction) => {
        const { userName, email, password, cPassword, age, address, phone, gender }: ISignUpType = req.body;

        await this._userModel.userExist(email);

        const user: HydratedDocument<IUser> = await this._userModel.create({
            userName,
            email,
            password: Hash({ plainText: password }),
            age,
            address,
            phone: phone ? encrypt(phone) : null,
            gender
        } as Partial<IUser>); // mean that we can send all properties of IUser but we can also send only some of them
        const otp = await generateOtp()
        await sendEmail({
            to: email,
            subject: "confirm your account",
            html: emailTemplete(otp.toString(), userName)
        })
        await set({ key: otp_key({ email }), value: Hash({ plainText: `${otp}` }), ttl: 60 * 2 })

        successResponse({ res, status: 200, message: "otp sent to email successfully..👌", data: { user } })
    }

    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
        const { otp, email }: IConfirmEmailType = req.body;
        if (!email || !otp) {
            throw new appError("all fields are required..", 400)
        }
        const otpValue = await get(otp_key({ email }))
        if (!otpValue) {
            throw new appError("otp expired..", 400)
        }
        if (!Compare({ plainText: otp, cipherText: otpValue })) {
            throw new appError("wrong otp..", 400)
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: { email, confirmed: { $exists: false } },
            update: { confirmed: true }
        })
        await del(otp_key({ email }))
        successResponse({ res, status: 200, message: "email confirmed successfully..👌", data: { user } })
    }
    signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { idToken } = req.body;
            console.log({ idToken });
            const client = new OAuth2Client();
            const ticket = await client.verifyIdToken({
                idToken,
                audience: "434943204420-roidgnlijsdckhkud1p5961umadcj412.apps.googleusercontent.com",
            });
            const payload = ticket.getPayload();
            console.log(payload);
            if (!payload) {
                throw new appError("invalid google token", 401);
            }
            const { email, name, email_verified } = payload;
            if (!email) {
                throw new appError("email not found in google payload", 400);
            }
            let user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                //register
                user = await this._userModel.create({
                    email,
                    fullName: name,
                    confirmed: email_verified,
                    provider: ProviderEnum.google
                } as Partial<IUser>);
            }
            //login
            if (user.provider !== ProviderEnum.google) {
                throw new Error("provider is not google", { cause: 400 })
            }
            const access_token = generateToken({
                payload: { id: user._id, email: user.email, role: user.role },
                secret_key: SECRET_KEY!,
                options: {
                    expiresIn: "1d",
                }
            });
            successResponse({ res, message: "user logged in successfully..👌", data: { access_token } })
        } catch (error: any) {
            throw new appError(error.message, error.cause)
        }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password }: ILoginType = req.body;
        if (!email || !password) {
            throw new appError("all fields are required..", 400)
        }
        const user = await this._userModel.findOne({ filter: { email } })
        if (!user) {
            await del(login_key({ email }))
            throw new appError("user not found..🤷", 400)
        }

        if (!user!.confirmed) {
            throw new appError("user not confirmed..", 400)
        }

        if (!Compare({ plainText: password, cipherText: user!.password })) {
            throw new appError("wrong password..", 400)
        }
        const jwtid = randomUUID();

        const access_token = generateToken({
            payload: { id: user._id, email: user.email, role: user.role },
            secret_key: SECRET_KEY!,
            options: {
                expiresIn: "1d",
                jwtid
            }
        });
        const refresh_token = generateToken({
            payload: { id: user._id, email: user.email, role: user.role },
            secret_key: REFRESH_SECRET_KEY!,
            options: {
                expiresIn: "1y",
                jwtid
            }
        });

        successResponse({ res, status: 200, message: "user logged in successfully..👌", data: { access_token, refresh_token } })
    }

    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email }: IForgetPasswordType = req.body;

            const user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                throw new Error("user not found..🤷", { cause: 400 })
            }

            const passwordOtp = await generateOtp();

            await sendEmail({
                to: email,
                subject: "forgot password otp!",
                html: `<h1> your otp is ${passwordOtp}</h1>`,
                attachments: []
            })

            await set({
                key: password_otp_key({ email }),
                value: Hash({ plainText: `${passwordOtp}` }),
                ttl: 60 * 60
            })

            successResponse({ res, message: "otp sent to email successfully..👌" })
        } catch (error: any) {
            throw new appError(error.message, error.cause)
        }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, otp, password }: IResetPasswordType = req.body;

            const user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                throw new Error("user not found..🤷", { cause: 400 })
            }

            const otp_password = await get(password_otp_key({ email }));
            if (!otp_password) {
                throw new Error("otp expired..", { cause: 400 })
            }

            if (!Compare({ plainText: String(otp), cipherText: String(otp_password) })) {
                throw new Error("wrong otp..", { cause: 400 })
            }

            const hash = Hash({ plainText: password });

            user.password = hash;

            await user.save();

            await del(password_otp_key({ email }));
            successResponse({ res })
        } catch (error: any) {
            throw new appError(error.message, error.cause)
        }
    }

    updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        let { oldPassword, newPassword, confirmPassword }: IChangePasswordType = req.body;
        if (!req.user) {
            throw new appError("unauthorized", 401);
        }
        if (!Compare({ plainText: oldPassword, cipherText: req.user.password })) {
            throw new Error("wrong old password..", { cause: 400 })
        }

        const hash = Hash({ plainText: newPassword });

        req.user.password = hash;
        req.user.changeCredentials = new Date();
        await req.user.save();

        successResponse({ res })
    }

    logout = async (req: Request, res: Response, next: NextFunction) => {
        const { flag } = req.query;
        if (!req.user) {
            throw new appError("unauthorized", 401);
        }
        if (flag === "all") {
            req.user.changeCredentials = new Date();
            await req.user.save();

            const userKeys = await keys(get_key({ userId: req.user._id }));

            if (userKeys.length) {
                await Promise.all(userKeys.map((key) => del(key)));
            }

        } else {
            await set({
                key: revoke_key({ userId: req.user._id, jti: req.decoded.jti } as any),
                value: `${req.decoded.jti}`,
                ttl: req.decoded.exp - Math.floor(Date.now() / 1000)
            })
        }
        successResponse({ res })
    }
}

export default new AuthService