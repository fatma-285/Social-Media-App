import  nodemailer  from "nodemailer";
import { EMAIL, PASSWORD } from "../../../config/config.service.js";
import type Mail from "nodemailer/lib/mailer/index.js";

export const sendEmail=async(mailOptions:Mail.Options)=>{
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL,
          pass: PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `Fatma's SarahaApp <${EMAIL}`,
        ...mailOptions
      });
    console.log("Message sent:", info.messageId);
    return info.accepted.length>0?true:false
}

export const generateOtp=async()=>{
    return Math.floor(Math.random() * 90000+10000);
}