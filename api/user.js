const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const UserVerification = require("../models/userVerification.js");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const path = require("path");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    }
    else {
        console.log("Ready for messages");
        console.log(success);
    }
});

// signup
router.post('/signup', (req, res) => {
    let { first_name, last_name, email, password } = req.body;
    first_name = first_name.trim();
    last_name = last_name.trim();
    email = email.trim();
    password = password.trim();

    if (first_name === "" || email === "" || password === "") {
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }
    else if (!/^[a-zA-Z]*$/.test(first_name)) {
        res.json({
            status: "FAILED",
            message: "Invalid first name entered!"
        });
    }
    else if (!/^[a-zA-Z]*$/.test(last_name)) {
        res.json({
            status: "FAILED",
            message: "Invalid last name entered!"
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
        User.find({ email }).then(result => {
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
                        first_name,
                        last_name,
                        email,
                        password: hashedPassword,
                        verified: false
                    });

                    newUser.save().then(result => {
                        sendVerificationEmail(result, res);
                    }).catch(() => {
                        res.json({
                            status: "FAILED",
                            message: "An error occurred while saving user accunt!"
                        });
                    })
                }).catch(() => {
                    res.json({
                        status: "FAILED",
                        message: "An error occurred while hashing password!"
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

const sendVerificationEmail = ({ _id, email }, res) => {
    const currentUrl = "http://localhost:5000/";
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 hours!</b></p><p>Press <a href=${currentUrl + "user/verify/" + _id + "/" + uniqueString} >here</a> to proceed!</p>`
    };

    // Hash the uniqueString
    const saltRounds = 10;
    bcrypt.hash(uniqueString, saltRounds)
        .then(hashedUniqueString => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 21600000,
            });

            newVerification.save()
                .then(() => {
                    transporter.sendMail(mailOptions)
                        .then(() => {
                            res.json({
                                status: "PENDING",
                                message: "Verification email sent!"
                            });
                        })
                        .catch(error => {
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Verification email failed!"
                            });
                        })
                })
                .catch(error => {
                    console.log(error);
                    res.json({
                        status: "FAILED",
                        message: "Couldn't save verification email data!"
                    });
                })
        })
        .catch(() => {
            res.json({
                status: "FAILED",
                message: "An error occurred while hashing email data!"
            });
        })
};

// verify email
router.get('/verify/:userId/:uniqueString', (req, res) => {
    let { userId, uniqueString } = req.params;

    UserVerification.find({ userId })
        .then(result => {
            if (result.length > 0) {
                const { expiresAt } = result[0];
                const hashedUniqueString = result[0].uniqueString;

                if (expiresAt < Date.now()) {
                    UserVerification.deleteOne({ userId })
                        .then(result => {
                            User.deleteOne({ _id: userId })
                                .then(() => {
                                    const message = "Link has expired. Please sign up again!";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                                .catch(error => {
                                    console.log(error);
                                    const message = "Clearing user with expired unique string failed!";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                        })
                        .catch(error => {
                            console.log(error);
                            const message = "An error occurred while clearing expired user verification record!";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                }
                else {
                    bcrypt.compare(uniqueString, hashedUniqueString)
                        .then(result => {
                            if (result) {
                                User.updateOne({ _id: userId }, { verified: true })
                                    .then(() => {
                                        UserVerification.deleteOne({ userId })
                                            .then(() => {
                                                res.sendFile(path.join(__dirname, "../views/verified.html"));
                                            })
                                            .catch(error => {
                                                console.log(error);
                                                const message = "An error occurred while finalizing successful verification!";
                                                res.redirect(`/user/verified/error=true&message=${message}`);
                                            })
                                    })
                                    .catch(error => {
                                        console.log(error);
                                        const message = "An error occurred while updating user record to show verified!";
                                        res.redirect(`/user/verified/error=true&message=${message}`);
                                    })
                            }
                            else {
                                const message = "Invalid verification details passed. Check your inbox!";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            }
                        })
                        .catch(() => {
                            const message = "An error occurred while comparing unique strings!";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                }
            }
            else {
                const message = "Account record doesn't exist or has been verified already. Please sign up or log in!";
                res.redirect(`/user/verified/error=true&message=${message}`);
            }
        })
        .catch(error => {
            console.log(error);
            const message = "An error occurred while checking for existing user verification record";
            res.redirect(`/user/verified/error=true&message=${message}`);
        })
});

// verified page route
router.get('/verified', (req, res) => {
    res.sendFile(path.join(__dirname, "../views/verified.html"));
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
                    if (!data[0].verified) {
                        res.json({
                            status: "FAILED",
                            message: "Email hasn't been verified yet. Check your inbox!"
                        });
                    }
                    else {
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
                            .catch(() => {
                                res.json({
                                    status: "FAILED",
                                    message: "An error occurred while comparing passwords!"
                                });
                            })
                    }
                }
                else {
                    res.json({
                        status: "FAILED",
                        message: "Invalid credentials entered!"
                    });
                }
            })
            .catch(() => {
                res.json({
                    status: "FAILED",
                    message: "An error occurred while checking for existing user!"
                });
            })
    }
});

module.exports = router;