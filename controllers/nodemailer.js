// https://miracleio.me/snippets/use-gmail-with-nodemailer

// Dependencies
const nodemailer = require('nodemailer');

// Configs
const { service, user, pass } = global.configs.nodemailer;

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service, //: 'gmail',
    auth: {
        user, //: 'your@email.com',
        pass, //: 'your-email-password',
    },
});


const send = async ({ to, subject, text }) => {
    await transporter.sendMail({
        from: user,
        to,
        subject,
        text,
    });
};

// Exports
module.exports = { send };