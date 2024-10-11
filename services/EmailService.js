const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendVerificationEmail(email, code) {
        const options = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email Verification',
            text: `Your verification code is: ${code}`
        };

        try {
            const info = await this.transporter.sendMail(options);
            console.log('Email sent:', info.response);
            return info.response;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

module.exports = EmailService;
