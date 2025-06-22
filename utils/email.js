const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const Transport = require('nodemailer-brevo-transport');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Rana Hesham <${process.env.EMAIL_FROM}>`;
    }

    //a method to create the transport
    newTransport() {
        //if we 're in production send real emails using SendGrid or Brevo
        if (process.env.NODE_ENV === 'production') {
            //Brevo
            return nodemailer.createTransport({
                // service: 'Brevo'
                host: process.env.BREVO_EMAIL_HOST,
                port: process.env.BREVO_EMAIL_PORT,
                auth: {
                    user: process.env.BREVO_USERNAME,
                    pass: process.env.BREVO_PASSWORD,
                },
            });
        }

        //if we're not in production use MailTrap
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,

            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // send the actual email
    async send(template, subject) {
        //1)render HTML based on a bug template
        //we can also pass data into render file
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            },
        );
        //2)define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            //text is important for email delivary rates& spam folders
            //using html-to-text package
            text: htmlToText.convert(html),
        };

        //3)create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token(valid for only 10 minutes)',
        );
    }
};
