
import type { Request, Response, NextFunction } from "express";
import { appError } from "../../common/utils/global-error-handler.js";
import { type IChangePasswordType, type IConfirmEmailType, type IForgetPasswordType, type ILoginType, type IResendOtpType, type IResetPasswordType, type ISignUpType } from "./auth.dto.js";
import { type IUser } from "../../DB/models/user.model.js";
import type { HydratedDocument } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository.js";
import { encrypt } from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send-email.js";
import { emailTemplete } from "../../common/utils/email/email.templete.js";
import { successResponse } from "../../common/utils/response.success.js";
import tokenService from "../../common/utils/security/token.service.js";
import { CLIENT_ID, REFRESH_SECRET_KEY_ADMIN, REFRESH_SECRET_KEY_USER, SECRET_KEY_ADMIN, SECRET_KEY_USER } from "../../config/config.service.js";
import { randomUUID } from "node:crypto";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";
import redisService from "../../common/service/redis.service.js";
class AuthService {

    private readonly _userRepo= new UserRepository()
    private readonly _redisService = redisService
    private readonly _tokenService = tokenService
    constructor() { }

    sendEmailOtp = async ({email, fullName}:{email:string,fullName:string}) => {
        const isBlocked = await this._redisService.ttl(this._redisService.block_otp_key( email)) as number
        if (isBlocked&& isBlocked > 0) {
            await  this._redisService.del( this._redisService.max_otp_key( email ))
            throw new appError(`otp blocked for ${isBlocked} seconds`,  400)
        }
        await  this._redisService.del( this._redisService.block_otp_key( email ))
        const ttlSent = await this._redisService.ttl(this._redisService.otp_key( {email} )) as number
        if (ttlSent && ttlSent > 0) {
            throw new appError(`otp sent recently, wait for ${ttlSent} seconds`, 400 )
        }

        const maxOtp = await  this._redisService.get( this._redisService.max_otp_key( email ))
        if (maxOtp >= 3) {
            await  this._redisService.set({ key:  this._redisService.block_otp_key( email ), value: "1", ttl: 60 })
            throw new Error("otp limit exceeded..", { cause: 400 })
        }

        const otp = await generateOtp() 
        // eventEmitter.emit(emailEnum.confirmEmail,async()=>{
        await sendEmail({
            to: email,
            subject: "welcome to SocialMedia app",
            html: emailTemplete(otp.toString(), fullName),
        })
        await  this._redisService.set({ key:  this._redisService.otp_key({ email }), value: Hash({ plainText: `${otp}` }), ttl: 60 * 2 })
        await  this._redisService.incr( this._redisService.max_otp_key(email))

        // })
    }
    signUp = async (req: Request, res: Response, next: NextFunction) => {
        const { firstName, lastName, email, password, cPassword, age, address, phone, gender }: ISignUpType = req.body;
        await this._userRepo.userExist(email);
        const user: HydratedDocument<IUser> = await this._userRepo.create({
            firstName,
            lastName,
            email,
            password: Hash({ plainText: password }),
            age,
            address,
            phone: phone ? encrypt(phone) : null,
            gender
        } as Partial<IUser>); // mean that we can send all properties of IUser but we can also send only some of them
        const otp = await generateOtp()
        // eventEmitter.emit(emailEnum.confirmEmail,async(fn:any)=>{
        // })
        await sendEmail({
            to: email,
            subject: "confirm your account",
            html: emailTemplete(otp.toString(), `${firstName} ${lastName}`),
        })
        await this._redisService.set({ key: this._redisService.otp_key({ email }), value: Hash({ plainText: `${otp}` }), ttl: 60 * 2 })
        await this._redisService.set({ key: this._redisService.max_otp_key(email), value: "1", ttl: 60 * 30 })
        successResponse({ res, status: 200, message: "otp sent to email successfully..👌", data: { user } })
    }

    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
        const { otp, email }: IConfirmEmailType = req.body;
        if (!email || !otp) {
            throw new appError("all fields are required..", 400)
        }
        const otpValue = await this._redisService.get(this._redisService.otp_key({ email, subject: emailEnum.confirmEmail }))
        if (!otpValue) {
            throw new appError("otp expired..", 400)
        }
        if (!Compare({ plainText: otp, cipherText: otpValue })) {
            throw new appError("wrong otp..", 400)
        }
        const user = await this._userRepo.findOneAndUpdate({
            filter: { email, confirmed: { $exists: false }, provider: ProviderEnum.system },
            update: { confirmed: true }
        })
        await this._redisService.del(this._redisService.otp_key({ email }))
        successResponse({ res, status: 200, message: "email confirmed successfully..👌", data: { user } })
    }

    resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email }: IResendOtpType = req.body;
        if (!email) {
            throw new Error("email is required..", { cause: 400 })
        }

        const user = await this._userRepo.findOne({ filter: { email, provider: ProviderEnum.system } })
        if (!user) {
            throw new Error("user not found..", { cause: 400 })
        }
        if (user.confirmed) {
            throw new Error("user already confirmed..", { cause: 400 })
        }

        await this.sendEmailOtp({ email, fullName: `${user.firstName} ${user.lastName}` });

        successResponse({ res, status: 200, message: "otp sent successfully..👌" })
    } catch (error: any) {
        throw new Error(error.message)
    }
}

// ng s -o run
 
    signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { idToken } = req.body;
            console.log({ idToken });
            const client = new OAuth2Client();
            const ticket = await client.verifyIdToken({
                idToken,
                audience: CLIENT_ID!,
            });
            const payload = ticket.getPayload();
            console.log(payload);
            if (!payload) {
                throw new appError("invalid google token", 401);
            }
            const { email, given_name, family_name, email_verified } = payload as TokenPayload;

            if (!email) {
                throw new appError("email not found in google payload", 400);
            }
            let user = await this._userRepo.findOne({ filter: { email } });

            if (!user) {
                //register
                user = await this._userRepo.create({
                    email,
                    firstName: given_name,
                    lastName: family_name,
                    confirmed: email_verified,
                    provider: ProviderEnum.google
                } as Partial<IUser>);
            }
            //login
            if (user.provider !== ProviderEnum.google) {
                throw new Error("provider is not google", { cause: 400 })
            }
            const access_token = this._tokenService.generateToken({
                payload: { id: user._id, email: user.email, role: user.role },
                secret_key: user.role === RoleEnum.user ? SECRET_KEY_USER! : SECRET_KEY_ADMIN!,
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
        const user = await this._userRepo.findOne({ filter: { email } })
        if (!user) {
            await this._redisService.del(this._redisService.login_key(email))
            throw new appError("user not found..🤷", 400)
        }

        if (!user!.confirmed) {
            throw new appError("user not confirmed..", 400)
        }

        if (!Compare({ plainText: password, cipherText: user!.password })) {
            throw new appError("wrong password..", 400)
        }
        const jwtid = randomUUID();

        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email, role: user.role },
            secret_key: user.role === RoleEnum.user ? SECRET_KEY_USER! : SECRET_KEY_ADMIN!,
            options: {
                expiresIn: "1d",
                jwtid
            }
        });
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email, role: user.role },
            secret_key: user.role === RoleEnum.user ? REFRESH_SECRET_KEY_USER! : REFRESH_SECRET_KEY_ADMIN!,
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

            const user = await this._userRepo.findOne({ filter: { email } });
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

            await this._redisService.set({
                key: this._redisService.password_otp_key(email),
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

            const user = await this._userRepo.findOne({ filter: { email } });
            if (!user) {
                throw new Error("user not found..🤷", { cause: 400 })
            }

            const otp_password = await this._redisService.get(this._redisService.password_otp_key(email));
            if (!otp_password) {
                throw new Error("otp expired..", { cause: 400 })
            }

            if (!Compare({ plainText: String(otp), cipherText: String(otp_password) })) {
                throw new Error("wrong otp..", { cause: 400 })
            }

            const hash = Hash({ plainText: password });

            user.password = hash;

            await user.save();

            await this._redisService.del(this._redisService.password_otp_key(email));
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

    getProfile = async (req: Request, res: Response, next: NextFunction) => {
        successResponse({ res, status: 200, message: "user fetched successfully..👌", data: req.user })

    }

    logout = async (req: Request, res: Response, next: NextFunction) => {
        const { flag } = req.query;
        if (!req.user) {
            throw new appError("unauthorized", 401);
        }
        if (flag === "all") {
            req.user.changeCredentials = new Date();
            await req.user.save();

            const userKeys = await this._redisService.keys(this._redisService.get_key(req.user._id));

            if (userKeys.length) {
                await Promise.all(userKeys.map((key) => this._redisService.del(key)));
            }

        } else {
            await this._redisService.set({
                key: this._redisService.revoke_key({ userId: req.user._id, jti: req.decoded?.jti } as any),
                value: `${req.decoded?.jti}`,
                ttl: req.decoded?.exp ? - Math.floor(Date.now() / 1000) : 0
            })
        }
        successResponse({ res })
    }
}

export default new AuthService