const nodemailer = require('nodemailer');
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
        nodemailer.createTestAccount((err, account) => {
            this.transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
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
        const content = template.replace('{{verificationCode}}', code);

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

    /**
     * Send a password reset email to the user. The email contains a password reset link.
     *
     * @async
     * @param email Email address to send the password reset email to
     * @param link Password reset link to include in the email
     * @returns {Promise<any>}
     */
    async sendPasswordResetEmail(email, link) {
        if (!this.transporter) {
            throw new Error('Transporter is not initialized. Call init() first.');
        }

        const template = fs.readFileSync(path.join(__dirname, '../templates/password-reset-email.html'), 'utf-8');

        const content = template.replace('{{resetLink}}', link);

        const options = {
            from: email,
            to: email,
            subject: 'Password Reset',
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
