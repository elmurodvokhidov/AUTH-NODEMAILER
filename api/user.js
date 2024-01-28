const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");

// signup
router.post('/signup', (req, res) => {
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
        // Checking if user already exist
        User.findOne({ email }).then(result => {
            if (result.length) {
                res.json({
                    status: "FAILED",
                    message: "User with the provided email already exist!"
                })
            }
            else {
                const saltRounds = 10
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword
                    });

                    newUser.save().then(result => {
                        res.json({
                            status: "SUCCESS",
                            message: "Signup successful!",
                            data: result
                        });
                    }).catch(error => {
                        res.json({
                            status: "FAILED",
                            message: "An error occurred while hashing password!"
                        });
                    })
                }).catch(error => {
                    res.json({
                        status: "FAILED",
                        message: "An error occurred while saving user accunt!"
                    });
                })
            }
        }).catch(error => {
            console.log(error);
            res.json({
                status: "FAILED",
                message: "An error occurred while checking for existing user!"
            });
        })
    }
});

// signin
router.post('/signin', (req, res) => {
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
        User.find({ email })
            .then(data => {
                if (data.length) {
                    const hashedPassword = data[0].password;
                    bcrypt.compare(password, hashedPassword).then(result => {
                        if (result) {
                            res.json({
                                status: "SUCCESS",
                                message: "Signin successful!",
                                data: data
                            });
                        }
                        else {
                            res.json({
                                status: "FAILED",
                                message: "Invalid password entered!"
                            });
                        }
                    })
                        .catch(error => {
                            res.json({
                                status: "FAILED",
                                message: "An error occurred while comparing passwords!"
                            });
                        })
                }
                else {
                    res.json({
                        status: "FAILED",
                        message: "Invalid credentials entered!"
                    });
                }
            })
            .catch(error => {
                res.json({
                    status: "FAILED",
                    message: "An error occurred while checking for existing user!"
                });
            })
    }
});

module.exports = router;