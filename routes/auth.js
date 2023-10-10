// Dependencies
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../db/model/user');
// const jwt = require('jsonwebtoken'); // make login sessions
const { generateToken, authenticateToken, isAdmin } = require('../middleware/auth'); // Import middleware
const mailer = require('../controllers/nodemailer.js');


// Contollers
const { hashing, crypting } = require('../controllers/encryption.js');


// Configs
const { secretKey, cookieName, tokenExpiresDuration } = global.configs.JWT; // require('../config.js');



// Custom middleware for applying multiple rate limiters
const verificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Allow only 5 requests per hour
  message: 'Too many verification code requests. Please try again later.',
});



// General Rate Limiter
const generalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minutes.
  max: 5, // Allow only 3 requests per 5 Minutes.
  message: 'Too many requests, Please try again later.',
});







// Register
router.post('/register', generalRateLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;


    // Check if the email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      switch (true) {
        case !existingUser.isVerified:
          // Account not verified, check expiration time
          if (existingUser.verificationCodeExpiresAt > new Date()) {
            const timeRemaining = Math.ceil((existingUser.verificationCodeExpiresAt - new Date()) / (1000 * 60)); // Time remaining in minutes, between now and code expiration time
            return res.status(400).send({ error: `Account verification code is still valid. You have ${timeRemaining} minutes left.` });
          } else {
            return res.status(400).send({ error: 'Your account verification code has expired. Request a new code to proceed.' });
          }
          break;

        case !existingUser.isAdminApproved:
          return res.status(400).send({ error: 'Your account is not yet approved by the admin. Please wait for approval.' });
          break;

        default:
          return res.status(409).json({ message: 'Email already registered.' });
      }
    }


        
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Six Random Digits    
    const verificationCodeExpiresAt = new Date(); // new Date(new Date().getTime() + (30 * 1000 * 60))
    verificationCodeExpiresAt.setMinutes(verificationCodeExpiresAt.getMinutes() + 30); // Expire in 30 minutes
    // Generate verification code hash
    const verificationCodeDataEncrypted = await crypting.encrypt(`${email}:${verificationCode}`);


    // Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, //: hashedPassword,
      role,
      verificationCode,
      verificationCodeExpiresAt,
    });


    // Save
    await newUser.save();

    // // Send verification email
    // const mailOptions = {
    //   to: email,
    //   subject: 'Account Verification',
    //   text: `Your verification code: ${verificationCode}, \n Click the following link to verify your account: http://yourapp.com/verify?code=${verificationCodeDataEncrypted}`,
    // };

    // await mailer.send(mailOptions);


    // Generate a JWT token for the new user with an expiration duration.
    // const token = jwt.sign({ _id: newUser._id, role: newUser.role }, secretKey, {
    //   expiresIn: tokenExpiresDuration, // Token expires duration
    // });
    const token = generateToken({ _id: newUser._id, role: newUser.role });
    

    // Set the token as an HTTP-only cookie
    res.cookie(cookieName, token, { httpOnly: true });


    return res.status(201).json({ message: 'Account registered successfully. Check your email for verification.', token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error, message: 'Server error.' });
  }
});




// Resend verification code
router.post('/resend-verification', verificationCodeLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).send({ error: 'Email is already verified.' });
    }


    const currentTime = new Date();
    const expiresAt = new Date(user.verificationCodeExpiresAt);


    // Verification code is still valid, no need to generate a new one
    if (currentTime < expiresAt) {
      return res.status(200).send({ message: 'Verification code is still valid. No need to resend.' });
    }

        
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Six Random Digits    
    const verificationCodeExpiresAt = new Date(); // new Date(new Date().getTime() + (30 * 1000 * 60))
    verificationCodeExpiresAt.setMinutes(verificationCodeExpiresAt.getMinutes() + 30); // Expire in 30 minutes
    // Generate verification code hash
    const verificationCodeDataEncrypted = await crypting.encrypt(`${email}:${verificationCode}`);


    // Save User
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    // // Send the new verification code to the user's email
    // const mailOptions = {
    //   to: email,
    //   subject: 'Account Verification',
    //   text: `Your verification code: ${verificationCode}, \n Click the following link to verify your account: http://yourapp.com/verify?code=${verificationCodeDataEncrypted}`,
    // };

    // await mailer.send(mailOptions);

    res.status(200).send({ message: 'New verification code sent. Check your email.' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'An error occurred while resending the verification code.' });
  }
});







// Verify user's email
router.get('/verify', generalRateLimiter, async (req, res) => {
  const verificationCodeDataEncrypted = req.query.code || req.body.code;

  try {
    // Decode the hash and split email and expiry time
    const [email, verificationCode] = (await crypting.decrypt(verificationCodeDataEncrypted)).split(':');

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).send({ error: 'Email is already verified.' });
    }

    // Check if user has a verification code
    if (!user.verificationCode) {
      return res.status(400).send({ error: 'User does not have a verification code, request a new one.' });
    }

    // verification code expired
    const currentTime = new Date();
    if (currentTime > new Date(user.verificationCodeExpiresAt)) {
      return res.status(400).send({ error: 'Expired verification code.' });
    }

    // Check if the verification code matches and is not expired
    if (user.verificationCode === verificationCode) {
      // Set the user's verification status to true and clear the verification code
      user.isVerified = true;
      user.verificationCode = null;
      // Save the user to the database
      await user.save();



      // // Send approval email to the admin's email address with the user's email and id
      // const mailOptions = {
      //   from: 'your-email@gmail.com',
      //   to: 'admin-email@gmail.com',
      //   subject: 'User Approval',
      //   text: `A new user with email ${email} and id ${user._id} has registered and verified their account. Please approve or deny their account by using the /admin/approve/:userId route.`
      // };

      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     console.log(error);
      //   } else {
      //     console.log('Email sent: ' + info.response);
      //   }
      // });



      return res.status(200).send({ message: 'Email verified successfully.' });
    }
    
    // Can't verify code for unknown reason.
    return res.status(200).send({ message: 'Code cannot be verified.' });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'An error occurred while verifying email.' });
  }
});





// Admin approves a user account
router.post('/admin/approve/:userId', authenticateToken, isAdmin, async (req, res) => {
  // Get the user id from the request parameters
  const userId = req.params.userId;

  try {
    // Find the user by id
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }

    if (user.isAdminApproved) {
      return res.status(400).send({ error: 'User account is already approved by admin.' });
    }

    // Set the user's admin approval status to true
    user.isAdminApproved = true;

    // Save the user to the database
    await user.save();



    // // Send approval email to the user's email address with a welcome message
    // const mailOptions = {
    //   from: 'your-email@gmail.com',
    //   to: user.email,
    //   subject: 'Account Approval',
    //   text: `Your account has been approved by the admin. You can now log in and access the app features. Welcome to the app!`
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });




    res.status(200).send({ message: 'User account approved by admin.' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'An error occurred while approving user account.' });
  }
});




// Login
router.post('/login', async (req, res) => {
  try {
    // Get email and password from request bod
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // No user found
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }


    // // Compare the provided password with the hashed password
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = await user.comparePassword(password);
    // wrong password
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }



    // Not Verified
    if (!user.isVerified) {
      return res.status(400).send({ error: 'Your account is not verified. Check your email for verification instructions.' });
    }

    // Not Approved by Admin
    if (!user.isAdminApproved) {
      return res.status(400).send({ error: 'Your account is not yet approved by the admin. Please wait for approval.' });
    }



    // Generate a JWT token for the new user with an expiration duration.
    // const token = jwt.sign({ _id: user._id, role: user.role }, secretKey, {
    //   expiresIn: tokenExpiresDuration, // Token expires duration
    // });
    const token = generateToken({ _id: user._id, role: user.role });

    // Set the token as an HTTP-only cookie
    res.cookie(cookieName, token, { httpOnly: true });

    return res.status(200).json({ message: 'Login successful.', token, user: { email: user.email, role: user.role } });
    
    // Error
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error, message: 'Server error.' });
  }
});





// Logout
router.post('/logout', (req, res) => {
  // Clear the JWT cookie
  res.clearCookie(cookieName);
  return res.status(200).json({ message: 'Logged out successfully.' });
});




// // Manually add new users (only Admin can access this)
// router.post('/add-user', authenticateToken, isAdmin, async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, role } = req.body;

//     // Check if the email is already registered
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Email already registered.' });
//     }

//     // Hash the password
//     // const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user
//     const newUser = new User({
//       firstName, lastName,
//       email,
//       password, //: hashedPassword,
//       role,
//     });

//     await newUser.save();

//     return res.status(201).json({ message: 'User added successfully.' });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ error, message: 'Server error.' });
//   }
// });





// Exports
module.exports = router;
