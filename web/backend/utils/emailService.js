const nodemailer = require('nodemailer');

function createTransport() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

exports.sendOtpEmail = async (toEmail, otp) => {
    const transporter = createTransport();
    await transporter.sendMail({
        from: `"Findoor" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'كود إعادة تعيين كلمة المرور — Findoor',
        html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1E88E5,#1565C0);padding:24px;text-align:center;">
                    <h2 style="color:#fff;margin:0;font-size:22px;">Findoor 🏠</h2>
                    <p style="color:#bbdefb;margin:6px 0 0;">بوابة الإسكان الحكومي</p>
                </div>
                <div style="padding:32px;background:#f8fafc;">
                    <p style="color:#263238;font-size:16px;">مرحباً،</p>
                    <p style="color:#475569;font-size:14px;">استخدم الكود التالي لإعادة تعيين كلمة المرور. ينتهي صلاحيته بعد <strong>10 دقائق</strong>.</p>
                    <div style="text-align:center;margin:28px 0;">
                        <span style="display:inline-block;background:#1E88E5;color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px;padding:14px 28px;border-radius:10px;">${otp}</span>
                    </div>
                    <p style="color:#94a3b8;font-size:12px;text-align:center;">إذا لم تطلب هذا الكود، تجاهل هذه الرسالة.</p>
                </div>
            </div>
        `,
    });
};
