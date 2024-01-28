const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");

// signup
router.post('/signup', async (req, res) => {
    let { name, email, password } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if (name === "" || email === "" || password === "") {
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }
    else if (!/^[a-zA-Z]*$/.test(name)) {
        res.json({
            status: "FAILED",
            message: "Invalid name entered!"
        });
    }
    else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered!"
        });
    }
    else if (password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short!"
        });
    }
    else {
        try {
            // Check if user with email already exists
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(400).json({
                    status: "FAILED",
                    message: "User with the provided email already exists!"
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new user
            const newUser = new User({
                name,
                email,
                password: hashedPassword
            });

            // Save the new user to the database
            const savedUser = await newUser.save();

            return res.status(200).json({
                status: "SUCCESS",
                message: "Signup successful!",
                data: savedUser
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: "FAILED",
                message: "An error occurred during signup process."
            });
        }
    }
});

// signin
router.post('/signin', async (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (email === "" || password === "") {
        res.json({
            status: "FAILED",
            message: "Empty credentials supplied!"
        });
    }
    else {
        try {
            // Check if user with email exists
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({
                    status: "FAILED",
                    message: "Invalid credentials entered!"
                });
            }

            // Compare hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                return res.status(200).json({
                    status: "SUCCESS",
                    message: "Signin successful!",
                    // You may choose not to send the user data back in the response
                    // data: user
                });
            } else {
                return res.status(401).json({
                    status: "FAILED",
                    message: "Invalid password entered!"
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: "FAILED",
                message: "An error occurred during sign-in process."
            });
        }
    }
});

module.exports = router;