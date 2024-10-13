const nodemailer = require('nodemailer');
require('dotenv');
const fs = require('fs');
const path = require('path');

/**
 * EmailService class to send emails using Nodemailer
 * @class EmailService
 * @requires nodemailer
 *
 * @Author Yassin Rahou
 */
class EmailService {

    transporter;

    constructor() {
        this.transporter = null;
    }

    /**
     * Initialize the transporter for sending emails. This method should be called before sending any emails
     * For testing purposes, we are using Ethereal email service. For production, you can use Gmail or any other email service
     *
     * @async
     * @returns {Promise<void>}
     */
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

    /**
     * Send a verification email to the user. The email contains a verification code.
     *
     * @async
     * @param email Email address to send the verification email to
     * @param code Verification code to include in the email
     * @returns {Promise<any>}
     */
    async sendVerificationEmail(email, code) {
        if (!this.transporter) {
            throw new Error('Transporter is not initialized. Call init() first.');
        }

        // Load the email template in the templates folder
        const template = fs.readFileSync(path.join(__dirname, '../templates/verification-email.html'), 'utf-8');

        // Replace the placeholder with the verification code
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
