const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    try {
        sgMail.setApiKey(process.env.EMAIL_PASSWORD); // SendGrid API key
        const fromName = process.env.EMAIL_FROM_NAME || 'Hire-a-Helper';
        const fromEmail = process.env.EMAIL_FROM || 'no-reply@yourdomain.com';
        const msg = {
            to: options.email,
            from: {
                name: fromName,
                email: fromEmail,
            },
            replyTo: options.replyTo || process.env.SUPPORT_EMAIL || fromEmail,
            subject: options.subject,
            text: options.plainText || options.message || '',
            html: options.html || (`<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">${options.message || ''}</div>`),
            tracking_settings: {
                click_tracking: { enable: false },
                open_tracking: { enable: false }
            }
        };
        const res = await sgMail.send(msg);
        return res;
    } catch (err) {
        console.error('sendEmail error:', err && (err.response ? err.response.body : err.message || err));
        throw err;
    }
};

module.exports = sendEmail;