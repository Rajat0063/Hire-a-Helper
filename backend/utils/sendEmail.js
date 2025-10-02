const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // Required for port 587 with TLS
        auth: {
            // Updated to match your .env file
            user: process.env.EMAIL_USERNAME, 
            pass: process.env.EMAIL_PASSWORD, 
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: `Hire-a-Helper <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;