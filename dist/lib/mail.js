import nodemailer from 'nodemailer';
export async function sendAdminCreateVerificationEmail(to, code) {
    const host = process.env.SMTP_HOST?.trim();
    if (!host) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[mail] SMTP_HOST not set — verification code for ${to}: ${code}`);
            return;
        }
        throw new Error('Email is not configured (set SMTP_HOST and related env vars on the API).');
    }
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });
    const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER || 'noreply@localhost';
    await transporter.sendMail({
        from,
        to,
        subject: 'Verify new admin account — X-TRIM FIT GYM',
        text: `Your verification code is: ${code}\nIt expires in 15 minutes. If you did not request this, ignore this email.`,
        html: `<p>Your verification code is: <strong style="font-size:1.25rem;letter-spacing:0.1em">${code}</strong></p><p>It expires in 15 minutes.</p>`,
    });
}
