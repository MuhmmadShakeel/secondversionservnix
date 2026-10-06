import nodemailer from 'nodemailer'

export async function sendPasswordReset(email, code) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_FROM) throw new Error('Password reset email is not configured.')
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASSWORD ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  })
  await transport.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Reset your Servnix password',
    text: `We received a request to reset your Servnix password. Enter this code in the app within 20 minutes:\n\n${code}\n\nIf you did not request this, you can ignore this message.`,
    html: `<div style="font-family:Arial,sans-serif;color:#301a28;max-width:540px;margin:auto;padding:32px"><p style="color:#c52e6b;font-size:12px;font-weight:bold;letter-spacing:2px">SERVNIX ACCOUNT SECURITY</p><h1 style="font-size:26px">Reset your password</h1><p>Enter this verification code in Servnix. It expires in 20 minutes.</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:28px 0">${code}</p><p style="font-size:13px;color:#806370">If you did not request this, you can ignore this email.</p></div>`,
  })
}
