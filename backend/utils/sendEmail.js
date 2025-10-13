const sgMail = require('@sendgrid/mail');

/**
 * sendEmail helper
 * options: { email, subject, message, html, templateId, dynamicTemplateData }
 */
const sendEmail = async (options) => {
    try {
        // support old env var name for backwards compatibility
        const apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_PASSWORD || process.env.EMAIL_API_KEY;
        if (!apiKey) throw new Error('SendGrid API key not configured');
        sgMail.setApiKey(apiKey);

        const fromEmail = process.env.EMAIL_FROM;
        const fromName = process.env.EMAIL_FROM_NAME || 'Hire-a-Helper';
        const msg = {
            to: options.email,
            from: fromEmail ? { email: fromEmail, name: fromName } : fromName,
            subject: options.subject || 'Notification from Hire-a-Helper',
            text: options.message || '',
            html: options.html || `<div>${options.message || ''}</div>`,
            headers: {
                // Encourage unsubscribe handling and better deliverability
                'List-Unsubscribe': `<mailto:${fromEmail || process.env.EMAIL_FROM}>`,
            },
        };

        if (options.replyTo) msg.replyTo = options.replyTo;
        if (options.templateId) {
            msg.templateId = options.templateId;
            if (options.dynamicTemplateData) msg.dynamicTemplateData = options.dynamicTemplateData;
            // When using templateId, SendGrid ignores html/text fields in favor of template
        }

        const res = await sgMail.send(msg);
        return res;
    } catch (err) {
        console.error('sendEmail failed', err && err.message ? err.message : err);
        throw err;
    }
};

module.exports = sendEmail;