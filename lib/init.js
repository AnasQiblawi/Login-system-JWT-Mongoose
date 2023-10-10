// iniate the app ------------

// Dependencies
const User = require('../db/model/user.js');

// Configs


// Add first Admin User
module.exports = async () => {
    console.log('init')
    const users = await User.find({})
    // if there is not a single user registered in the database then create an admin account.
    if (!users.length) {
        try {
            // Create a new user
            const newUser = new User({
                // firstName,
                // lastName,
                email: 'admin@mail.com',
                password: 'admin123456', //: hashedPassword,
                role: 'admin',
                isAdminApproved: true,
                isVerified: true,
                // verificationCode,
                // verificationCodeExpiresAt,
            });
            // Save
            await newUser.save();
        } catch (error) { console.log }
    }
}