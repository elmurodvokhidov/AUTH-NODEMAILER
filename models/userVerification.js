const mongoose = require("mongoose");

const UserVerificationSchema = new mongoose.Schema({
    userId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date,
});

const UserVerification = mongoose.model("UserVerification", UserVerificationSchema);

module.exports = UserVerification;