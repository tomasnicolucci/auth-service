import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
});

interface SendVerificationEmailData {
  email: string;
  token: string;
}

export const sendVerificationEmail = async (
  data: SendVerificationEmailData
): Promise<void> => {
  await transporter.sendMail({
    from: env.smtpFrom,
    to: data.email,
    subject: "Verify your email",
    text: `Your email verification token is: ${data.token}`,
  });
};

interface SendPasswordResetEmailData {
  email: string;
  token: string;
}

export const sendPasswordResetEmail = async (
  data: SendPasswordResetEmailData
): Promise<void> => {
  await transporter.sendMail({
    from: env.smtpFrom,
    to: data.email,
    subject: "Reset your password",
    text: `Your password reset token is: ${data.token}`,
  });
};