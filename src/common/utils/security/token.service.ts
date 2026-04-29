import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";

class TokenService {
    constructor() { }
    generateToken = ({
        payload,
        secret_key,
        options = {}
    }: {
        payload: any,
        secret_key: Secret,
        options?: SignOptions
    }): string => {
        return jwt.sign(payload, secret_key, options);
    }

    verifyToken = ({
        token,
        secret_key,
    }: {
        token: string,
        secret_key: Secret,
    }): JwtPayload => {
        return jwt.verify(token, secret_key) as JwtPayload;
    }
}
export default new TokenService