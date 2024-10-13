const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');

/**
 * EmailService class to send emails using Nodemailer
 * @class EmailService
 *
 * @requires nodemailer
 * @requires dotenv
 *
 * @Author: Yassin Rahou
 */
class EmailService {

    transporter;

    constructor() {
        this.transporter = null;
    }

    async init() {
        // Voor test: gebruik Ethereal-service
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_TEST,
                pass: process.env.EMAIL_PASSWORD_TEST
            }
        });

        // Voor productie: gebruik Gmail-service
        // this.transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: process.env.EMAIL, // zorg ervoor dat deze variabelen correct zijn ingesteld
        //         pass: process.env.EMAIL_PASSWORD
        //     }
        // });
    }

    async sendVerificationEmail(email, code) {
        if (!this.transporter) {
            throw new Error('Transporter is not initialized. Call init() first.');
        }

        const template = fs.readFileSync(path.join(__dirname, '../email-templates/verification-email.html'), 'utf-8');

        const content = template.replace('{{verificationcode}}', code);

        const options = {
            from: email,
            to: email,
            subject: 'Email Verification',
            html: content
        };

        try {
            const info = await this.transporter.sendMail(options);
            console.log('Email sent:', info.response);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

            return info.response;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

module.exports = EmailService;
