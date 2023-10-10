// Dependencies
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const { hashing } = require('../../controllers/encryption.js');


// FUNCTIONS ----------------------------------------------------------

// Custom validator function to check if the input contains only letters
const lettersOnlyValidator = (value) => {
    return value == '' || /^[A-Za-zا-ي]+$/.test(value);
};


// Schema -------------------------------------------------------------
const userSchema = new mongoose.Schema({
    // avatar: { type: String }, // image url
    firstName: {
        type: String,
        default: '',
        max: 20,
        validate: [
            {
                validator: lettersOnlyValidator,
                message: 'First name must only contain letters.',
            },
        ],
    },
    lastName: {
        type: String,
        default: '',
        max: 20,
        validate: [
            {
                validator: lettersOnlyValidator,
                message: 'Last name must only contain letters.',
            },
        ],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => {
                return /^[\w-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value);
            },
            message: 'Invalid email format',
        },
    },
    password: {
        type: String,
        required: true,
        minlength: 5, // Minimum password length
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'sales', 'marketing', 'support'],
    },
    isAdminApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },
    // Add other user-related fields as needed, such as contact number, profile picture, etc.
},
    // Schema Options
    { // Auto set Dates.
        timestamps: true,
    }
);


// PRE SAVE FUNCTIONS -----------------------------------------------------

// Hash password before saving user to database
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await hashing.hash(user.password, 10);
    }
    next();
});

// Compare password with hashed password for authentication
userSchema.methods.comparePassword = async function(password) {
    const user = this;
    return await hashing.compare(password, user.password);
};



// MODEL : SAVE & EXPORT -------------------------------------------------

// Model
const User = mongoose.model('User', userSchema);

// Exports
module.exports = User;


// -----------------------------------------------------------------------
// Explanation of User Schema Fields:

// firstName (String, required): The first name of the user.
// lastName (String, required): The last name of the user.
// email (String, required, unique): The email address of the user. It is used as a unique identifier for each user.
// password (String, required): The hashed password of the user. It is essential to securely store passwords using encryption/hashing techniques.
// role (String, required, enum): Represents the role of the user within the organization. It can have predefined values such as 'Admin', 'Sales', 'Marketing', or 'Support'. The role determines the user's permissions and access levels within the CRM app.
    // An 'Admin' role might have access to all features and settings.
    // A 'Sales' role might have access to lead and deal management.
    // A 'Marketing' role might have access to campaign and customer segmentation features.
    // A 'Support' role might have access to customer support ticket management.




// With the timestamps option set to true, Mongoose will automatically manage the createdAt and updatedAt fields for you.
// The 'createdAt' field will be set when the document is first created,
// the 'updatedAt' field will be updated whenever the document is modified and saved.