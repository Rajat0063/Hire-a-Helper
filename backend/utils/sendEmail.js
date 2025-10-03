const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;
    // Use SendGrid SMTP if configured
    if (process.env.EMAIL_HOST === 'smtp.sendgrid.net') {
        transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    const mailOptions = {
        from: `Hire-a-Helper <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;