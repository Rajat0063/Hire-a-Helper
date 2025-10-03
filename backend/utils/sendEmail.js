const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    sgMail.setApiKey(process.env.EMAIL_PASSWORD); // Use EMAIL_PASSWORD for SendGrid API key
    const msg = {
        to: options.email,
        from: process.env.EMAIL_FROM,
        subject: options.subject,
        text: options.message,
    };
    await sgMail.send(msg);
};

module.exports = sendEmail;