const express = require('express');
const User = require('../db/model/user.js');
const { isAdmin } = require('../middleware/auth.js');
const router = express.Router();

// Contollers
const { hashing } = require('../controllers/encryption.js');



// Get own user information
router.get('/me', async (req, res) => {
    console.log('req.user')
    try {
        const userId = req.user._id; // Get the user ID from the authenticated user

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});



// Update own user information
router.put('/me', async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const userId = req.user._id; // Get the user ID from the authenticated user

        const user = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ message: 'User information updated successfully.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});



// Create a new user
router.post('/', isAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Hash the password
        // const hashedPassword = await hashing.hash(password);

        // Create a new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,//: hashedPassword,
            role,
        });

        await newUser.save();

        return res.status(201).json({ message: 'User created successfully.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// Get all users
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});


// Create multiple new users
router.post('/batch', isAdmin, async (req, res) => {
    try {
        const usersData = req.body;

        // Hash passwords and create user objects
        const hashedUsers = await Promise.all(
            usersData.map(async (userData) => {
                const { firstName, lastName, email, password, role } = userData;

                // Check if the email is already registered
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return { error: `Email ${email} already registered.` };
                }

                // const hashedPassword = await hashing.hash(password);

                return {
                    firstName,
                    lastName,
                    email,
                    password,//: hashedPassword,
                    role,
                };
            })
        );

        // Create users in bulk
        const createdUsers = await User.create(hashedUsers);

        // Separate successful creations and errors
        const successfulUsers = [];
        const errors = [];
        createdUsers.forEach((user, index) => {
            if (user.error) {
                errors.push(user.error);
            } else {
                successfulUsers.push(user);
            }
        });

        const response = {
            createdUsers: successfulUsers.length,
            errors,
        };

        return res.status(201).json(response);
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});


// Get a user by ID
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});


// Update a user by ID
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, role } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ message: 'User updated successfully.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});


// Delete a user by ID
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});




// Export
module.exports = router;
