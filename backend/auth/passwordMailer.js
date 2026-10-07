import nodemailer from 'nodemailer'
import { ApiError } from '../common/utils/ApiError.js'

export async function sendPasswordReset(email, token, clientUrl) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new ApiError(503, 'Password recovery is temporarily unavailable.')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
  const resetUrl = new URL('/reset-password', clientUrl)
  resetUrl.searchParams.set('token', token)
  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Reset your Servnix password',
    text: `Use this link to reset your password. It expires in 20 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
  })
}
