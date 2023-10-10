// Dependencies
require('dotenv').config({ path: '.env' });

// Configs
module.exports = {
    port: process.env.PORT || 80, // server listening to this port
    mongoDB_URI: process.env.mongoDB_URI || 'mongodb://127.0.0.1:27017/loginSystem?retryWrites=true&w=majority',
    JWT: {
        secretKey: process.env.SECRET_KEY || 'your-secret-key', // Secure secret key for JWT
        cookieName: process.env.COOKIE_NAME || 'access_token', // Name of the cookie that will store the JWT
        tokenExpiresDuration: process.env.TOKEN_EXPIRE_DURATION || '30d' // how long will a token last, every how maney days will you need to login to your account again.
    },
    // verificationCodeTime: {
    //     expireDuration: 1000 * 60 * 30, // 1000 == 1 second
    //     requestNewWaiteDuration: 1000 * 60 * 3
    // },
    nodemailer: {
        service: process.env.NODMAILER_SERVICE || 'gmail',
        user: process.env.NODMAILER_ACCOUNT_EMAIL || 'you-email@gmail.com',
        pass: process.env.NODMAILER_ACCOUNT_PASSWORD || 'pasword'
    },
    crypting: {
        algorithm: process.env.CRYPTING_ALGORITHM || 'aes-256-cbc',
        secretKey: process.env.CRYPTING_SECRET_KEY || 'crypting_secret_key'
    }
};

